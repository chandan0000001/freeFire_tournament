import { claimPaymentReference } from '../services/paymentReferenceService.js';
import { MatchResult } from '../models/MatchResult.js';
import { Prize } from '../models/Prize.js';
import { RoomDistribution } from '../models/RoomDistribution.js';
import { afterCommit } from '../middleware/transactional.js';
import { Registration } from '../models/Registration.js';
import { Tournament } from '../models/Tournament.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { reserveSlot, releaseSlot, checkAvailableCapacity, syncTournamentSlots } from '../services/slotService.js';
import { generateRegistrationRef } from '../utils/refGenerator.js';
import { escapeRegex } from '../utils/security.js';
import { sendRegistrationEmail, sendPaymentVerifiedEmail } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';
import { PAYMENT_STATUS, TOURNAMENT_FORMAT } from '../constants/statuses.js';

export const registerSquad = async (req, res, next) => {
  let reservedTournament = null;
  try {
    const { tournamentId, teamName, captain, players, preferredSlot, slotTime, utr } = req.body;

    if (!tournamentId || !teamName) {
      return res.status(400).json({ success: false, message: 'Missing tournament or team name.' });
    }

    if (!Array.isArray(players) || (players.length < 3 || players.length > 4)) {
      return res.status(400).json({ success: false, message: 'Squad registration requires at least 3 players.' });
    }

    // Determine designated Team Leader
    const designatedLeader = players.find((p) => p.isLeader) || players[0];
    const leaderName = designatedLeader?.name?.trim() || captain?.name?.trim() || 'Team Leader';
    const leaderPhone = designatedLeader?.phone?.trim() || captain?.phone?.trim() || '';

    if (!leaderPhone) {
      return res.status(400).json({ success: false, message: 'Team Leader phone number is required.' });
    }

    // Normalize up to 4 player positions (3 or 4 players accepted)
    const normalizedPlayers = [];
    for (let i = 0; i < 4; i++) {
      const p = players[i];
      if (!p || !p.name || p.name.trim().toUpperCase() === 'N/A') {
        if (i < 3) {
          return res.status(400).json({ success: false, message: `Player ${i + 1} Name is required.` });
        }
        // Player 4 is optional
        normalizedPlayers.push({
          name: 'N/A',
          phone: 'N/A',
          inGameName: 'N/A',
          freeFireUid: 'N/A',
          isLeader: false,
        });
      } else {
        const isThisLeader = Boolean(p.isLeader || (i === 0 && !players.some((x) => x.isLeader)));
        normalizedPlayers.push({
          name: p.name.trim(),
          phone: (p.phone || '').trim(),
          inGameName: (p.inGameName || p.name).trim(),
          freeFireUid: (p.freeFireUid || 'N/A').trim(),
          isLeader: isThisLeader,
        });
      }
    }

    // Serialize concurrent submissions for the same tournament.
    await Tournament.updateOne({ _id: tournamentId }, { $inc: { registrationRevision: 1 } });
    // 1. Verify capacity
    reservedTournament = await checkAvailableCapacity(tournamentId);
    if (reservedTournament.format !== 'squad') return res.status(400).json({ success: false, message: 'Tournament format does not match this registration.' });
    if (await Registration.exists({ tournamentId, userId: req.user._id })) return res.status(409).json({ success: false, message: 'You have already registered for this tournament.' });

    // 2. Generate unique reference ID
    const referenceId = generateRegistrationRef('squad');

    const assignedSlot = ['morning', 'afternoon', 'evening'].includes(preferredSlot) ? preferredSlot : 'morning';
    const slotLabel =
      assignedSlot === 'afternoon'
        ? 'Afternoon (2:00 PM – 4:30 PM)'
        : assignedSlot === 'evening'
        ? 'Evening (6:00 PM – 8:30 PM)'
        : 'Morning (10:00 AM – 12:30 PM)';

    // 3. Create registration document
    const registration = await Registration.create({
      referenceId,
      tournamentId,
      userId: req.user?._id || null,
      format: TOURNAMENT_FORMAT.SQUAD,
      preferredSlot: assignedSlot,
      slotTime: slotTime || slotLabel,
      teamName: teamName.trim(),
      captain: {
        name: leaderName,
        email: req.user.email,
        phone: leaderPhone || req.user?.mobileNumber || '',
        collegeRollNo: '',
      },
      players: normalizedPlayers,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentDetails: {
        utr: (utr || '').trim(),
      },
    });

    // 4. Fetch site settings for UPI & WhatsApp numbers
    const settings = (await SiteSetting.findOne()) || {};
    const adminWhatsApp = settings.adminWhatsAppNumber || process.env.ADMIN_WHATSAPP_NUMBER || '';
    const upiId = settings.upiId || process.env.ADMIN_UPI_ID || '';
    const payeeName = settings.upiPayeeName || process.env.ADMIN_UPI_NAME || process.env.SITE_NAME || '';
    const amount = reservedTournament.entryFee;

    // UPI Deep Link & Dynamic QR Code
    const qrBaseUrl = (process.env.QR_CODE_API_URL || 'https://api.qrserver.com/v1/create-qr-code/').replace(/\/+$/, '');
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
    const qrCodeUrl = `${qrBaseUrl}/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

    // Build roster text for WhatsApp
    const rosterList = normalizedPlayers
      .filter((p) => p.name !== 'N/A')
      .map((p, idx) => `${idx + 1}. ${p.name}${p.isLeader ? ' (Team Leader)' : ''} - ${p.phone}`)
      .join('\n');

    // 5. Pre-filled WhatsApp message
    const prefilledText = encodeURIComponent(
      `Hello Admin! I have registered for "${reservedTournament.title}".\n` +
      `*Reference ID:* ${referenceId}\n` +
      `*Team Name:* ${teamName.trim()}\n` +
      `*Preferred Slot:* ${slotLabel}\n` +
      `*Team Leader:* ${leaderName} (${leaderPhone})\n` +
      `*Squad Roster:*\n${rosterList}\n` +
      `*Entry Fee:* ₹${amount}\n` +
      `*12-Digit UPI UTR:* ${utr ? utr.trim() : 'Submitting on WhatsApp'}\n` +
      `Please verify and confirm our custom room match slot!`
    );
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${prefilledText}`;


    res.status(201).json({
      success: true,
      message: 'Squad registration submitted successfully!',
      registration: {
        referenceId: registration.referenceId,
        tournamentTitle: reservedTournament.title,
        teamName: registration.teamName,
        captainName: leaderName,
        captainPhone: leaderPhone,
        preferredSlot: registration.preferredSlot,
        slotTime: registration.slotTime,
        entryFee: amount,
        paymentStatus: registration.paymentStatus,
        players: normalizedPlayers,
        utr: registration.paymentDetails.utr,
      },
      paymentInstructions: {
        upiId,
        payeeName,
        amount,
        upiDeepLink,
        qrCodeUrl,
        adminWhatsApp,
        whatsappChatUrl: whatsappUrl,
      },
    });
  } catch (error) {

    next(error);
  }
};

