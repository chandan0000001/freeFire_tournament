import mongoose from 'mongoose';
import { RESULT_STATUS } from '../constants/statuses.js';

const playerKillSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    freeFireUid: { type: String, required: true },
    kills: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const matchResultEntrySchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: false,
    },
    participantName: {
      type: String,
      required: true,
    },
    placement: {
      type: Number,
      required: true,
      min: 1,
    },
    kills: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBooyah: {
      type: Boolean,
      default: false,
    },
    calculatedPoints: {
      type: Number,
      default: 0,
    },
    playerKills: [playerKillSchema],
  },
  { _id: false }
);

const matchResultSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RESULT_STATUS),
      default: RESULT_STATUS.SUBMITTED,
      index: true,
    },
    entries: [matchResultEntrySchema],
    evidenceScreenshots: [String],
    notes: {
      type: String,
      default: '',
    },
    adminReviewNotes: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const MatchResult = mongoose.model('MatchResult', matchResultSchema);
