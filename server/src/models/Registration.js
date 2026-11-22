import mongoose from 'mongoose';
import { PAYMENT_STATUS, ROOM_DELIVERY_STATUS, TOURNAMENT_FORMAT } from '../constants/statuses.js';

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    inGameName: { type: String, trim: true, default: '' },
    freeFireUid: { type: String, trim: true, default: '' },
    isLeader: { type: Boolean, default: false },
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
    preferredSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning',
    },
    slotTime: {
      type: String,
      default: '10:00 AM – 12:30 PM',
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
        lowercase: true,
        trim: true,
        default: '',
      },
      phone: { type: String, required: true, trim: true },
      collegeRollNo: { type: String, trim: true, default: '' },
    },
    players: {
      type: [playerSchema],
      validate: {
        validator: function (val) {
          if (this.format === TOURNAMENT_FORMAT.SQUAD) {
            return val && val.length >= 3 && val.length <= 4;
          }
          return val && val.length === 1;
        },
        message: 'Squad requires 3 or 4 players; Solo requires 1 player.',
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

// Index to quickly look up registrations by tournament and captain phone
registrationSchema.index({ tournamentId: 1, 'captain.phone': 1 });

export const Registration = mongoose.model('Registration', registrationSchema);
