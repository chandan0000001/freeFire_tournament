import mongoose from 'mongoose';
import { Registration } from '../models/Registration.js';
export async function validateResultEntries(entries, tournamentId) {
  const invalid = message => { const error = new Error(message); error.status = 400; throw error; };
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 200) invalid('Provide between 1 and 200 score entries.');
  const ids = new Set(), placements = new Set();
  for (const entry of entries) {
    if (!Number.isSafeInteger(Number(entry.kills)) || Number(entry.kills) < 0 || !Number.isSafeInteger(Number(entry.placement)) || Number(entry.placement) < 1) invalid('Kills must be nonnegative integers and placements must be positive integers.');
    if (placements.has(Number(entry.placement))) invalid('Each participant must have a distinct placement.');
    placements.add(Number(entry.placement));
    if (entry.isBooyah && Number(entry.placement) !== 1) invalid('Only first placement can receive the Booyah bonus.');
    if (!entry.participantName?.trim()) invalid('Every score needs a participant name.');
    if (entry.registrationId) {
      const id = String(entry.registrationId);
      if (!mongoose.isValidObjectId(id) || ids.has(id)) invalid('Select a valid, distinct registration for each participant.');
      ids.add(id);
    }
  }
  if (ids.size) {
    const valid = await Registration.countDocuments({ _id: { $in: [...ids] }, tournamentId, paymentStatus: 'verified', isApproved: true });
    if (valid !== ids.size) invalid('Scores can only reference verified registrations from this tournament.');
  }
}
