import { Match } from '../models/Match.js';
import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { MatchResult } from '../models/MatchResult.js';
import { calculateEntryScore } from '../services/scoringService.js';
import { logAudit } from '../services/auditService.js';
import { RESULT_STATUS, PAYMENT_STATUS } from '../constants/statuses.js';

export const getMatches = async (req, res, next) => {
  try {
    const { tournamentId } = req.query;
    const query = {};
    if (tournamentId) query.tournamentId = tournamentId;

    const matches = await Match.find(query)
      .populate('tournamentId', 'title format matchDate map status')
      .populate('assignedSpectator', 'name email')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    next(error);
  }
};

export const createMatch = async (req, res, next) => {
  try {
    const { tournamentId, matchNumber, roundNumber, scheduledAt, map, assignedSpectator } = req.body;

    const match = await Match.create({
      tournamentId,
      matchNumber: matchNumber || 1,
      roundNumber: roundNumber || 1,
      scheduledAt,
      map: map || 'Bermuda',
      assignedSpectator: assignedSpectator || req.user._id,
      status: 'scheduled',
    });

    res.status(201).json({ success: true, message: 'Match created successfully', match });
  } catch (error) {
    next(error);
  }
};

// Spectator Endpoints
export const getSpectatorAssignments = async (req, res, next) => {
  try {
    const matches = await Match.find({ assignedSpectator: req.user._id })
      .populate('tournamentId', 'title format matchDate map scoringConfig status')
      .sort({ scheduledAt: -1 });

    // For each match, attach approved participants
    const populated = await Promise.all(
      matches.map(async (m) => {
        const registrations = await Registration.find({
          tournamentId: m.tournamentId._id,
          paymentStatus: PAYMENT_STATUS.VERIFIED,
          isApproved: true,
        }).select('referenceId teamName captain players format');

        const existingResult = await MatchResult.findOne({ matchId: m._id });

        return {
          ...m.toObject(),
          participants: registrations,
          submittedResult: existingResult || null,
        };
      })
    );

    res.json({ success: true, matches: populated });
  } catch (error) {
    next(error);
  }
};

export const submitSpectatorResult = async (req, res, next) => {
  try {
    const { id: matchId } = req.params;
    const { entries, notes, evidenceScreenshots } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Entries array is required with match observations' });
    }

    const match = await Match.findById(matchId).populate('tournamentId');
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Verify spectator assignment (unless admin)
    if (req.user.role === 'spectator' && match.assignedSpectator?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not the designated spectator for this match' });
    }

    const scoringConfig = match.tournamentId?.scoringConfig;

    // Calculate points for each entry using tournament scoring configuration
    const computedEntries = entries.map((entry) => {
      const score = calculateEntryScore(entry, scoringConfig);
      return {
        registrationId: entry.registrationId,
        participantName: entry.participantName,
        placement: parseInt(entry.placement, 10),
        kills: score.kills,
        isBooyah: score.isBooyah,
        calculatedPoints: score.calculatedPoints,
        playerKills: entry.playerKills || [],
      };
    });

    let resultDoc = await MatchResult.findOne({ matchId });
    if (resultDoc) {
      resultDoc.entries = computedEntries;
      resultDoc.notes = notes || resultDoc.notes;
      if (evidenceScreenshots) resultDoc.evidenceScreenshots = evidenceScreenshots;
      resultDoc.status = RESULT_STATUS.PENDING_REVIEW;
      resultDoc.recordedBy = req.user._id;
      await resultDoc.save();
    } else {
      resultDoc = await MatchResult.create({
        matchId,
        tournamentId: match.tournamentId._id,
        recordedBy: req.user._id,
        status: RESULT_STATUS.PENDING_REVIEW,
        entries: computedEntries,
        notes: notes || '',
        evidenceScreenshots: evidenceScreenshots || [],
      });
    }

    // Update match status
    match.status = 'completed';
    await match.save();

    await logAudit({
      action: 'SPECTATOR_RESULT_SUBMITTED',
      performedBy: req.user,
      targetEntity: 'MatchResult',
      targetId: resultDoc._id,
      details: `Spectator ${req.user.name} submitted results for match ${match.matchNumber} (${match.tournamentId.title})`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Match results submitted successfully for admin review.',
      result: resultDoc,
    });
  } catch (error) {
    next(error);
  }
};
