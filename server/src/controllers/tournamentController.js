import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { Match } from '../models/Match.js';
import { MatchResult } from '../models/MatchResult.js';
import { Prize } from '../models/Prize.js';
import { TOURNAMENT_STATUS } from '../constants/statuses.js';
import { logAudit } from '../services/auditService.js';
import { escapeRegex } from '../utils/security.js';

export const getTournaments = async (req, res, next) => {
  try {
    const { status, format, search, limit } = req.query;



    const query = { isPublic: true, status: { $ne: 'draft' } };

    if (status) {
      if (status.split(',').includes('draft')) return res.json({ success: true, tournaments: [], count: 0 });
      // Support comma-separated statuses e.g. status=registration_open,upcoming
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }
    if (format) {
      query.format = format;
    }
    if (search && typeof search === 'string' && search.trim()) {
      query.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    let tournamentQuery = Tournament.find(query);
    const tournaments = await tournamentQuery.lean();

    const STATUS_PRIORITY = {
      registration_open: 1,
      upcoming: 2,
      live: 3,
      room_ready: 4,
      full: 5,
      registration_closed: 6,
      completed: 7,
      cancelled: 8,
    };

    // Prioritize open registrations in 1st position, followed by nearest upcoming matches
    tournaments.sort((a, b) => {
      const rankA = STATUS_PRIORITY[a.status] || 99;
      const rankB = STATUS_PRIORITY[b.status] || 99;
      if (rankA !== rankB) return rankA - rankB;
      const dateA = new Date(a.matchDate || 0).getTime();
      const dateB = new Date(b.matchDate || 0).getTime();
      return dateA - dateB;
    });

    const sliced = limit
      ? tournaments.slice(0, Math.max(1, Math.min(100, Number(limit) || 100)))
      : tournaments;

    // Trust denormalized registeredSlots maintained atomically by syncTournamentSlots/reserveSlot
    const formatted = sliced.map((t) => {
      const slots = t.registeredSlots || 0;
      return {
        ...t,
        registeredSlots: slots,
        remainingSlots: t.status === TOURNAMENT_STATUS.FULL ? 0 : Math.max(0, t.maxSlots - slots),
      };
    });

    const responsePayload = {
      success: true,
      count: formatted.length,
      tournaments: formatted,
    };



    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export const getTournamentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;


    const tournament = await Tournament.findOne({ slug: slug.toLowerCase(), isPublic: true, status: { $ne: 'draft' } }).lean();
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const slots = tournament.registeredSlots || 0;
    const result = {
      ...tournament,
      registeredSlots: slots,
      remainingSlots: tournament.status === TOURNAMENT_STATUS.FULL ? 0 : Math.max(0, tournament.maxSlots - slots),
    };

    res.json({ success: true, tournament: result });
  } catch (error) {
    next(error);
  }
};

export const createTournament = async (req, res, next) => {
  try {
    const data = editableTournament(req.body);
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;
    }

    const tournament = await Tournament.create(data);


    await logAudit({
      action: 'TOURNAMENT_CREATED',
      performedBy: req.user,
      targetEntity: 'Tournament',
      targetId: tournament._id,
      details: `Created tournament: "${tournament.title}" (${tournament.format})`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTournament = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Tournament.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const data = editableTournament(req.body);
    if (data.maxSlots !== undefined && data.maxSlots < existing.registeredSlots) return res.status(400).json({ success: false, message: 'Capacity cannot be smaller than confirmed registrations.' });
    if (data.format && data.format !== existing.format && await Registration.exists({ tournamentId: id })) return res.status(409).json({ success: false, message: 'Format cannot change after players register.' });
    Object.assign(existing, data);
    const updated = await existing.save();



    await logAudit({
      action: 'TOURNAMENT_UPDATED',
      performedBy: req.user,
      targetEntity: 'Tournament',
      targetId: id,
      details: `Updated tournament details for: "${updated.title}"`,
      changes: req.body,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      tournament: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTournamentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(TOURNAMENT_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament status' });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const oldStatus = tournament.status;
    tournament.status = status;
    await tournament.save();



    await logAudit({
      action: 'TOURNAMENT_STATUS_CHANGED',
      performedBy: req.user,
      targetEntity: 'Tournament',
      targetId: id,
      details: `Changed status from "${oldStatus}" to "${status}"`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Tournament status updated to ${status}`,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTournament = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (await Registration.exists({ tournamentId: id }) || await MatchResult.exists({ tournamentId: id }) || await Prize.exists({ tournamentId: id })) return res.status(409).json({ success: false, message: 'This tournament has registration or financial records. Cancel it instead of deleting it.' });
    await Match.deleteMany({ tournamentId: id });
    await Tournament.findByIdAndDelete(id);




    await logAudit({
      action: 'TOURNAMENT_DELETED',
      performedBy: req.user,
      targetEntity: 'Tournament',
      targetId: id,
      details: `Deleted tournament: "${tournament.title}"`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Tournament "${tournament.title}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTournamentSessions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const sessions = req.body.matchSessions || req.body;
    if (!sessions || typeof sessions !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid match sessions payload' });
    }

    const currentSessions = tournament.matchSessions || {};

    const updatedSessions = {
      morning: {
        totalMatches: Math.max(1, Number(sessions.morning?.totalMatches ?? currentSessions.morning?.totalMatches ?? 5)),
        completedMatches: Math.max(0, Number(sessions.morning?.completedMatches ?? currentSessions.morning?.completedMatches ?? 0)),
        timeRange: sessions.morning?.timeRange || currentSessions.morning?.timeRange || '10:00 AM – 12:30 PM',
        isOpen: sessions.morning?.isOpen !== undefined ? Boolean(sessions.morning.isOpen) : (currentSessions.morning?.isOpen ?? true),
      },
      afternoon: {
        totalMatches: Math.max(1, Number(sessions.afternoon?.totalMatches ?? currentSessions.afternoon?.totalMatches ?? 4)),
        completedMatches: Math.max(0, Number(sessions.afternoon?.completedMatches ?? currentSessions.afternoon?.completedMatches ?? 0)),
        timeRange: sessions.afternoon?.timeRange || currentSessions.afternoon?.timeRange || '2:00 PM – 4:30 PM',
        isOpen: sessions.afternoon?.isOpen !== undefined ? Boolean(sessions.afternoon.isOpen) : (currentSessions.afternoon?.isOpen ?? true),
      },
      evening: {
        totalMatches: Math.max(1, Number(sessions.evening?.totalMatches ?? currentSessions.evening?.totalMatches ?? 4)),
        completedMatches: Math.max(0, Number(sessions.evening?.completedMatches ?? currentSessions.evening?.completedMatches ?? 0)),
        timeRange: sessions.evening?.timeRange || currentSessions.evening?.timeRange || '6:00 PM – 8:30 PM',
        isOpen: sessions.evening?.isOpen !== undefined ? Boolean(sessions.evening.isOpen) : (currentSessions.evening?.isOpen ?? true),
      },
    };

    tournament.matchSessions = updatedSessions;
    await tournament.save();

    await logAudit({
      action: 'TOURNAMENT_SESSIONS_UPDATED',
      performedBy: req.user,
      targetEntity: 'Tournament',
      targetId: id,
      details: `Updated match sessions for "${tournament.title}": Morning ${updatedSessions.morning.completedMatches}/${updatedSessions.morning.totalMatches}, Afternoon ${updatedSessions.afternoon.completedMatches}/${updatedSessions.afternoon.totalMatches}, Evening ${updatedSessions.evening.completedMatches}/${updatedSessions.evening.totalMatches}`,
      changes: updatedSessions,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Tournament match sessions updated successfully',
      tournament,
      matchSessions: updatedSessions,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find().sort({ matchDate: -1 }).lean();
    res.json({ success: true, tournaments, count: tournaments.length });
  } catch (error) { next(error); }
};

function editableTournament(body) {
  const fields = ['title', 'slug', 'description', 'format', 'entryFee', 'maxSlots', 'registrationStart', 'registrationEnd', 'matchDate', 'status', 'scoringConfig', 'prizeConfig', 'rules', 'map', 'bannerUrl', 'isPublic', 'matchSessions'];
  return Object.fromEntries(fields.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
}
