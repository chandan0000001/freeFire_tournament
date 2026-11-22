import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
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
      .populate('tournamentId', 'title format matchDate entryFee prizeConfig')
      .populate('winnerRegistrationId', 'referenceId teamName captain')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prizes.length, prizes });
  } catch (error) {
    next(error);
  }
};

export const createAdminPrize = async (req, res, next) => {
  try {
    const {
      tournamentId,
      rank = 1,
      title = '1st Place Champion',
      amount,
      winnerRegistrationId,
      winnerName = 'To be decided',
      payoutStatus = PRIZE_PAYOUT_STATUS.PENDING,
      offlineTransactionRef = '',
      notes = '',
    } = req.body;

    if (!tournamentId || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Tournament and Prize Amount are required' });
    }

    const tournament = await Tournament.findOneAndUpdate({ _id: tournamentId }, { $inc: { registrationRevision: 1 } });
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found.' });
    if (!Number.isSafeInteger(Number(amount)) || Number(amount) < 0 || !Number.isSafeInteger(Number(rank)) || Number(rank) < 1) return res.status(400).json({ success: false, message: 'Prize amount and rank must be valid whole numbers.' });
    if (await Prize.exists({ tournamentId, rank: Number(rank) })) return res.status(409).json({ success: false, message: 'A prize already exists for this tournament rank.' });
    if (winnerRegistrationId && !await Registration.exists({ _id: winnerRegistrationId, tournamentId, paymentStatus: 'verified' })) return res.status(400).json({ success: false, message: 'Winner must be a verified participant in this tournament.' });
    if (payoutStatus === 'paid' && !/^\d{12}$/.test(offlineTransactionRef.trim())) return res.status(400).json({ success: false, message: 'A 12-digit payout UTR is required.' });
    const prize = await Prize.create({
      tournamentId,
      rank: parseInt(rank, 10) || 1,
      title: title.trim(),
      amount: parseFloat(amount),
      winnerRegistrationId: winnerRegistrationId || null,
      winnerName: winnerName.trim(),
      payoutStatus,
      offlineTransactionRef: offlineTransactionRef.trim(),
      paidAt: payoutStatus === PRIZE_PAYOUT_STATUS.PAID ? new Date() : null,
      notes: notes.trim(),
    });


    await logAudit({
      action: 'PRIZE_ALLOCATED',
      performedBy: req.user,
      targetEntity: 'Prize',
      targetId: prize._id,
      details: `Allocated ₹${amount} prize (${title}) to "${winnerName}".`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Prize record created successfully', prize });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminPrize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prize = await Prize.findById(id);
    if (!prize) {
      return res.status(404).json({ success: false, message: 'Prize record not found' });
    }

    if (prize.payoutStatus === 'paid') return res.status(409).json({ success: false, message: 'Paid prize records must be retained.' });
    await prize.deleteOne();


    await logAudit({
      action: 'PRIZE_DELETED',
      performedBy: req.user,
      targetEntity: 'Prize',
      targetId: id,
      details: `Deleted prize record for "${prize.winnerName}" (${prize.title} - ₹${prize.amount}).`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Prize record deleted successfully' });
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

    if (prize.payoutStatus === 'paid' && payoutStatus !== 'paid') return res.status(409).json({ success: false, message: 'Completed payouts cannot be reopened.' });
    if (payoutStatus === 'paid' && !/^\d{12}$/.test((offlineTransactionRef || '').trim())) return res.status(400).json({ success: false, message: 'A 12-digit payout UTR is required.' });
    prize.payoutStatus = payoutStatus;
    if (offlineTransactionRef !== undefined) prize.offlineTransactionRef = offlineTransactionRef.trim();
    if (notes !== undefined) prize.notes = notes.trim();

    if (payoutStatus === PRIZE_PAYOUT_STATUS.PAID) {
      prize.paidAt = new Date();
    } else {
      prize.paidAt = null;
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

