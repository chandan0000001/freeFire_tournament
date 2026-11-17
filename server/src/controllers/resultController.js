import { MatchResult } from '../models/MatchResult.js';
import { Match } from '../models/Match.js';
import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { Prize } from '../models/Prize.js';
import { calculateEntryScore, rankParticipants } from '../services/scoringService.js';
import { logAudit } from '../services/auditService.js';
import { RESULT_STATUS, TOURNAMENT_STATUS } from '../constants/statuses.js';
import { cache } from '../config/redis.js';

/**
 * Public: Get published match results
 */
export const getPublishedResults = async (req, res, next) => {
  try {
    const { tournamentId } = req.query;
    const query = { status: RESULT_STATUS.PUBLISHED };
    if (tournamentId) query.tournamentId = tournamentId;

    const results = await MatchResult.find(query)
      .populate('tournamentId', 'title format matchDate bannerUrl map')
      .populate('matchId', 'matchNumber roundNumber map')
      .sort({ publishedAt: -1 })
      .lean();

    // Sanitize entries to guarantee privacy (no emails or private phones)
    const sanitized = results.map((r) => ({
      id: r._id,
      tournament: r.tournamentId,
      match: r.matchId,
      publishedAt: r.publishedAt,
      entries: rankParticipants(r.entries),
    }));

    res.json({ success: true, count: sanitized.length, results: sanitized });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all results (including pending review)
 */
export const getAdminResults = async (req, res, next) => {
  try {
    const { tournamentId, status } = req.query;
    const query = {};
    if (tournamentId) query.tournamentId = tournamentId;
    if (status) query.status = status;

    const results = await MatchResult.find(query)
      .populate('tournamentId', 'title format matchDate scoringConfig prizeConfig')
      .populate('matchId', 'matchNumber map scheduledAt status')
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 });

    // Also fetch captain submitted evidence for each tournament to show side-by-side
    const withCaptainEvidence = await Promise.all(
      results.map(async (r) => {
        const captainEvidenceList = await Registration.find({
          tournamentId: r.tournamentId._id,
          'captainEvidence.0': { $exists: true },
        }).select('referenceId teamName captain captainEvidence');

        return {
          ...r.toObject(),
          captainEvidence: captainEvidenceList,
        };
      })
    );

    res.json({ success: true, count: withCaptainEvidence.length, results: withCaptainEvidence });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Review / Correct Match Scores
 */
export const reviewMatchResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entries, adminReviewNotes, status } = req.body;

    const resultDoc = await MatchResult.findById(id).populate('tournamentId');
    if (!resultDoc) {
      return res.status(404).json({ success: false, message: 'Result record not found' });
    }

    const scoringConfig = resultDoc.tournamentId?.scoringConfig;

    if (Array.isArray(entries)) {
      resultDoc.entries = entries.map((e) => {
        const calculated = calculateEntryScore(e, scoringConfig);
        return {
          registrationId: e.registrationId,
          participantName: e.participantName,
          placement: parseInt(e.placement, 10),
          kills: calculated.kills,
          isBooyah: calculated.isBooyah,
          calculatedPoints: calculated.calculatedPoints,
          playerKills: e.playerKills || [],
        };
      });
    }

    if (adminReviewNotes) resultDoc.adminReviewNotes = adminReviewNotes;
    if (status && Object.values(RESULT_STATUS).includes(status)) {
      resultDoc.status = status;
    }

    resultDoc.verifiedBy = req.user._id;
    await resultDoc.save();

    await logAudit({
      action: 'RESULT_REVIEW_UPDATED',
      performedBy: req.user,
      targetEntity: 'MatchResult',
      targetId: resultDoc._id,
      details: `Admin updated result scores/notes for match ${resultDoc.matchId}. Notes: ${adminReviewNotes || 'None'}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Match results successfully reviewed and updated',
      result: resultDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Verify and Publish final results
 */
export const publishMatchResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultDoc = await MatchResult.findById(id).populate('tournamentId');
    if (!resultDoc) {
      return res.status(404).json({ success: false, message: 'Result record not found' });
    }

    resultDoc.status = RESULT_STATUS.PUBLISHED;
    resultDoc.publishedAt = new Date();
    resultDoc.verifiedBy = req.user._id;
    await resultDoc.save();

    // Update tournament status to completed
    const tournament = await Tournament.findById(resultDoc.tournamentId._id);
    if (tournament) {
      tournament.status = TOURNAMENT_STATUS.COMPLETED;
      await tournament.save();
    }

    // Rank entries according to tie breaker order
    const ranked = rankParticipants(resultDoc.entries);

    // Auto-create or link prizes for 1st, 2nd, 3rd if prize pool is configured
    if (tournament.prizeConfig && ranked.length > 0) {
      const prizeTiers = [
        { rank: 1, title: '1st Place Winner (Booyah Champion)', amount: tournament.prizeConfig.firstPlace },
        { rank: 2, title: '2nd Place (Runner-Up)', amount: tournament.prizeConfig.secondPlace },
        { rank: 3, title: '3rd Place', amount: tournament.prizeConfig.thirdPlace },
      ];

      for (const tier of prizeTiers) {
        if (tier.amount > 0 && ranked[tier.rank - 1]) {
          const winnerEntry = ranked[tier.rank - 1];
          await Prize.findOneAndUpdate(
            { tournamentId: tournament._id, rank: tier.rank },
            {
              tournamentId: tournament._id,
              rank: tier.rank,
              title: tier.title,
              amount: tier.amount,
              winnerRegistrationId: winnerEntry.registrationId,
              winnerName: winnerEntry.participantName,
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    // Selectively invalidate leaderboard and tournament caches so fresh standings load
    await cache.delPattern('leaderboard:*');
    await cache.delPattern('tournaments:*');

    await logAudit({
      action: 'RESULT_PUBLISHED',
      performedBy: req.user,
      targetEntity: 'MatchResult',
      targetId: resultDoc._id,
      details: `Published official results for tournament: "${tournament.title}". Winner: ${ranked[0]?.participantName}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Match results published officially! Public leaderboards and winner records updated.',
      result: resultDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Direct Match Recording & Winner Declaration
 * Allows admin to record match placements, kills, and declare winners in a single intuitive operation
 */
export const directRecordMatchResult = async (req, res, next) => {
  try {
    const {
      tournamentId,
      matchNumber = 1,
      map = 'Bermuda',
      entries,
      notes = '',
      evidenceScreenshots = [],
      autoPublish = true,
    } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ success: false, message: 'Tournament ID is required' });
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one participant score entry is required' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // 1. Find or create Match document
    let match = await Match.findOne({ tournamentId, matchNumber });
    if (!match) {
      match = await Match.create({
        tournamentId,
        matchNumber,
        roundNumber: 1,
        map: map || tournament.map || 'Bermuda',
        scheduledAt: tournament.matchDate || new Date(),
        status: autoPublish ? 'completed' : 'in_progress',
      });
    } else {
      if (autoPublish) match.status = 'completed';
      if (map) match.map = map;
      await match.save();
    }

    // 2. Compute entries using tournament scoringConfig
    const scoringConfig = tournament.scoringConfig || { killPointValue: 1, booyahBonus: 12 };
    const computedEntries = entries.map((entry) => {
      const score = calculateEntryScore(entry, scoringConfig);
      return {
        registrationId: entry.registrationId || null,
        participantName: (entry.participantName || 'Unknown Team').trim(),
        placement: parseInt(entry.placement, 10) || 1,
        kills: score.kills,
        isBooyah: score.isBooyah,
        calculatedPoints: score.calculatedPoints,
        playerKills: entry.playerKills || [],
      };
    });

    // 3. Find or create MatchResult document
    let resultDoc = await MatchResult.findOne({ matchId: match._id });
    if (!resultDoc) {
      resultDoc = new MatchResult({
        matchId: match._id,
        tournamentId: tournament._id,
        recordedBy: req.user._id,
        status: autoPublish ? RESULT_STATUS.PUBLISHED : RESULT_STATUS.PENDING_REVIEW,
        entries: computedEntries,
        notes: notes || '',
        evidenceScreenshots: evidenceScreenshots || [],
      });
    } else {
      resultDoc.entries = computedEntries;
      resultDoc.notes = notes || resultDoc.notes;
      if (evidenceScreenshots && evidenceScreenshots.length > 0) {
        resultDoc.evidenceScreenshots = evidenceScreenshots;
      }
      resultDoc.status = autoPublish ? RESULT_STATUS.PUBLISHED : RESULT_STATUS.PENDING_REVIEW;
      resultDoc.recordedBy = req.user._id;
    }

    if (autoPublish) {
      resultDoc.publishedAt = new Date();
      resultDoc.verifiedBy = req.user._id;
      tournament.status = TOURNAMENT_STATUS.COMPLETED;
      await tournament.save();
    }

    await resultDoc.save();

    // 4. Auto-allocate prizes and clear Redis cache if published
    if (autoPublish) {
      const ranked = rankParticipants(resultDoc.entries);
      if (tournament.prizeConfig && ranked.length > 0) {
        const prizeTiers = [
          { rank: 1, title: '1st Place Winner (Booyah Champion)', amount: tournament.prizeConfig.firstPlace },
          { rank: 2, title: '2nd Place (Runner-Up)', amount: tournament.prizeConfig.secondPlace },
          { rank: 3, title: '3rd Place', amount: tournament.prizeConfig.thirdPlace },
        ];

        for (const tier of prizeTiers) {
          if (tier.amount > 0 && ranked[tier.rank - 1]) {
            const winnerEntry = ranked[tier.rank - 1];
            await Prize.findOneAndUpdate(
              { tournamentId: tournament._id, rank: tier.rank },
              {
                tournamentId: tournament._id,
                rank: tier.rank,
                title: tier.title,
                amount: tier.amount,
                winnerRegistrationId: winnerEntry.registrationId,
                winnerName: winnerEntry.participantName,
              },
              { upsert: true, new: true }
            );
          }
        }
      }

      await cache.delPattern('leaderboard:*');
      await cache.delPattern('tournaments:*');
      await cache.delPattern('winners:*');
    }

    await logAudit({
      action: autoPublish ? 'RESULT_PUBLISHED' : 'MATCH_RESULT_RECORDED',
      performedBy: req.user,
      targetEntity: 'MatchResult',
      targetId: resultDoc._id,
      details: `${autoPublish ? 'Recorded and published' : 'Recorded'} match result for tournament: "${tournament.title}". Winner: ${computedEntries[0]?.participantName || 'N/A'}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: autoPublish
        ? `Match result officially published! "${computedEntries[0]?.participantName || 'Winner'}" declared champion.`
        : 'Match result saved to review queue.',
      result: resultDoc,
      published: autoPublish,
    });
  } catch (error) {
    next(error);
  }
};