export const registerSolo = async (req, res, next) => {
  let reservedTournament = null;
  try {
    const { tournamentId, captain, inGameName, freeFireUid, isConsentPublic, preferredSlot, slotTime, utr } = req.body;

    if (!tournamentId || !captain?.name || !captain?.phone) {
      return res.status(400).json({ success: false, message: 'Player name and WhatsApp phone number are required.' });
    }

    // Serialize concurrent submissions for the same tournament.
    await Tournament.updateOne({ _id: tournamentId }, { $inc: { registrationRevision: 1 } });
    // 1. Verify capacity
    reservedTournament = await checkAvailableCapacity(tournamentId);
    if (reservedTournament.format !== 'solo') return res.status(400).json({ success: false, message: 'Tournament format does not match this registration.' });
    if (await Registration.exists({ tournamentId, userId: req.user._id })) return res.status(409).json({ success: false, message: 'You have already registered for this tournament.' });

    // 2. Generate unique reference ID
    const referenceId = generateRegistrationRef('solo');

    const assignedSlot = ['morning', 'afternoon', 'evening'].includes(preferredSlot) ? preferredSlot : 'morning';
    const slotLabel =
      assignedSlot === 'afternoon'
        ? 'Afternoon (2:00 PM – 4:30 PM)'
        : assignedSlot === 'evening'
        ? 'Evening (6:00 PM – 8:30 PM)'
        : 'Morning (10:00 AM – 12:30 PM)';

    // 3. Create registration document
    const registration = await Registration.create({
      referenceId,
      tournamentId,
      userId: req.user?._id || null,
      format: TOURNAMENT_FORMAT.SOLO,
      preferredSlot: assignedSlot,
      slotTime: slotTime || slotLabel,
      captain: {
        name: captain.name.trim(),
        email: req.user.email,
        phone: captain.phone.trim() || req.user?.mobileNumber || '',
        collegeRollNo: '',
      },
      players: [
        {
          name: captain.name.trim(),
          phone: captain.phone.trim() || req.user?.mobileNumber || '',
          inGameName: (inGameName || captain.name).trim(),
          freeFireUid: (freeFireUid || 'N/A').trim(),
          isLeader: true,
          isConsentPublic: Boolean(isConsentPublic),
        },
      ],
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentDetails: {
        utr: (utr || '').trim(),
      },
    });

    // 4. Fetch site settings
    const settings = (await SiteSetting.findOne()) || {};
    const adminWhatsApp = settings.adminWhatsAppNumber || process.env.ADMIN_WHATSAPP_NUMBER || '';
    const upiId = settings.upiId || process.env.ADMIN_UPI_ID || '';
    const payeeName = settings.upiPayeeName || process.env.ADMIN_UPI_NAME || process.env.SITE_NAME || '';
    const amount = reservedTournament.entryFee;

    // UPI Deep Link & Dynamic QR Code
    const qrBaseUrl = (process.env.QR_CODE_API_URL || 'https://api.qrserver.com/v1/create-qr-code/').replace(/\/+$/, '');
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
    const qrCodeUrl = `${qrBaseUrl}/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

    // 5. WhatsApp click-to-chat link
    const prefilledText = encodeURIComponent(
      `Hello Admin! I have registered for "${reservedTournament.title}" (Solo).\n` +
      `*Reference ID:* ${referenceId}\n` +
      `*Player Name:* ${captain.name}\n` +
      `*WhatsApp Phone:* ${captain.phone}\n` +
      `*Preferred Slot:* ${slotLabel}\n` +
      `*Amount:* ₹${amount}\n` +
      `*12-Digit UPI UTR:* ${utr ? utr.trim() : 'Submitting on WhatsApp'}\n` +
      `Please verify and confirm my custom room match slot!`
    );
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${prefilledText}`;


    res.status(201).json({
      success: true,
      message: 'Solo registration submitted successfully!',
      registration: {
        referenceId: registration.referenceId,
        tournamentTitle: reservedTournament.title,
        playerName: captain.name,
        playerPhone: captain.phone,
        preferredSlot: registration.preferredSlot,
        slotTime: registration.slotTime,
        entryFee: amount,
        paymentStatus: registration.paymentStatus,
        utr: registration.paymentDetails.utr,
      },
      paymentInstructions: {
        upiId,
        payeeName,
        amount,
        upiDeepLink,
        qrCodeUrl,
        adminWhatsApp,
        whatsappChatUrl: whatsappUrl,
      },
    });
  } catch (error) {

    next(error);
  }
};

