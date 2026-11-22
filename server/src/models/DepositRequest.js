import mongoose from 'mongoose';

export const DEPOSIT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const depositRequestSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
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
    coinsRequested: {
      type: Number,
      required: [true, 'Coins requested is required'],
      min: [10, 'Minimum deposit is 10 coins'],
    },
    amountInr: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'UPI',
    },
    utrNumber: {
      type: String,
      required: [true, '12-digit UTR number is required'],
      trim: true,
    },
    screenshotUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(DEPOSIT_STATUS),
      default: DEPOSIT_STATUS.PENDING,
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const DepositRequest = mongoose.model('DepositRequest', depositRequestSchema);
