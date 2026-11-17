import mongoose from 'mongoose';
import { TOURNAMENT_STATUS, TOURNAMENT_FORMAT } from '../constants/statuses.js';
import { DEFAULT_SCORING, DEFAULT_PLACEMENT_POINTS } from '../constants/scoring.js';

const scoringConfigSchema = new mongoose.Schema(
  {
    killPointValue: {
      type: Number,
      default: DEFAULT_SCORING.KILL_POINT_VALUE,
      min: [0, 'Kill point value cannot be negative'],
    },
    booyahBonus: {
      type: Number,
      default: DEFAULT_SCORING.BOOYAH_BONUS,
      min: [0, 'Booyah bonus cannot be negative'],
    },
    placementPoints: {
      type: Map,
      of: Number,
      default: DEFAULT_PLACEMENT_POINTS,
    },
    tieBreakerOrder: {
      type: [String],
      default: DEFAULT_SCORING.TIE_BREAKER_ORDER,
    },
  },
  { _id: false }
);

const prizeConfigSchema = new mongoose.Schema(
  {
    firstPlace: { type: Number, default: 0 },
    secondPlace: { type: Number, default: 0 },
    thirdPlace: { type: Number, default: 0 },
    mvpPrize: { type: Number, default: 0 },
    totalPool: { type: Number, default: 0 },
    terms: { type: String, default: 'Prizes will be sent via manual UPI transfer within 24 hours of result verification.' },
  },
  { _id: false }
);

const tournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tournament title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    format: {
      type: String,
      enum: Object.values(TOURNAMENT_FORMAT),
      required: true,
    },
    entryFee: {
      type: Number,
      required: [true, 'Entry fee is required'],
      min: [0, 'Entry fee cannot be negative'],
    },
    maxSlots: {
      type: Number,
      required: [true, 'Maximum slots count is required'],
      min: [2, 'Slots must be at least 2'],
    },
    registeredSlots: {
      type: Number,
      default: 0,
      min: 0,
    },
    registrationStart: {
      type: Date,
      default: Date.now,
    },
    registrationEnd: {
      type: Date,
      required: [true, 'Registration end date is required'],
    },
    matchDate: {
      type: Date,
      required: [true, 'Match schedule date and time is required'],
    },
    status: {
      type: String,
      enum: Object.values(TOURNAMENT_STATUS),
      default: TOURNAMENT_STATUS.REGISTRATION_OPEN,
      index: true,
    },
    scoringConfig: {
      type: scoringConfigSchema,
      default: () => ({}),
    },
    prizeConfig: {
      type: prizeConfigSchema,
      default: () => ({}),
    },
    rules: {
      type: String,
      default: 'Standard Free Fire Esports Competitive Rules apply. No emulators, no hacks, fair play only.',
    },
    map: {
      type: String,
      default: 'Bermuda',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to calculate remaining slots
tournamentSchema.virtual('remainingSlots').get(function () {
  return Math.max(0, this.maxSlots - this.registeredSlots);
});

// Set auto-status when registered slots reach max
tournamentSchema.pre('save', function (next) {
  if (this.registeredSlots >= this.maxSlots && this.status === TOURNAMENT_STATUS.REGISTRATION_OPEN) {
    this.status = TOURNAMENT_STATUS.FULL;
  }
  next();
});

export const Tournament = mongoose.model('Tournament', tournamentSchema);
