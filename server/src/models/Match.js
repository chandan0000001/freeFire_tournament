import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    matchNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    roundNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    map: {
      type: String,
      default: 'Bermuda',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    assignedSpectator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    roomCredentials: {
      roomId: {
        type: String,
        select: false, // Critical: never returned in standard queries
      },
      roomPassword: {
        type: String,
        select: false, // Critical: never returned in standard queries
      },
      credentialsEnteredAt: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'room_active', 'in_progress', 'completed', 'disputed'],
      default: 'scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Match = mongoose.model('Match', matchSchema);
