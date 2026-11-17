import mongoose from 'mongoose';
import { PRIZE_PAYOUT_STATUS } from '../constants/statuses.js';

const prizeSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Prize Winner',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    winnerRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
    },
    winnerName: {
      type: String,
      default: 'To be decided',
    },
    payoutStatus: {
      type: String,
      enum: Object.values(PRIZE_PAYOUT_STATUS),
      default: PRIZE_PAYOUT_STATUS.PENDING,
      index: true,
    },
    offlineTransactionRef: {
      type: String,
      default: '',
      select: false, // Internal record only; never public
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Prize = mongoose.model('Prize', prizeSchema);
