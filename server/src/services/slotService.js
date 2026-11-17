import { Tournament } from '../models/Tournament.js';
import { TOURNAMENT_STATUS } from '../constants/statuses.js';
import { cache } from '../config/redis.js';

/**
 * Atomically reserve a slot in a tournament.
 * Guarantees no race-condition overbooking.
 */
export const reserveSlot = async (tournamentId) => {
  // Find tournament that is open and has available capacity, and atomically increment registeredSlots
  const tournament = await Tournament.findOneAndUpdate(
    {
      _id: tournamentId,
      status: TOURNAMENT_STATUS.REGISTRATION_OPEN,
      $expr: { $lt: ['$registeredSlots', '$maxSlots'] },
    },
    {
      $inc: { registeredSlots: 1 },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!tournament) {
    // Check why it failed
    const existing = await Tournament.findById(tournamentId);
    if (!existing) {
      throw new Error('Tournament not found');
    }
    if (existing.status !== TOURNAMENT_STATUS.REGISTRATION_OPEN) {
      throw new Error(`Tournament registration is ${existing.status.replace('_', ' ')}`);
    }
    if (existing.registeredSlots >= existing.maxSlots) {
      // Mark as full
      existing.status = TOURNAMENT_STATUS.FULL;
      await existing.save();
      throw new Error('Tournament is completely full. No remaining slots.');
    }
    throw new Error('Could not reserve slot. Please try again.');
  }

  // If this reservation filled the tournament, update status to full
  if (tournament.registeredSlots >= tournament.maxSlots) {
    tournament.status = TOURNAMENT_STATUS.FULL;
    await tournament.save();
  }

  // Bust tournament list and detail cache so live slot counts update in real-time
  await cache.delPattern('tournaments:*');
  await cache.del(`tournament:slug:${tournament.slug}`);

  return tournament;
};

/**
 * Release a previously reserved slot (e.g. if registration is cancelled or payment rejected)
 */
export const releaseSlot = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) return null;

  if (tournament.registeredSlots > 0) {
    tournament.registeredSlots -= 1;
    // If it was full, re-open registration
    if (tournament.status === TOURNAMENT_STATUS.FULL && tournament.registeredSlots < tournament.maxSlots) {
      tournament.status = TOURNAMENT_STATUS.REGISTRATION_OPEN;
    }
    await tournament.save();
    // Bust tournament list and detail cache
    await cache.delPattern('tournaments:*');
    await cache.del(`tournament:slug:${tournament.slug}`);
  }

  return tournament;
};
