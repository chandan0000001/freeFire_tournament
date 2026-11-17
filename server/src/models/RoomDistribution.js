import mongoose from 'mongoose';
import { ROOM_DELIVERY_STATUS } from '../constants/statuses.js';

const roomDistributionSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    deliveryStatus: {
      type: String,
      enum: Object.values(ROOM_DELIVERY_STATUS),
      default: ROOM_DELIVERY_STATUS.PENDING,
      index: true,
    },
    providerMessageId: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const RoomDistribution = mongoose.model('RoomDistribution', roomDistributionSchema);