export const checkRegistrationStatus = async (req, res, next) => {
  try {
    const { ref } = req.params;
    const registration = await Registration.findOne({ referenceId: ref.toUpperCase().trim() })
      .populate('tournamentId', 'title matchDate status format entryFee')
      .lean();

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found with this reference ID' });
    }

    // Return sanitized public status — never expose phone, email, or private UTR
    res.json({
      success: true,
      registration: {
        referenceId: registration.referenceId,
        tournamentTitle: registration.tournamentId?.title,
        matchDate: registration.tournamentId?.matchDate,
        format: registration.format,
        teamOrPlayerName: registration.format === 'squad' ? registration.teamName : registration.players[0]?.inGameName,
        paymentStatus: registration.paymentStatus,
        isApproved: registration.isApproved,
        roomCredentialStatus: registration.roomCredentialStatus,
        createdAt: registration.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const orConditions = [
      { userId: user._id },
    ];
    if (user.email) {
      orConditions.push({ userId: null, 'captain.email': user.email.toLowerCase().trim() });
      orConditions.push({ userId: { $exists: false }, 'captain.email': user.email.toLowerCase().trim() });
    }

    const registrations = await Registration.find({ $or: orConditions })
      .populate('tournamentId', 'title format entryFee prizePool matchDate status bannerUrl map')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      registrations: registrations || [],
    });
  } catch (error) {
    next(error);
  }
};

