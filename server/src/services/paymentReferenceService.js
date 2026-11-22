import mongoose from 'mongoose';
import { Registration } from '../models/Registration.js';

const Claim = mongoose.model('PaymentReferenceClaim', new mongoose.Schema({
  _id: String,
  owner: { type: String, required: true },
}, { timestamps: true }));

// A shared unique key prevents one transfer funding two entries.
// These calls run inside the same transaction as the credit/approval.
export async function claimPaymentReference(utr, kind, id) {
  const reference = String(utr || '').trim();
  const reject = message => { const error = new Error(message); error.status = 409; throw error; };
  if (!/^\d{12}$/.test(reference)) reject('A valid 12-digit payment UTR is required before approval.');
  const registration = await Registration.findOne({ 'paymentDetails.utr': reference, paymentStatus: 'verified', ...(kind === 'registration' ? { _id: { $ne: id } } : {}) }).select('_id');
  if (registration) reject('This UTR has already funded another registration.');
  const owner = `${kind}:${id}`;
  const claim = await Claim.findOneAndUpdate({ _id: reference }, { $setOnInsert: { owner } }, { upsert: true, new: true });
  if (claim.owner !== owner) reject('This UTR has already been used for another payment.');
}
