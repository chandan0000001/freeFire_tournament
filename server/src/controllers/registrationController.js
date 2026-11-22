import { Registration } from '../models/Registration.js';
import { Tournament } from '../models/Tournament.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { reserveSlot, releaseSlot, checkAvailableCapacity, syncTournamentSlots } from '../services/slotService.js';
import { generateRegistrationRef } from '../utils/refGenerator.js';
import { escapeRegex } from '../utils/security.js';
import { sendRegistrationEmail, sendPaymentVerifiedEmail } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';
import { PAYMENT_STATUS, TOURNAMENT_FORMAT } from '../constants/statuses.js';
import { cache } from '../config/redis.js';

export const registerSquad = async (req, res, next) => {
  let reservedTournament = null;
  try {
    const { tournamentId, teamName, captain, players } = req.body;

    if (!tournamentId || !teamName || !captain) {
      return res.status(400).json({ success: false, message: 'Missing required squad registration fields' });
    }

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ success: false, message: 'Squad registration requires a player roster' });
    }

    // Validate and normalize 4 player slots (missing players fill up 'N/A')
    const normalizedPlayers = [];
    for (let i = 0; i < 4; i++) {
      const p = players[i] || {};
      const rawIgn = (p.inGameName || '').trim();
      const rawUid = (p.freeFireUid || '').trim();

      // If Player 1 (Captain)
      if (i === 0) {
        if (!rawIgn) {
          return res.status(400).json({ success: false, message: 'Captain (Player 1) In-Game Name is required.' });
        }
        if (!rawUid || !/^\d{6,17}$/.test(rawUid)) {
          return res.status(400).json({
            success: false,
            message: 'Captain (Player 1) Free Fire UID must be numbers only, between 6 and 17 digits.',
          });
        }
        normalizedPlayers.push({
          name: p.name?.trim() || captain.name?.trim() || rawIgn,
          inGameName: rawIgn,
          freeFireUid: rawUid,
          isConsentPublic: Boolean(p.isConsentPublic),
        });
      } else {
        // Player 2, 3, 4: If not provided or empty, fill up 'N/A'
        if (!rawIgn && !rawUid) {
          normalizedPlayers.push({
            name: 'N/A',
            inGameName: 'N/A',
            freeFireUid: 'N/A',
            isConsentPublic: false,
          });
        } else {
          const isIgnNA = !rawIgn || rawIgn.toUpperCase() === 'N/A';
          const isUidNA = !rawUid || rawUid.toUpperCase() === 'N/A';

          if (isUidNA) {
            normalizedPlayers.push({
              name: isIgnNA ? 'N/A' : (p.name?.trim() || rawIgn),
              inGameName: isIgnNA ? 'N/A' : rawIgn,
              freeFireUid: 'N/A',
              isConsentPublic: Boolean(p.isConsentPublic),
            });
          } else {
            // UID is provided: MUST be numbers only, 6 to 17 digits
            if (!/^\d{6,17}$/.test(rawUid)) {
              return res.status(400).json({
                success: false,
                message: `Player ${i + 1} Free Fire UID must be numbers only, between 6 and 17 digits (or 'N/A').`,
              });
            }
            normalizedPlayers.push({
              name: isIgnNA ? `Player ${i + 1}` : (p.name?.trim() || rawIgn),
              inGameName: isIgnNA ? `Player ${i + 1}` : rawIgn,
              freeFireUid: rawUid,
              isConsentPublic: Boolean(p.isConsentPublic),
            });
          }
        }
      }
    }

    // Check for duplicate Free Fire UIDs within squad (excluding N/A)
    const activeUids = normalizedPlayers
      .map((p) => p.freeFireUid.trim())
      .filter((uid) => uid && uid.toUpperCase() !== 'N/A');
    const uniqueUids = new Set(activeUids);
    if (uniqueUids.size !== activeUids.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate Free Fire UIDs detected. Each player in the squad must have a unique Free Fire UID.',
      });
    }

    // Check if captain email is already registered in this tournament
    const existing = await Registration.findOne({
      tournamentId,
      'captain.email': captain.email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered for this tournament. Reference: ' + existing.referenceId,
      });
    }

    // 1. Verify capacity (only admin-verified registrations occupy filled slots)
    reservedTournament = await checkAvailableCapacity(tournamentId);

    // 2. Generate unique reference ID
    const referenceId = generateRegistrationRef('squad');

    // 3. Create registration document
    const registration = await Registration.create({
      referenceId,
      tournamentId,
      format: TOURNAMENT_FORMAT.SQUAD,
      teamName: teamName.trim(),
      captain: {
        name: captain.name?.trim() || 'Captain',
        email: captain.email.toLowerCase().trim(),
        phone: captain.phone?.trim() || captain.whatsapp?.trim() || '',
        collegeRollNo: captain.collegeRollNo?.trim() || captain.collegeRoll?.trim() || 'N/A',
      },
      players: normalizedPlayers,
      paymentStatus: PAYMENT_STATUS.PENDING,
    });

    // 4. Fetch site settings for UPI & WhatsApp numbers
    const settings = (await SiteSetting.findOne()) || {};
    const adminWhatsApp = settings.adminWhatsAppNumber || process.env.ADMIN_WHATSAPP_NUMBER || '';
    const upiId = settings.upiId || process.env.ADMIN_UPI_ID || 'organizer@upi';
    const payeeName = settings.upiPayeeName || process.env.ADMIN_UPI_NAME || 'Rahul Esports Organizer';
    const aid = settings.upiAid || process.env.ADMIN_UPI_AID || '';
    const amount = reservedTournament.entryFee;

    // UPI Deep Link & Dynamic QR Code
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&aid=${encodeURIComponent(aid)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

    // 5. Send confirmation email in background
    sendRegistrationEmail(registration, reservedTournament, upiId).catch((err) =>
      console.error('[Email Notice]', err.message)
    );

    // 6. Build pre-filled WhatsApp click-to-chat URL
    const prefilledText = encodeURIComponent(
      `Hello Admin! I have registered for "${reservedTournament.title}".\n` +
      `*Reference ID:* ${referenceId}\n` +
      `*Team Name:* ${teamName}\n` +
      `*Captain:* ${captain.name}\n` +
      `*Amount:* ₹${amount}\n` +
      `Attached is my UPI payment screenshot / UTR.`
    );
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${prefilledText}`;

    // Invalidate tournament cache so remaining slots counter updates immediately across app
    await cache.delPattern('tournaments:*');

    res.status(201).json({
      success: true,
      message: 'Squad registration submitted successfully! Please complete manual UPI payment.',
      registration: {
        referenceId: registration.referenceId,
        tournamentTitle: reservedTournament.title,
        teamName: registration.teamName,
        captainName: registration.captain.name,
        entryFee: amount,
        paymentStatus: registration.paymentStatus,
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
    // Rollback atomic slot if error happened after reservation
    if (reservedTournament) {
      await releaseSlot(reservedTournament._id);
    }
    next(error);
  }
};

export const registerSolo = async (req, res, next) => {
  let reservedTournament = null;
  try {
    const { tournamentId, captain, inGameName, freeFireUid, isConsentPublic } = req.body;

    if (!tournamentId || !captain || !inGameName || !freeFireUid) {
      return res.status(400).json({ success: false, message: 'Missing required solo registration fields' });
    }

    const cleanUid = String(freeFireUid).trim();
    if (!/^\d{6,17}$/.test(cleanUid)) {
      return res.status(400).json({
        success: false,
        message: 'Free Fire UID must be numbers only, between 6 and 17 digits.',
      });
    }

    const existing = await Registration.findOne({
      tournamentId,
      'captain.email': captain.email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered for this tournament. Reference: ' + existing.referenceId,
      });
    }

    // 1. Verify capacity (only admin-verified registrations occupy filled slots)
    reservedTournament = await checkAvailableCapacity(tournamentId);

    // 2. Generate unique reference ID
    const referenceId = generateRegistrationRef('solo');

    // 3. Create registration document
    const registration = await Registration.create({
      referenceId,
      tournamentId,
      format: TOURNAMENT_FORMAT.SOLO,
      captain: {
        name: captain.name?.trim() || 'Captain',
        email: captain.email.toLowerCase().trim(),
        phone: captain.phone?.trim() || captain.whatsapp?.trim() || '',
        collegeRollNo: captain.collegeRollNo?.trim() || captain.collegeRoll?.trim() || 'N/A',
      },
      players: [
        {
          name: captain.name.trim(),
          inGameName: inGameName.trim(),
          freeFireUid: freeFireUid.trim(),
          isConsentPublic: Boolean(isConsentPublic),
        },
      ],
      paymentStatus: PAYMENT_STATUS.PENDING,
    });

    // 4. Fetch site settings
    const settings = (await SiteSetting.findOne()) || {};
    const adminWhatsApp = settings.adminWhatsAppNumber || process.env.ADMIN_WHATSAPP_NUMBER || '';
    const upiId = settings.upiId || process.env.ADMIN_UPI_ID || 'organizer@upi';
    const payeeName = settings.upiPayeeName || process.env.ADMIN_UPI_NAME || 'Rahul Esports Organizer';
    const aid = settings.upiAid || process.env.ADMIN_UPI_AID || '';
    const amount = reservedTournament.entryFee;

    // UPI Deep Link & Dynamic QR Code
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&aid=${encodeURIComponent(aid)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

    // 5. Send confirmation email
    sendRegistrationEmail(registration, reservedTournament, upiId).catch((err) =>
      console.error('[Email Notice]', err.message)
    );

    // 6. WhatsApp click-to-chat link
    const prefilledText = encodeURIComponent(
      `Hello Admin! I have registered for "${reservedTournament.title}" (Solo).\n` +
      `*Reference ID:* ${referenceId}\n` +
      `*Player Name:* ${captain.name}\n` +
      `*In-Game Name:* ${inGameName}\n` +
      `*Amount:* ₹${amount}\n` +
      `Attached is my UPI payment screenshot / UTR.`
    );
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${prefilledText}`;

    // Invalidate tournament cache so remaining slots counter updates immediately across app
    await cache.delPattern('tournaments:*');

    res.status(201).json({
      success: true,
      message: 'Solo registration submitted successfully! Please complete manual UPI payment.',
      registration: {
        referenceId: registration.referenceId,
        tournamentTitle: reservedTournament.title,
        playerName: captain.name,
        inGameName,
        entryFee: amount,
        paymentStatus: registration.paymentStatus,
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
    if (reservedTournament) {
      await releaseSlot(reservedTournament._id);
    }
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

export const submitCaptainEvidence = async (req, res, next) => {
  try {
    const { referenceId, notes } = req.body;
    if (!referenceId) {
      return res.status(400).json({ success: false, message: 'Registration reference ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Screenshot evidence file is required' });
    }

    const registration = await Registration.findOne({ referenceId: referenceId.toUpperCase().trim() });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const screenshotUrl = `/uploads/evidence/${req.file.filename}`;
    registration.captainEvidence.push({
      screenshotUrl,
      notes: notes || '',
      uploadedAt: new Date(),
    });
    await registration.save();
    await cache.delPattern('tournaments:*');

    res.json({
      success: true,
      message: 'Evidence screenshot submitted successfully for admin review.',
      screenshotUrl,
    });
  } catch (error) {
    next(error);
  }
};

// Admin Endpoints
export const getAdminRegistrations = async (req, res, next) => {
  try {
    // Auto-cleanup: remove rejected registrations older than 5 hours (as well as unacted pending older than 5 hours)
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    await Registration.deleteMany({
      paymentStatus: PAYMENT_STATUS.REJECTED,
      updatedAt: { $lt: fiveHoursAgo },
    });

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

    const previousStatus = registration.paymentStatus;
    registration.paymentStatus = status;
    registration.paymentDetails.verifiedBy = req.user._id;
    registration.paymentDetails.verifiedAt = new Date();

    if (utr) registration.paymentDetails.utr = utr.trim();
    if (notes) registration.paymentDetails.notes = notes.trim();

    if (status === PAYMENT_STATUS.VERIFIED) {
      registration.isApproved = true;
      registration.paymentDetails.rejectionReason = '';

      // Send payment verified confirmation email
      sendPaymentVerifiedEmail(registration, registration.tournamentId).catch((err) =>
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

    await Registration.findByIdAndDelete(id);

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
