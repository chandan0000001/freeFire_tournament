import { Match } from '../models/Match.js';
import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { RoomDistribution } from '../models/RoomDistribution.js';
import { sendRoomCredentialsEmail } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';
import { PAYMENT_STATUS, ROOM_DELIVERY_STATUS } from '../constants/statuses.js';

/**
 * Save / Update Room credentials for a tournament match
 */
export const setRoomCredentials = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { roomId, roomPassword, map, scheduledAt } = req.body;

    if (!roomId || !roomPassword) {
      return res.status(400).json({ success: false, message: 'Both Room ID and Password are required' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Find or create match #1 for this tournament
    let match = await Match.findOne({ tournamentId, matchNumber: 1 });
    if (!match) {
      match = new Match({
        tournamentId,
        matchNumber: 1,
        scheduledAt: scheduledAt || tournament.matchDate,
        map: map || tournament.map || 'Bermuda',
      });
    }

    match.roomCredentials = {
      roomId: roomId.trim(),
      roomPassword: roomPassword.trim(),
      credentialsEnteredAt: new Date(),
    };
    match.status = 'room_active';
    await match.save();

    await logAudit({
      action: 'ROOM_CREDENTIALS_SET',
      performedBy: req.user,
      targetEntity: 'Match',
      targetId: match._id,
      details: `Room credentials set for tournament: "${tournament.title}". Room ID: ${roomId}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Room credentials securely stored for tournament match.',
      match: {
        id: match._id,
        tournamentId: match.tournamentId,
        matchNumber: match.matchNumber,
        status: match.status,
        credentialsEnteredAt: match.roomCredentials.credentialsEnteredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Distribute Room credentials to selected payment-verified registrations
 */
export const distributeRoomCredentials = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { registrationIds, customNote } = req.body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one registration to receive room credentials' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const match = await Match.findOne({ tournamentId, matchNumber: 1 }).select('+roomCredentials.roomId +roomCredentials.roomPassword');
    if (!match || !match.roomCredentials?.roomId || !match.roomCredentials?.roomPassword) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and Password have not been set for this tournament yet. Please save room credentials first.',
      });
    }

    // Fetch verified registrations belonging to this tournament
    const eligibleRegistrations = await Registration.find({
      _id: { $in: registrationIds },
      tournamentId,
      paymentStatus: PAYMENT_STATUS.VERIFIED,
      isApproved: true,
    });

    if (eligibleRegistrations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible payment-verified registrations found in the selection.',
      });
    }

    const deliveryResults = [];

    for (const reg of eligibleRegistrations) {
      const emailResult = await sendRoomCredentialsEmail({
        to: reg.captain.email,
        captainName: reg.captain.name,
        tournamentTitle: tournament.title,
        roomId: match.roomCredentials.roomId,
        roomPassword: match.roomCredentials.roomPassword,
        matchDate: match.scheduledAt || tournament.matchDate,
        customNote,
      });

      const deliveryStatus = emailResult.success ? ROOM_DELIVERY_STATUS.SENT : ROOM_DELIVERY_STATUS.FAILED;

      // Update registration status
      reg.roomCredentialStatus = deliveryStatus;
      await reg.save();

      // Log room distribution entry
      const log = await RoomDistribution.create({
        tournamentId,
        matchId: match._id,
        registrationId: reg._id,
        recipientEmail: reg.captain.email,
        deliveryStatus,
        providerMessageId: emailResult.messageId || '',
        errorMessage: emailResult.error || '',
        sentAt: new Date(),
      });

      deliveryResults.push({
        registrationId: reg._id,
        referenceId: reg.referenceId,
        captainEmail: reg.captain.email,
        status: deliveryStatus,
        error: emailResult.error || null,
        logId: log._id,
      });
    }

    await logAudit({
      action: 'ROOM_CREDENTIALS_DISTRIBUTED',
      performedBy: req.user,
      targetEntity: 'Tournament',
      targetId: tournamentId,
      details: `Distributed credentials to ${deliveryResults.filter(d => d.status === 'sent').length}/${eligibleRegistrations.length} registrations`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Room details dispatched to ${eligibleRegistrations.length} verified participant(s).`,
      results: deliveryResults,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View delivery logs for a tournament
 */
export const getRoomDeliveryLogs = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const rawLogs = await RoomDistribution.find({ tournamentId })
      .populate('registrationId', 'referenceId teamName captain format')
      .sort({ createdAt: -1 });

    // Filter out orphaned logs where the underlying registration was removed
    const logs = rawLogs.filter((log) => Boolean(log.registrationId));

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retry delivery to a failed recipient
 */
export const retryRoomDelivery = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const log = await RoomDistribution.findById(logId)
      .populate('tournamentId')
      .populate('registrationId');

    if (!log) {
      return res.status(404).json({ success: false, message: 'Delivery log record not found' });
    }

    const match = await Match.findById(log.matchId).select('+roomCredentials.roomId +roomCredentials.roomPassword');
    if (!match || !match.roomCredentials?.roomId) {
      return res.status(400).json({ success: false, message: 'Room credentials no longer available for this match' });
    }

    const emailResult = await sendRoomCredentialsEmail({
      to: log.recipientEmail,
      captainName: log.registrationId.captain.name,
      tournamentTitle: log.tournamentId.title,
      roomId: match.roomCredentials.roomId,
      roomPassword: match.roomCredentials.roomPassword,
      matchDate: match.scheduledAt,
    });

    log.deliveryStatus = emailResult.success ? ROOM_DELIVERY_STATUS.SENT : ROOM_DELIVERY_STATUS.FAILED;
    log.providerMessageId = emailResult.messageId || '';
    log.errorMessage = emailResult.error || '';
    log.attemptNumber += 1;
    log.sentAt = new Date();
    await log.save();

    if (!emailResult.success) {
      return res.status(400).json({
        success: false,
        message: `Retry failed for ${log.recipientEmail}: ${emailResult.error || 'Provider rejected dispatch'}`,
        error: emailResult.error,
        log,
      });
    }

    res.json({
      success: true,
      message: `Room details successfully redelivered to ${log.recipientEmail}`,
      log,
    });
  } catch (error) {
    next(error);
  }
};
