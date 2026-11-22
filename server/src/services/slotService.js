import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { TOURNAMENT_STATUS, PAYMENT_STATUS } from '../constants/statuses.js';
import { cache } from '../config/redis.js';

/**
 * Recalculate and synchronize tournament registeredSlots based on verified registrations
 */
export const syncTournamentSlots = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) return null;

  const verifiedCount = await Registration.countDocuments({
    tournamentId: tournament._id,
    paymentStatus: PAYMENT_STATUS.VERIFIED,
  });

  const isFull = verifiedCount >= tournament.maxSlots;
  let nextStatus = tournament.status;

  if (isFull && tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    nextStatus = TOURNAMENT_STATUS.FULL;
  } else if (!isFull && tournament.status === TOURNAMENT_STATUS.FULL) {
    nextStatus = TOURNAMENT_STATUS.REGISTRATION_OPEN;
  }

  tournament.registeredSlots = verifiedCount;
  tournament.status = nextStatus;
  await tournament.save();

  // Invalidate Redis caches
  await cache.delPattern('tournaments:*');
  await cache.del(`tournament:slug:${tournament.slug}`);

  return tournament;
};

/**
 * Check if a tournament has available capacity for a new registration request
 */
export const checkAvailableCapacity = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw capacityError('Tournament not found');
  }
  if (new Date(tournament.matchDate).getTime() <= Date.now() || (tournament.registrationEnd && new Date(tournament.registrationEnd).getTime() <= Date.now())) {
    throw capacityError('Tournament registration deadline has passed');
  }
  if (tournament.registrationStart && new Date(tournament.registrationStart).getTime() > Date.now()) throw capacityError('Tournament registration has not started');
  if (tournament.status !== TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    throw capacityError(`Tournament registration is ${tournament.status.replace('_', ' ')}`);
  }

  const verifiedCount = await Registration.countDocuments({
    tournamentId: tournament._id,
    paymentStatus: PAYMENT_STATUS.VERIFIED,
  });

  if (verifiedCount >= tournament.maxSlots) {
    tournament.registeredSlots = verifiedCount;
    tournament.status = TOURNAMENT_STATUS.FULL;
    await tournament.save();
    await cache.delPattern('tournaments:*');
    throw capacityError('Tournament is completely full. No remaining slots.');
  }

  return tournament;
};

/**
 * Atomically reserve a slot in a tournament.
 */
export const reserveSlot = async (tournamentId) => {
  const tournament = await Tournament.findOneAndUpdate(
    {
      _id: tournamentId,
      status: TOURNAMENT_STATUS.REGISTRATION_OPEN,
      matchDate: { $gt: new Date() },
      $and: [
        { $or: [{ registrationEnd: { $gt: new Date() } }, { registrationEnd: null }] },
        { $or: [{ registrationStart: { $lte: new Date() } }, { registrationStart: null }] },
      ],
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
    const existing = await Tournament.findById(tournamentId);
    if (!existing) {
      throw capacityError('Tournament not found');
    }
    if (new Date(existing.matchDate).getTime() <= Date.now() || (existing.registrationEnd && new Date(existing.registrationEnd).getTime() <= Date.now())) throw capacityError('Tournament registration deadline has passed');
    if (existing.status !== TOURNAMENT_STATUS.REGISTRATION_OPEN) {
      throw capacityError(`Tournament registration is ${existing.status.replace('_', ' ')}`);
    }
    if (existing.registeredSlots >= existing.maxSlots) {
      existing.status = TOURNAMENT_STATUS.FULL;
      await existing.save();
      throw capacityError('Tournament is completely full. No remaining slots.');
    }
    throw capacityError('Could not reserve slot. Please try again.');
  }

  if (tournament.registeredSlots >= tournament.maxSlots) {
    tournament.status = TOURNAMENT_STATUS.FULL;
    await tournament.save();
  }

  await cache.delPattern('tournaments:*');
  await cache.del(`tournament:slug:${tournament.slug}`);

  return tournament;
};

/**
 * Release a previously reserved slot atomically, guaranteeing registeredSlots never drops below 0
 */
export const releaseSlot = async (tournamentId) => {
  const tournament = await Tournament.findOneAndUpdate(
    {
      _id: tournamentId,
      registeredSlots: { $gt: 0 },
    },
    [
      {
        $set: {
          registeredSlots: { $max: [0, { $subtract: ['$registeredSlots', 1] }] },
          status: {
            $cond: {
              if: {
                $and: [
                  { $eq: ['$status', TOURNAMENT_STATUS.FULL] },
                  { $lt: [{ $subtract: ['$registeredSlots', 1] }, '$maxSlots'] },
                ],
              },
              then: TOURNAMENT_STATUS.REGISTRATION_OPEN,
              else: '$status',
            },
          },
        },
      },
    ],
    { new: true }
  );

  if (tournament) {
    await cache.delPattern('tournaments:*');
    await cache.del(`tournament:slug:${tournament.slug}`);
  }

  return tournament;
};

function capacityError(message) { const error = new Error(message); error.status = message === "Tournament not found" ? 404 : 409; return error; }