// Admin Endpoints
export const getAdminRegistrations = async (req, res, next) => {
  try {
    const { tournamentId, paymentStatus, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (tournamentId) query.tournamentId = tournamentId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      query.$or = [
        { referenceId: { $regex: safeSearch, $options: 'i' } },
        { teamName: { $regex: safeSearch, $options: 'i' } },
        { 'captain.name': { $regex: safeSearch, $options: 'i' } },
        { 'captain.email': { $regex: safeSearch, $options: 'i' } },
        { 'captain.phone': { $regex: safeSearch, $options: 'i' } },
        { 'paymentDetails.utr': { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .populate('tournamentId', 'title format entryFee matchDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, utr, rejectionReason, notes } = req.body;

    if (!Object.values(PAYMENT_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const registration = await Registration.findById(id).populate('tournamentId');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (status === PAYMENT_STATUS.VERIFIED && registration.tournamentId.entryFee > 0) await claimPaymentReference(utr || registration.paymentDetails.utr, 'registration', registration._id);
    const previousStatus = registration.paymentStatus;
    if (status === PAYMENT_STATUS.VERIFIED && previousStatus !== PAYMENT_STATUS.VERIFIED) await reserveSlot(registration.tournamentId._id);
    registration.paymentStatus = status;
    registration.isApproved = status === PAYMENT_STATUS.VERIFIED;
    registration.paymentDetails.verifiedBy = req.user._id;
    registration.paymentDetails.verifiedAt = new Date();

    if (utr) registration.paymentDetails.utr = utr.trim();
    if (notes) registration.paymentDetails.notes = notes.trim();

    if (status === PAYMENT_STATUS.VERIFIED) {
      registration.isApproved = true;
      registration.paymentDetails.rejectionReason = '';

      // Send payment verified confirmation email
      afterCommit(() => sendPaymentVerifiedEmail(registration, registration.tournamentId)).catch((err) =>
        console.error('[Email Notice]', err.message)
      );
    } else if (status === PAYMENT_STATUS.REJECTED) {
      registration.isApproved = false;
      registration.paymentDetails.rejectionReason = rejectionReason || 'Payment could not be verified.';
    }

    await registration.save();

    // Synchronize tournament filled slots (only verified registrations occupy slots)
    if (registration.tournamentId?._id) {
      await syncTournamentSlots(registration.tournamentId._id);
    }

    await logAudit({
      action: `PAYMENT_${status.toUpperCase()}`,
      performedBy: req.user,
      targetEntity: 'Registration',
      targetId: registration._id,
      details: `Payment for ${registration.referenceId} updated from "${previousStatus}" to "${status}". UTR: ${utr || 'N/A'}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Registration payment status updated to ${status}`,
      registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete a registration record (e.g. rejected application or manual cleanup)
 */
export const deleteRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id).populate('tournamentId');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    const tournamentId = registration.tournamentId?._id;
    const refId = registration.referenceId;
    const displayName = registration.teamName || registration.players?.[0]?.inGameName || 'Participant';

    if (registration.paymentStatus === PAYMENT_STATUS.VERIFIED || await Prize.exists({ winnerRegistrationId: id }) || await MatchResult.exists({ 'entries.registrationId': id })) return res.status(409).json({ success: false, message: 'Confirmed or scored registrations must be retained. Reject an unconfirmed entry before removing it.' });
    await Registration.findByIdAndDelete(id);
    await RoomDistribution.deleteMany({ registrationId: id });

    // Resynchronize slots for the tournament
    if (tournamentId) {
      await syncTournamentSlots(tournamentId);
    }

    await logAudit({
      action: 'REGISTRATION_DELETED',
      performedBy: req.user,
      targetEntity: 'Registration',
      targetId: id,
      details: `Admin deleted registration ${refId} (${displayName})`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Registration ${refId} removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};
