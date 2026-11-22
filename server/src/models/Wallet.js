import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    playerName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    freeFireUid: {
      type: String,
      trim: true,
      default: '',
    },
    depositCoins: {
      type: Number,
      default: 0,
      min: [0, 'Deposit coins cannot be negative'],
    },
    winningCoins: {
      type: Number,
      default: 0,
      min: [0, 'Winning coins cannot be negative'],
    },
    lockedCoins: {
      type: Number,
      default: 0,
      min: [0, 'Locked coins cannot be negative'],
    },
    totalDepositedInr: {
      type: Number,
      default: 0,
    },
    totalWithdrawnInr: {
      type: Number,
      default: 0,
    },
    totalWonInr: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Total playable coins
walletSchema.virtual('totalCoins').get(function () {
  return (this.depositCoins || 0) + (this.winningCoins || 0);
});

// Virtual: Available coins for withdrawal (winning coins minus pending locked requests)
walletSchema.virtual('withdrawableCoins').get(function () {
  return Math.max(0, (this.winningCoins || 0) - (this.lockedCoins || 0));
});

export const Wallet = mongoose.model('Wallet', walletSchema);
