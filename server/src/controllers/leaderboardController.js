import { MatchResult } from '../models/MatchResult.js';
import { Tournament } from '../models/Tournament.js';
import { Prize } from '../models/Prize.js';
import { Registration } from '../models/Registration.js';
import { RESULT_STATUS } from '../constants/statuses.js';
import { rankParticipants } from '../services/scoringService.js';
import { cache } from '../config/redis.js';

/**
 * Public Leaderboard (Squad and Individual)
 */
export const getLeaderboards = async (req, res, next) => {
  try {
    const { format = 'squad', tournamentId } = req.query;
    const cacheKey = `leaderboard:${format}:${tournamentId || 'overall'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, ...cached, cached: true });
    }

    const matchQuery = { status: RESULT_STATUS.PUBLISHED };
    if (tournamentId) {
      matchQuery.tournamentId = tournamentId;
    }

    const publishedResults = await MatchResult.find(matchQuery)
      .populate('tournamentId', 'title format matchDate')
      .lean();

    if (format === 'squad') {
      const squadMap = new Map();

      for (const resDoc of publishedResults) {
        if (resDoc.tournamentId?.format !== 'squad') continue;

        for (const entry of resDoc.entries) {
          const squadName = entry.participantName;
          if (!squadMap.has(squadName)) {
            squadMap.set(squadName, {
              squadName,
              registrationId: entry.registrationId,
              matchesPlayed: 0,
              totalKills: 0,
              booyahCount: 0,
              totalPoints: 0,
              wins: 0,
              bestPlacement: 999,
            });
          }

          const current = squadMap.get(squadName);
          current.matchesPlayed += 1;
          current.totalKills += entry.kills || 0;
          current.totalPoints += entry.calculatedPoints || 0;
          if (entry.isBooyah || entry.placement === 1) {
            current.booyahCount += 1;
            current.wins += 1;
          }
          current.bestPlacement = Math.min(current.bestPlacement, entry.placement || 999);
        }
      }

      const squadList = Array.from(squadMap.values()).map((s) => ({
        ...s,
        kills: s.totalKills,
        calculatedPoints: s.totalPoints,
        placement: s.bestPlacement,
      }));

      const rankedSquads = rankParticipants(squadList).map((s, idx) => ({
        rank: idx + 1,
        squadName: s.squadName,
        matchesPlayed: s.matchesPlayed,
        totalKills: s.totalKills,
        booyahCount: s.booyahCount,
        totalPoints: s.totalPoints,
        wins: s.wins,
      }));

      const responsePayload = { format: 'squad', leaderboard: rankedSquads };
      await cache.set(cacheKey, responsePayload, 120);
      return res.json({ success: true, ...responsePayload });
    }

    // Individual Leaderboard
    const playerMap = new Map();

    for (const resDoc of publishedResults) {
      for (const entry of resDoc.entries) {
        // If entry has individual player breakdown:
        if (Array.isArray(entry.playerKills) && entry.playerKills.length > 0) {
          for (const pk of entry.playerKills) {
            const pKey = pk.freeFireUid || pk.playerName;
            if (!playerMap.has(pKey)) {
              playerMap.set(pKey, {
                playerName: pk.playerName,
                freeFireUid: pk.freeFireUid,
                squadName: entry.participantName,
                matchesPlayed: 0,
                totalKills: 0,
                booyahCount: 0,
                totalPoints: 0,
              });
            }
            const p = playerMap.get(pKey);
            p.matchesPlayed += 1;
            p.totalKills += pk.kills || 0;
            p.totalPoints += (pk.kills || 0) * (resDoc.tournamentId?.scoringConfig?.killPointValue || 1);
            if (entry.isBooyah || entry.placement === 1) {
              p.booyahCount += 1;
            }
          }
        } else {
          // Solo format participant
          const pKey = entry.participantName;
          if (!playerMap.has(pKey)) {
            playerMap.set(pKey, {
              playerName: entry.participantName,
              squadName: 'Solo',
              matchesPlayed: 0,
              totalKills: 0,
              booyahCount: 0,
              totalPoints: 0,
            });
          }
          const p = playerMap.get(pKey);
          p.matchesPlayed += 1;
          p.totalKills += entry.kills || 0;
          p.totalPoints += entry.calculatedPoints || 0;
          if (entry.isBooyah || entry.placement === 1) {
            p.booyahCount += 1;
          }
        }
      }
    }

    const playerList = Array.from(playerMap.values()).map((p) => ({
      ...p,
      kills: p.totalKills,
      calculatedPoints: p.totalPoints,
    }));

    const rankedPlayers = rankParticipants(playerList).map((p, idx) => ({
      rank: idx + 1,
      playerName: p.playerName,
      squadName: p.squadName,
      matchesPlayed: p.matchesPlayed,
      totalKills: p.totalKills,
      booyahCount: p.booyahCount,
      totalPoints: p.totalPoints,
    }));

    const responsePayload = { format: 'individual', leaderboard: rankedPlayers };
    await cache.set(cacheKey, responsePayload, 120);
    res.json({ success: true, ...responsePayload });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Winners / Hall of Fame
 */
export const getWinners = async (req, res, next) => {
  try {
    const cacheKey = 'winners:halloffame';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, ...cached, cached: true });
    }

    const prizes = await Prize.find()
      .populate('tournamentId', 'title format matchDate bannerUrl map')
      .populate('winnerRegistrationId', 'teamName players format')
      .sort({ createdAt: -1 })
      .lean();

    // Group prizes by tournament
    const tournamentWinnersMap = new Map();

    for (const p of prizes) {
      const tId = p.tournamentId?._id?.toString();
      if (!tId) continue;

      if (!tournamentWinnersMap.has(tId)) {
        tournamentWinnersMap.set(tId, {
          tournament: p.tournamentId,
          podium: [],
        });
      }

      tournamentWinnersMap.get(tId).podium.push({
        rank: p.rank,
        title: p.title,
        amount: p.amount,
        winnerName: p.winnerName,
        payoutStatus: p.payoutStatus,
        // Only show UID if consented
        players: p.winnerRegistrationId?.players?.map((pl) => ({
          inGameName: pl.inGameName,
          freeFireUid: pl.isConsentPublic ? pl.freeFireUid : undefined,
        })),
      });
    }

    const results = Array.from(tournamentWinnersMap.values());
    const payload = { count: results.length, winners: results };
    await cache.set(cacheKey, payload, 120);
    res.json({ success: true, ...payload });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Player Profile
 */
export const getPlayerProfile = async (req, res, next) => {
  try {
    const { id } = req.params; // search by in-game name or UID
    const registrations = await Registration.find({
      'players.inGameName': { $regex: new RegExp(`^${id}$`, 'i') },
      paymentStatus: 'verified',
    })
      .populate('tournamentId', 'title format matchDate bannerUrl')
      .lean();

    if (registrations.length === 0) {
      return res.status(404).json({ success: false, message: 'Player profile not found' });
    }

    const primaryPlayer = registrations[0].players.find(
      (p) => p.inGameName.toLowerCase() === id.toLowerCase()
    );

    res.json({
      success: true,
      profile: {
        inGameName: primaryPlayer?.inGameName,
        publicUid: primaryPlayer?.isConsentPublic ? primaryPlayer.freeFireUid : null,
        tournamentsCount: registrations.length,
        tournaments: registrations.map((r) => ({
          tournamentTitle: r.tournamentId?.title,
          format: r.format,
          matchDate: r.tournamentId?.matchDate,
          teamName: r.teamName || 'Solo',
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
