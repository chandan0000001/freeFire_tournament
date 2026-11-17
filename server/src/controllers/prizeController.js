import { Prize } from '../models/Prize.js';
import { logAudit } from '../services/auditService.js';
import { PRIZE_PAYOUT_STATUS } from '../constants/statuses.js';

export const getAdminPrizes = async (req, res, next) => {
  try {
    const { tournamentId, payoutStatus } = req.query;
    const query = {};
    if (tournamentId) query.tournamentId = tournamentId;
    if (payoutStatus) query.payoutStatus = payoutStatus;

    const prizes = await Prize.find(query)
      .select('+offlineTransactionRef') // Select offline transaction ref for admin
      .populate('tournamentId', 'title format matchDate entryFee')
      .populate('winnerRegistrationId', 'referenceId teamName captain')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prizes.length, prizes });
  } catch (error) {
    next(error);
  }
};

export const updatePayoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payoutStatus, offlineTransactionRef, notes } = req.body;

    if (!Object.values(PRIZE_PAYOUT_STATUS).includes(payoutStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payout status' });
    }

    const prize = await Prize.findById(id).populate('tournamentId');
    if (!prize) {
      return res.status(404).json({ success: false, message: 'Prize record not found' });
    }

    const previousStatus = prize.payoutStatus;
    prize.payoutStatus = payoutStatus;
    if (offlineTransactionRef) prize.offlineTransactionRef = offlineTransactionRef.trim();
    if (notes) prize.notes = notes.trim();

    if (payoutStatus === PRIZE_PAYOUT_STATUS.PAID) {
      prize.paidAt = new Date();
    }

    await prize.save();

    await logAudit({
      action: 'PRIZE_PAYOUT_UPDATED',
      performedBy: req.user,
      targetEntity: 'Prize',
      targetId: prize._id,
      details: `Prize payout for "${prize.winnerName}" (${prize.title} - ₹${prize.amount}) marked as ${payoutStatus}. Ref: ${offlineTransactionRef || 'N/A'}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Prize payout status updated to ${payoutStatus}`,
      prize,
    });
  } catch (error) {
    next(error);
  }
};
