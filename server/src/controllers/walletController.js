import { getWalletConfig } from '../config/wallet.js';
import { Wallet } from '../models/Wallet.js';
import { WalletTransaction, TRANSACTION_TYPES } from '../models/WalletTransaction.js';
import { WithdrawalRequest, WITHDRAWAL_STATUS } from '../models/WithdrawalRequest.js';
import { DepositRequest, DEPOSIT_STATUS } from '../models/DepositRequest.js';
import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { reserveSlot, syncTournamentSlots } from '../services/slotService.js';
import { generateRegistrationRef, generateWalletRef } from '../utils/refGenerator.js';
import { logAudit } from '../services/auditService.js';
import { PAYMENT_STATUS, TOURNAMENT_FORMAT } from '../constants/statuses.js';
import { sendRegistrationEmail } from '../services/emailService.js';
import { redisAuth } from '../config/redis.js';

/**
 * Get or create wallet for a user/captain by email.
 */
export const getWalletByEmail = async (req, res, next) => {
  try {
    const rawEmail = req.params.email || req.query.email || req.body.email;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const email = rawEmail.toLowerCase().trim();
    let wallet = await Wallet.findOne({ userEmail: email });

    if (!wallet) {
      wallet = await Wallet.create({
        userEmail: email,
        playerName: req.query.playerName || '',
        phone: req.query.phone || '',
        freeFireUid: req.query.freeFireUid || '',
        depositCoins: 0,
        winningCoins: 0,
        lockedCoins: 0,
      });
    }

    // Fetch recent 15 transactions
    const transactions = await WalletTransaction.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(15);

    // Fetch pending withdrawal requests if any
    const pendingWithdrawal = await WithdrawalRequest.findOne({
      userEmail: email,
      status: WITHDRAWAL_STATUS.PENDING,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      wallet: {
        id: wallet._id,
        userEmail: wallet.userEmail,
        playerName: wallet.playerName,
        phone: wallet.phone,
        freeFireUid: wallet.freeFireUid,
        depositCoins: wallet.depositCoins,
        winningCoins: wallet.winningCoins,
        lockedCoins: wallet.lockedCoins,
        totalCoins: wallet.totalCoins,
        withdrawableCoins: wallet.withdrawableCoins,
        totalDepositedInr: wallet.totalDepositedInr,
        totalWithdrawnInr: wallet.totalWithdrawnInr,
        totalWonInr: wallet.totalWonInr,
      },
      transactions,
      pendingWithdrawal,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * User submits request to purchase coins via manual UPI UTR verification.
 */
export const createDepositRequest = async (req, res, next) => {
  try {
    const { userEmail, playerName, phone, coinsRequested, utrNumber, screenshotUrl } = req.body;

    if (!userEmail || !coinsRequested || !utrNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email, coins requested, and 12-digit UPI UTR number are required.',
      });
    }

    const cleanUtr = utrNumber.toString().trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UTR format. UPI Reference / UTR must be exactly 12 digits.',
      });
    }

    const email = userEmail.toLowerCase().trim();
    const coins = Number(coinsRequested);
    if (!Number.isSafeInteger(coins) || !getWalletConfig().depositPackages.includes(coins)) {
      return res.status(400).json({
        success: false,
        message: `Select an allowed deposit package: ${getWalletConfig().depositPackages.join(', ')} coins.`,
      });
    }

    // Check if UTR was already submitted and pending
    const existingUtr = await DepositRequest.findOne({
      utrNumber: cleanUtr,
      status: { $in: [DEPOSIT_STATUS.PENDING, DEPOSIT_STATUS.APPROVED] },
    });

    if (existingUtr) {
      return res.status(400).json({
        success: false,
        message: 'This UTR number has already been submitted or credited.',
      });
    }

    let wallet = await Wallet.findOne({ userEmail: email });
    if (!wallet) {
      wallet = await Wallet.create({
        userEmail: email,
        playerName: playerName || '',
        phone: phone || '',
      });
    }

    const refId = generateWalletRef('DEP');
    const deposit = await DepositRequest.create({
      referenceId: refId,
      walletId: wallet._id,
      userEmail: email,
      playerName: playerName || wallet.playerName || '',
      phone: phone || wallet.phone || '',
      coinsRequested: coins,
      amountInr: coins, // 1 coin = 1 INR
      utrNumber: cleanUtr,
      screenshotUrl: screenshotUrl || '',
      status: DEPOSIT_STATUS.PENDING,
    });

    return res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully. Coins will be credited once admin verifies UTR.',
      deposit,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * User requests withdrawal of winning coins to UPI.
 */
export const createWithdrawalRequest = async (req, res, next) => {
  try {
    const { userEmail, playerName, phone, freeFireUid, coinsRequested, upiId } = req.body;

    if (!userEmail || !coinsRequested || !upiId) {
      return res.status(400).json({
        success: false,
        message: 'Email, coins requested, and valid UPI ID are required.',
      });
    }

    const cleanUpi = upiId.trim();
    if (!cleanUpi || cleanUpi.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm).',
      });
    }

    const email = userEmail.toLowerCase().trim();
    const coins = Number(coinsRequested);
    if (!getWalletConfig().minimumWithdrawal || !Number.isSafeInteger(coins) || coins < getWalletConfig().minimumWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is ${getWalletConfig().minimumWithdrawal ?? 'not configured'} coins.`,
      });
    }

    const wallet = await Wallet.findOne({ userEmail: email });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    // Check available withdrawable coins (winning coins minus currently locked coins)
    const available = Math.max(0, (wallet.winningCoins || 0) - (wallet.lockedCoins || 0));
    if (coins > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient withdrawable coins. You have ${available} winning coins available. Note: Deposit coins cannot be withdrawn directly.`,
      });
    }

    // Lock the coins atomically
    wallet.lockedCoins = (wallet.lockedCoins || 0) + coins;
    await wallet.save();

    const refId = generateWalletRef('WTH');
    const withdrawal = await WithdrawalRequest.create({
      referenceId: refId,
      walletId: wallet._id,
      userEmail: email,
      playerName: playerName || wallet.playerName || '',
      phone: phone || wallet.phone || '',
      freeFireUid: freeFireUid || wallet.freeFireUid || '',
      coinsRequested: coins,
      amountInr: coins, // 1 coin = 1 INR
      upiId: cleanUpi,
      status: WITHDRAWAL_STATUS.PENDING,
    });

    // Record pending transaction
    await WalletTransaction.create({
      walletId: wallet._id,
      userEmail: email,
      type: TRANSACTION_TYPES.WITHDRAWAL,
      amount: coins,
      coinType: 'WINNING',
      status: 'PENDING',
      balanceBefore: wallet.totalCoins,
      balanceAfter: wallet.totalCoins, // still held until approved or released
      description: `Withdrawal request of ₹${coins} to ${cleanUpi}`,
      referenceId: refId,
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted to admin queue. Payout will be sent to your UPI ID.',
      withdrawal,
      withdrawableCoins: Math.max(0, wallet.winningCoins - wallet.lockedCoins),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 1-Click Tournament Registration using Wallet Coins.
 */
export const joinTournamentWithCoins = async (req, res, next) => {
  let reservedTournament = null;
  try {
    const { tournamentId, format, teamName, captain, players } = req.body;

    if (!tournamentId || !captain || !captain.email) {
      return res.status(400).json({ success: false, message: 'Tournament ID and Captain info are required.' });
    }

    const email = captain.email.toLowerCase().trim();
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (tournament.status !== 'registration_open') {
      return res.status(400).json({ success: false, message: `Registration is currently ${tournament.status.replace('_', ' ')}` });
    }

    const entryFee = tournament.entryFee || 0;

    // Check wallet balance
    let wallet = await Wallet.findOne({ userEmail: email });
    if (!wallet) {
      wallet = await Wallet.create({
        userEmail: email,
        playerName: captain.name || '',
        phone: captain.phone || '',
      });
    }

    const totalAvailable = (wallet.depositCoins || 0) + (wallet.winningCoins || 0);
    if (totalAvailable < entryFee) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. Entry fee is ${entryFee} Coins, but you have ${totalAvailable} Coins. Please top up your wallet.`,
        requiredCoins: entryFee,
        currentCoins: totalAvailable,
      });
    }

    // Check duplicate captain email for this tournament
    const existing = await Registration.findOne({
      tournamentId,
      'captain.email': email,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This captain email is already registered in this tournament.',
      });
    }

    // Reserve slot atomically
    reservedTournament = await reserveSlot(tournamentId);

    // Deduct coins: deduct from depositCoins first, then winningCoins
    let deductDeposit = Math.min(wallet.depositCoins, entryFee);
    let deductWinning = entryFee - deductDeposit;

    const balanceBefore = wallet.totalCoins;
    wallet.depositCoins -= deductDeposit;
    wallet.winningCoins -= deductWinning;
    await wallet.save();
    await redisAuth.invalidateWallet([wallet.userId?.toString(), email]);

    const regFormat = format === 'solo' ? TOURNAMENT_FORMAT.SOLO : TOURNAMENT_FORMAT.SQUAD;
    const refCode = generateRegistrationRef(regFormat);

    // Create verified registration
    const registration = await Registration.create({
      referenceId: refCode,
      tournamentId,
      format: regFormat,
      teamName: regFormat === TOURNAMENT_FORMAT.SQUAD ? (teamName || `${captain.name}'s Squad`) : undefined,
      captain: {
        name: captain.name,
        email,
        phone: captain.phone,
        collegeRollNo: captain.collegeRollNo || 'N/A',
      },
      players: players || [
        {
          name: captain.name,
          inGameName: captain.inGameName || captain.name,
          freeFireUid: captain.freeFireUid || 'N/A',
          isConsentPublic: false,
        },
      ],
      paymentStatus: PAYMENT_STATUS.VERIFIED,
      isApproved: true,
      paymentDetails: {
        utr: `COINS-${Date.now().toString(36).toUpperCase()}`,
        notes: `Paid instantly with ${entryFee} Wallet Coins`,
        verifiedAt: new Date(),
      },
    });

    // Record wallet transaction
    await WalletTransaction.create({
      walletId: wallet._id,
      userEmail: email,
      type: TRANSACTION_TYPES.TOURNAMENT_ENTRY,
      amount: entryFee,
      coinType: deductWinning > 0 ? (deductDeposit > 0 ? 'MIXED' : 'WINNING') : 'DEPOSIT',
      status: 'COMPLETED',
      balanceBefore,
      balanceAfter: wallet.totalCoins,
      description: `Entry fee for ${tournament.title} (${refCode})`,
      referenceId: refCode,
      tournamentId: tournament._id,
    });

    // Sync slots
    await syncTournamentSlots(tournamentId);

    // Send confirmation email
    try {
      await sendRegistrationEmail(registration, tournament);
    } catch (mailErr) {
      console.warn('Registration email deferred:', mailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Registered successfully! ${entryFee} coins deducted from your wallet.`,
      referenceId: refCode,
      remainingCoins: wallet.totalCoins,
      registration,
    });
  } catch (err) {
    if (reservedTournament) {
      try {
        await syncTournamentSlots(req.body.tournamentId);
      } catch (syncErr) {
        console.error('Failed to sync slots after coin reg error', syncErr);
      }
    }
    next(err);
  }
};

/* ==========================================================================
   ADMIN CONTROLLER METHODS
   ========================================================================== */

/**
 * Admin: List withdrawal requests with filters.
 */
export const getAdminWithdrawals = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [withdrawals, total] = await Promise.all([
      WithdrawalRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      WithdrawalRequest.countDocuments(filter),
    ]);

    // KPI summaries
    const [pendingCount, totalPaidAgg] = await Promise.all([
      WithdrawalRequest.countDocuments({ status: WITHDRAWAL_STATUS.PENDING }),
      WithdrawalRequest.aggregate([
        { $match: { status: WITHDRAWAL_STATUS.APPROVED } },
        { $group: { _id: null, totalPaid: { $sum: '$amountInr' } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      withdrawals,
      total,
      stats: {
        pendingCount,
        totalPaidInr: totalPaidAgg[0]?.totalPaid || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Approve withdrawal request & mark paid with UTR.
 */
export const approveWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payoutUtr, adminNote } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }

    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal request is already ${withdrawal.status.toLowerCase()}.`,
      });
    }

    const wallet = await Wallet.findById(withdrawal.walletId);
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Associated wallet not found.' });
    }

    // Permanently deduct the winning coins and release the lock
    wallet.winningCoins = Math.max(0, wallet.winningCoins - withdrawal.coinsRequested);
    wallet.lockedCoins = Math.max(0, wallet.lockedCoins - withdrawal.coinsRequested);
    wallet.totalWithdrawnInr = (wallet.totalWithdrawnInr || 0) + withdrawal.amountInr;
    await wallet.save();

    withdrawal.status = WITHDRAWAL_STATUS.APPROVED;
    withdrawal.payoutUtr = payoutUtr || 'ADMIN_PAID';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user?._id;
    await withdrawal.save();

    // Update transaction to COMPLETED
    await WalletTransaction.findOneAndUpdate(
      { referenceId: withdrawal.referenceId },
      {
        status: 'COMPLETED',
        balanceAfter: wallet.totalCoins,
        adminNote: adminNote || `Paid via UPI. Bank UTR: ${payoutUtr || 'N/A'}`,
      }
    );

    // Audit log
    await logAudit({
      adminId: req.user?._id,
      adminEmail: req.user?.email,
      action: 'WITHDRAWAL_APPROVED',
      targetModel: 'WithdrawalRequest',
      targetId: withdrawal._id,
      details: {
        amountInr: withdrawal.amountInr,
        upiId: withdrawal.upiId,
        payoutUtr,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Withdrawal of ₹${withdrawal.amountInr} approved and marked as paid.`,
      withdrawal,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Reject withdrawal request and release locked coins back to player.
 */
export const rejectWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }

    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal request is already ${withdrawal.status.toLowerCase()}.`,
      });
    }

    const wallet = await Wallet.findById(withdrawal.walletId);
    if (wallet) {
      // Release locked coins back to player
      wallet.lockedCoins = Math.max(0, wallet.lockedCoins - withdrawal.coinsRequested);
      await wallet.save();
    }

    withdrawal.status = WITHDRAWAL_STATUS.REJECTED;
    withdrawal.rejectionReason = rejectionReason || 'Rejected by administrator';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user?._id;
    await withdrawal.save();

    // Update transaction to REJECTED
    await WalletTransaction.findOneAndUpdate(
      { referenceId: withdrawal.referenceId },
      {
        status: 'REJECTED',
        adminNote: rejectionReason || 'Withdrawal rejected by admin. Coins refunded to wallet.',
      }
    );

    // Audit log
    await logAudit({
      adminId: req.user?._id,
      adminEmail: req.user?.email,
      action: 'WITHDRAWAL_REJECTED',
      targetModel: 'WithdrawalRequest',
      targetId: withdrawal._id,
      details: {
        amountInr: withdrawal.amountInr,
        rejectionReason,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Withdrawal rejected and coins refunded back to player wallet.',
      withdrawal,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: List coin deposit requests.
 */
export const getAdminDeposits = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [deposits, total] = await Promise.all([
      DepositRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      DepositRequest.countDocuments(filter),
    ]);

    const pendingCount = await DepositRequest.countDocuments({ status: DEPOSIT_STATUS.PENDING });

    return res.status(200).json({
      success: true,
      deposits,
      total,
      pendingCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Approve coin deposit request and credit coins.
 */
export const approveDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deposit = await DepositRequest.findById(id);

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    if (deposit.status !== DEPOSIT_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Deposit request is already ${deposit.status.toLowerCase()}.`,
      });
    }

    const wallet = await Wallet.findById(deposit.walletId);
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    const balanceBefore = wallet.totalCoins;
    wallet.depositCoins += deposit.coinsRequested;
    wallet.totalDepositedInr += deposit.amountInr;
    await wallet.save();

    deposit.status = DEPOSIT_STATUS.APPROVED;
    deposit.processedAt = new Date();
    deposit.processedBy = req.user?._id;
    await deposit.save();

    // Record completed deposit transaction
    await WalletTransaction.create({
      walletId: wallet._id,
      userEmail: deposit.userEmail,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: deposit.coinsRequested,
      coinType: 'DEPOSIT',
      status: 'COMPLETED',
      balanceBefore,
      balanceAfter: wallet.totalCoins,
      description: `Wallet top-up via UPI (UTR: ${deposit.utrNumber})`,
      referenceId: deposit.referenceId,
    });

    // Audit log
    await logAudit({
      adminId: req.user?._id,
      adminEmail: req.user?.email,
      action: 'DEPOSIT_APPROVED',
      targetModel: 'DepositRequest',
      targetId: deposit._id,
      details: {
        coins: deposit.coinsRequested,
        utr: deposit.utrNumber,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `${deposit.coinsRequested} coins successfully credited to player wallet.`,
      deposit,
      newBalance: wallet.totalCoins,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Reject deposit request.
 */
export const rejectDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const deposit = await DepositRequest.findById(id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    if (deposit.status !== DEPOSIT_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Deposit request is already ${deposit.status.toLowerCase()}.`,
      });
    }

    deposit.status = DEPOSIT_STATUS.REJECTED;
    deposit.adminNote = adminNote || 'UTR verification failed or payment not received.';
    deposit.processedAt = new Date();
    deposit.processedBy = req.user?._id;
    await deposit.save();

    return res.status(200).json({
      success: true,
      message: 'Deposit request rejected.',
      deposit,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Manually credit or debit coins for any user.
 */
export const manualAdjustCoins = async (req, res, next) => {
  try {
    const { userEmail, amount, coinType = 'DEPOSIT', reason } = req.body;

    if (!userEmail || !amount) {
      return res.status(400).json({ success: false, message: 'Email and amount are required.' });
    }

    const email = userEmail.toLowerCase().trim();
    const adjustAmount = parseInt(amount, 10);
    if (isNaN(adjustAmount) || adjustAmount === 0) {
      return res.status(400).json({ success: false, message: 'Amount must be non-zero.' });
    }

    let wallet = await Wallet.findOne({ userEmail: email });
    if (!wallet) {
      wallet = await Wallet.create({ userEmail: email });
    }

    const balanceBefore = wallet.totalCoins;
    const targetField = coinType === 'WINNING' ? 'winningCoins' : 'depositCoins';

    if (adjustAmount < 0 && wallet[targetField] < Math.abs(adjustAmount)) {
      return res.status(400).json({
        success: false,
        message: `Cannot deduct ${Math.abs(adjustAmount)} coins. Current ${targetField} is ${wallet[targetField]}.`,
      });
    }

    wallet[targetField] += adjustAmount;
    await wallet.save();

    const refId = generateWalletRef('ADJ');
    await WalletTransaction.create({
      walletId: wallet._id,
      userEmail: email,
      type: TRANSACTION_TYPES.ADMIN_ADJUST,
      amount: adjustAmount,
      coinType: coinType === 'WINNING' ? 'WINNING' : 'DEPOSIT',
      status: 'COMPLETED',
      balanceBefore,
      balanceAfter: wallet.totalCoins,
      description: reason || `Admin adjustment (${adjustAmount > 0 ? '+' : ''}${adjustAmount} coins)`,
      referenceId: refId,
      adminNote: reason,
    });

    await logAudit({
      adminId: req.user?._id,
      adminEmail: req.user?.email,
      action: 'COINS_MANUALLY_ADJUSTED',
      targetModel: 'Wallet',
      targetId: wallet._id,
      details: { email, amount: adjustAmount, coinType, reason },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully adjusted ${adjustAmount} coins for ${email}.`,
      wallet: {
        depositCoins: wallet.depositCoins,
        winningCoins: wallet.winningCoins,
        totalCoins: wallet.totalCoins,
      },
    });
  } catch (err) {
    next(err);
  }
};
