import mongoose from 'mongoose';
import { PAYMENT_STATUS, ROOM_DELIVERY_STATUS, TOURNAMENT_FORMAT } from '../constants/statuses.js';

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    inGameName: { type: String, required: [true, 'In-game Name is required'], trim: true },
    freeFireUid: { type: String, required: [true, 'Free Fire UID is required'], trim: true },
    isConsentPublic: { type: Boolean, default: false },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: [true, 'Tournament ID is required'],
      index: true,
    },
    format: {
      type: String,
      enum: Object.values(TOURNAMENT_FORMAT),
      required: true,
    },
    teamName: {
      type: String,
      trim: true,
      required: function () {
        return this.format === TOURNAMENT_FORMAT.SQUAD;
      },
    },
    captain: {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Valid email is required'],
      },
      phone: { type: String, required: true, trim: true },
      collegeRollNo: { type: String, required: true, trim: true },
    },
    players: {
      type: [playerSchema],
      validate: {
        validator: function (val) {
          if (this.format === TOURNAMENT_FORMAT.SQUAD) {
            return val && val.length >= 4;
          }
          return val && val.length === 1;
        },
        message: 'Squad requires 4 players; Solo requires 1 player.',
      },
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paymentDetails: {
      utr: { type: String, trim: true, default: '' },
      screenshotUrl: { type: String, default: '' },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    roomCredentialStatus: {
      type: String,
      enum: Object.values(ROOM_DELIVERY_STATUS),
      default: ROOM_DELIVERY_STATUS.UNNOTIFIED,
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    captainEvidence: [
      {
        screenshotUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate team name or captain registering twice for the same tournament
registrationSchema.index({ tournamentId: 1, 'captain.email': 1 }, { unique: true });

export const Registration = mongoose.model('Registration', registrationSchema);
