import mongoose from 'mongoose';

export const WITHDRAWAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const withdrawalRequestSchema = new mongoose.Schema(
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
    freeFireUid: {
      type: String,
      trim: true,
      default: '',
    },
    coinsRequested: {
      type: Number,
      required: [true, 'Coins requested is required'],
      min: [10, 'Minimum withdrawal is 10 coins'],
    },
    amountInr: {
      type: Number,
      required: true,
    },
    upiId: {
      type: String,
      required: [true, 'Valid UPI ID or phone number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING,
      index: true,
    },
    payoutUtr: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
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

export const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
