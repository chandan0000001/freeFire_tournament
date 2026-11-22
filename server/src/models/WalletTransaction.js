import mongoose from 'mongoose';

export const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  TOURNAMENT_ENTRY: 'TOURNAMENT_ENTRY',
  TOURNAMENT_WIN: 'TOURNAMENT_WIN',
  WITHDRAWAL: 'WITHDRAWAL',
  WITHDRAWAL_REFUND: 'WITHDRAWAL_REFUND',
  ADMIN_ADJUST: 'ADMIN_ADJUST',
};

const walletTransactionSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    coinType: {
      type: String,
      enum: ['DEPOSIT', 'WINNING', 'MIXED'],
      default: 'DEPOSIT',
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FAILED', 'REJECTED'],
      default: 'COMPLETED',
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    referenceId: {
      type: String,
      trim: true,
      index: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
    },
    adminNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
