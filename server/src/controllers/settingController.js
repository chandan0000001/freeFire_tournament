import { SiteSetting } from '../models/SiteSetting.js';
import { AuditLog } from '../models/AuditLog.js';
import { Tournament } from '../models/Tournament.js';
import { Registration } from '../models/Registration.js';
import { Prize } from '../models/Prize.js';
import { logAudit } from '../services/auditService.js';
import { PAYMENT_STATUS } from '../constants/statuses.js';
import { cache } from '../config/redis.js';

export const getPublicSettings = async (req, res, next) => {
  try {
    const cached = await cache.get('settings:public');
    if (cached) {
      return res.json({ success: true, settings: cached, cached: true });
    }

    let setting = await SiteSetting.findOne().lean();
    if (!setting) {
      setting = {
        collegeName: 'Rahul Esports Arena',
        whatsappCommunityUrl: process.env.WHATSAPP_COMMUNITY_URL || '',
        adminWhatsAppNumber: process.env.ADMIN_WHATSAPP_NUMBER || '',
        upiId: process.env.ADMIN_UPI_ID || 'organizer@upi',
        upiPayeeName: process.env.ADMIN_UPI_NAME || 'Rahul Esports Organizer',
        upiAid: process.env.ADMIN_UPI_AID || '',
        upiUriTemplate: process.env.ADMIN_UPI_URI || '',
        upiQrCodeUrl: '',
        announcementBanner: 'Welcome to Rahul Esports Arena! Register now for Weekly Free Fire Tournaments!',
        contactEmail: process.env.EMAIL_FROM || 'admin@rahulesports.in',
      };
    } else {
      // Ensure defaults if fields were empty
      setting.collegeName = setting.collegeName || 'Rahul Esports Arena';
      setting.upiId = setting.upiId || process.env.ADMIN_UPI_ID || 'organizer@upi';
      setting.upiPayeeName = setting.upiPayeeName || process.env.ADMIN_UPI_NAME || 'Rahul Esports Organizer';
      setting.upiAid = setting.upiAid || process.env.ADMIN_UPI_AID || '';
      setting.upiUriTemplate = setting.upiUriTemplate || process.env.ADMIN_UPI_URI || '';
    }

    await cache.set('settings:public', setting, 300);
    res.json({ success: true, settings: setting });
  } catch (error) {
    next(error);
  }
};

export const getAdminSettings = async (req, res, next) => {
  try {
    let setting = await SiteSetting.findOne();
    if (!setting) {
      setting = await SiteSetting.create({
        whatsappCommunityUrl: process.env.WHATSAPP_COMMUNITY_URL || '',
        adminWhatsAppNumber: process.env.ADMIN_WHATSAPP_NUMBER || '',
        upiId: process.env.ADMIN_UPI_ID || 'organizer@upi',
        upiPayeeName: process.env.ADMIN_UPI_NAME || 'Rahul Esports Organizer',
        upiAid: process.env.ADMIN_UPI_AID || '',
        upiUriTemplate: process.env.ADMIN_UPI_URI || '',
      });
    }

    res.json({ success: true, settings: setting });
  } catch (error) {
    next(error);
  }
};

export const updateAdminSettings = async (req, res, next) => {
  try {
    let setting = await SiteSetting.findOne();
    if (!setting) {
      setting = new SiteSetting();
    }

    Object.assign(setting, req.body);
    await setting.save();

    // Invalidate cached public settings in Redis
    await cache.del('settings:public');

    await logAudit({
      action: 'SITE_SETTINGS_UPDATED',
      performedBy: req.user,
      targetEntity: 'SiteSetting',
      targetId: setting._id,
      details: 'Updated site configuration (WhatsApp links, UPI ID, or announcements)',
      changes: req.body,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Settings updated successfully', settings: setting });
  } catch (error) {
    next(error);
  }
};

export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const query = {};
    if (action) query.action = action;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({ success: true, total, logs });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalTournaments, totalRegistrations, pendingPayments, verifiedRegistrations, prizes] = await Promise.all([
      Tournament.countDocuments(),
      Registration.countDocuments(),
      Registration.countDocuments({ paymentStatus: PAYMENT_STATUS.PENDING }),
      Registration.countDocuments({ paymentStatus: PAYMENT_STATUS.VERIFIED }),
      Prize.find().lean(),
    ]);

    const totalPrizePool = prizes.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPrizePaid = prizes
      .filter((p) => p.payoutStatus === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalTournaments,
        totalRegistrations,
        pendingPayments,
        verifiedRegistrations,
        totalPrizePool,
        totalPrizePaid,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendTestBrevoEmail = async (req, res, next) => {
  try {
    const { targetEmail } = req.body;
    const recipient = targetEmail || 'kumardalaichandan803@gmail.com';
    const { sendEmail } = await import('../services/emailService.js');

    const emailResult = await sendEmail({
      to: recipient,
      subject: 'Live Brevo Delivery Test — Rahul Esports Arena',
      htmlContent: `<div style="font-family: Arial, sans-serif; background-color: #0b0e14; color: #f1f5f9; padding: 25px; border-radius: 8px;">
        <h2 style="color: #ff5722; margin-top: 0;">Rahul Esports Arena — Live Email Delivery Test</h2>
        <p>Hello!</p>
        <p>If you are reading this email, Brevo email dispatch is working with <strong>100% success</strong>!</p>
        <p style="font-size: 13px; color: #94a3b8;">Sent via Brevo API on ${new Date().toLocaleString('en-IN')}</p>
      </div>`,
    });

    if (!emailResult.success) {
      return res.status(400).json({
        success: false,
        message: `Brevo dispatch failed: ${emailResult.error}`,
      });
    }

    // Check Brevo relay event status after 2 seconds
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const eventRes = await fetch(
        `https://api.brevo.com/v3/smtp/statistics/events?messageId=${encodeURIComponent(emailResult.messageId)}`,
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            accept: 'application/json',
          },
        }
      );
      const eventsData = await eventRes.json();
      const errEvent = eventsData.events?.find((e) => e.event === 'error');
      if (errEvent) {
        return res.status(400).json({
          success: false,
          message: `Brevo rejected delivery: ${errEvent.reason}`,
          event: errEvent,
        });
      }
    } catch (e) {
      // ignore
    }

    res.json({
      success: true,
      message: `Test email successfully sent to ${recipient}!`,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    next(error);
  }
};
