import mongoose from 'mongoose';
import { Registration } from '../models/Registration.js';
import { DepositRequest } from '../models/DepositRequest.js';

const Claim = mongoose.model('PaymentReferenceClaim', new mongoose.Schema({
  _id: String,
  owner: { type: String, required: true },
}, { timestamps: true }));

// A shared unique key prevents one transfer funding two entries or deposits.
// These calls run inside the same transaction as the credit/approval.
export async function claimPaymentReference(utr, kind, id) {
  const reference = String(utr || '').trim();
  const reject = message => { const error = new Error(message); error.status = 409; throw error; };
  if (!/^\d{12}$/.test(reference)) reject('A valid 12-digit payment UTR is required before approval.');
  const registration = await Registration.findOne({ 'paymentDetails.utr': reference, paymentStatus: 'verified', ...(kind === 'registration' ? { _id: { $ne: id } } : {}) }).select('_id');
  const deposit = await DepositRequest.findOne({ utrNumber: reference, status: 'APPROVED', ...(kind === 'deposit' ? { _id: { $ne: id } } : {}) }).select('_id');
  if (registration || deposit) reject('This UTR has already funded another registration or deposit.');
  const owner = `${kind}:${id}`;
  const claim = await Claim.findOneAndUpdate({ _id: reference }, { $setOnInsert: { owner } }, { upsert: true, new: true });
  if (claim.owner !== owner) reject('This UTR has already been used for another payment.');
}
