import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { Match } from '../models/Match.js';
import { MatchResult } from '../models/MatchResult.js';
import { Prize } from '../models/Prize.js';
import { TOURNAMENT_STATUS } from '../constants/statuses.js';
import { logAudit } from '../services/auditService.js';
import { cache } from '../config/redis.js';

export const getTournaments = async (req, res, next) => {
  try {
    const { status, format, search, limit } = req.query;
    const cacheKey = `tournaments:list:${status || 'all'}:${format || 'all'}:${search || 'none'}:${limit || 'none'}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    const query = { isPublic: true };

    if (status) {
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
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let tournamentQuery = Tournament.find(query).sort({ matchDate: 1 });
    if (limit) {
      tournamentQuery = tournamentQuery.limit(parseInt(limit, 10));
    }

    const tournaments = await tournamentQuery.lean();

    // Attach remainingSlots virtual to each
    const formatted = tournaments.map((t) => ({
      ...t,
      remainingSlots: t.status === TOURNAMENT_STATUS.FULL ? 0 : Math.max(0, t.maxSlots - t.registeredSlots),
    }));

    const responsePayload = {
      success: true,
      count: formatted.length,
      tournaments: formatted,
    };

    // Cache list for 30s in Redis
    await cache.set(cacheKey, responsePayload, 30);

    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export const getTournamentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const cacheKey = `tournament:slug:${slug}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, tournament: cached, cached: true });
    }

    const tournament = await Tournament.findOne({ slug: slug.toLowerCase() }).lean();
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const result = {
      ...tournament,
      remainingSlots: tournament.status === TOURNAMENT_STATUS.FULL ? 0 : Math.max(0, tournament.maxSlots - tournament.registeredSlots),
    };

    await cache.set(cacheKey, result, 60); // 60s cache
    res.json({ success: true, tournament: result });
  } catch (error) {
    next(error);
  }
};

export const createTournament = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;
    }

    // Curated high-res 16:9 Free Fire tournament banners pool
    const RANDOM_BANNERS = [
      '/images/ff-banner-squad.webp',
      '/images/ff-banner-solo.webp',
      '/images/ff-banner-rampage.webp',
      '/images/ff-banner-hayato.webp',
      '/images/ff-banner-kelly.webp',
      '/images/ff-banner-chrono.webp',
      '/images/ff-banner-paradox.webp',
      '/images/ff-banner-battle.webp',
      '/images/ff-banner-flame.webp',
      '/images/ff-banner-naruto.webp',
      '/images/ff-banner-squidgame.webp',
      '/images/ff-banner-evo8.webp',
      '/images/ff-banner-cyberbiker.webp',
      '/images/ff-banner-heat.webp',
      '/images/ff-banner-rampage-2.webp',
      '/images/ff-banner-rampage-finale.webp',
      '/images/ff-banner-intense.webp',
      '/images/ff-banner-together.webp',
      '/images/ff-banner-assemble.webp',
      '/images/ff-banner-max-vc.webp',
      '/images/ff-banner-max-fk.webp',
      '/images/ff-banner-max-0x.webp',
      '/images/ff-banner-team-2023.webp',
      '/images/ff-banner-game-mc.webp',
      '/images/ff-banner-game-4y.webp',
      '/images/ff-banner-cw-2024.webp',
      '/images/ff-banner-ne-2024.webp',
      '/images/ff-banner-game-7x.webp',
      '/images/ff-banner-2025.webp',
      '/images/arena-stage.webp',
    ];

    // If no banner or placeholder is provided, assign a random local banner
    if (!data.bannerUrl || data.bannerUrl.trim() === '' || data.bannerUrl.includes('unsplash')) {
      data.bannerUrl = RANDOM_BANNERS[Math.floor(Math.random() * RANDOM_BANNERS.length)];
    }

    const tournament = await Tournament.create(data);
    await cache.delPattern('tournaments:*');

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

    const updated = await Tournament.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    await cache.delPattern('tournaments:*');
    await cache.del(`tournament:slug:${existing.slug}`);
    if (updated.slug !== existing.slug) {
      await cache.del(`tournament:slug:${updated.slug}`);
    }

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

    await cache.delPattern('tournaments:*');
    await cache.del(`tournament:slug:${tournament.slug}`);

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

    // Clean up related registrations, matches, and prizes
    await Promise.all([
      Registration.deleteMany({ tournamentId: id }),
      Match.deleteMany({ tournamentId: id }),
      MatchResult.deleteMany({ tournamentId: id }),
      Prize.deleteMany({ tournamentId: id }),
      Tournament.findByIdAndDelete(id),
    ]);

    await cache.delPattern('tournaments:*');
    await cache.del(`tournament:slug:${tournament.slug}`);
    await cache.flush();

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
