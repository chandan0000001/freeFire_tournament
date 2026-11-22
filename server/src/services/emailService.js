import { getBrevoApi, SendSmtpEmail } from '../config/brevo.js';
import { SiteSetting } from '../models/SiteSetting.js';

const getSender = async () => {
  let senderName = process.env.SITE_NAME || process.env.EMAIL_FROM_NAME || 'Rahul Esports';
  let senderEmail = process.env.EMAIL_FROM || '';

  try {
    const setting = await SiteSetting.findOne().lean();
    if (setting?.brevoSenderEmail) {
      senderEmail = setting.brevoSenderEmail.trim();
    }
    if (setting?.collegeName && !setting.collegeName.includes('RIT') && !setting.collegeName.includes('Roland')) {
      senderName = setting.collegeName;
    }
  } catch (e) {
    // fallback
  }

  return {
    email: senderEmail,
    name: senderName,
  };
};

/**
 * Universal email dispatcher
 */
export const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const apiInstance = getBrevoApi();
  const sender = await getSender();

  // If no Brevo API instance exists, log to console for development
  if (!apiInstance) {
    if (process.env.NODE_ENV === 'production') return { success: false, error: 'Email service is not configured.', mode: 'unconfigured' };
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mode: 'mock',
    };
  }

  try {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = [{ email: to }];
    if (textContent) {
      sendSmtpEmail.textContent = textContent;
    }

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return {
      success: true,
      messageId: response?.body?.messageId || response?.messageId || 'delivered',
      mode: 'brevo',
    };
  } catch (error) {
    console.error(`[Brevo Email Error] Failed sending to ${to}:`, error.response?.body || error.message);
    return {
      success: false,
      error: error.response?.body?.message || error.message,
      mode: 'brevo_error',
    };
  }
};

/**
 * Template: Registration Submitted & Payment Instructions
 */
export const sendRegistrationEmail = async (registration, tournament, upiId) => {
  const subject = `Registration Received: ${tournament.title} [${registration.referenceId}]`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0e14; color: #f1f5f9; padding: 25px; border-radius: 8px;">
      <h2 style="color: #ff5722; margin-top: 0;">Rahul Esports Arena</h2>
      <p>Hello <strong>${registration.captain.name}</strong>,</p>
      <p>Your registration for <strong>${tournament.title}</strong> has been received!</p>
      
      <div style="background-color: #161b26; padding: 15px; border-left: 4px solid #ff5722; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Reference ID:</strong> <span style="font-family: monospace; font-size: 16px; color: #f59e0b;">${registration.referenceId}</span></p>
        <p style="margin: 5px 0;"><strong>Format:</strong> ${registration.format.toUpperCase()} (${registration.format === 'squad' ? registration.teamName : 'Solo'})</p>
        <p style="margin: 5px 0;"><strong>Entry Fee:</strong> ₹${tournament.entryFee}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #f59e0b;">Payment Pending</span></p>
      </div>

      <h3 style="color: #06b6d4;">Next Step: Complete UPI Payment</h3>
      <p>Please pay <strong>₹${tournament.entryFee}</strong> to our official UPI ID: <strong style="color: #fff; background: #222d42; padding: 3px 8px; border-radius: 4px;">${upiId}</strong></p>
      <p>After paying, send your payment screenshot & UTR reference along with Reference ID <strong>${registration.referenceId}</strong> to the official Admin WhatsApp contact.</p>
      
      <p style="margin-top: 25px; font-size: 13px; color: #94a3b8;">See you on the battleground!<br/>Rahul Esports Arena Team</p>
    </div>
  `;

  return sendEmail({
    to: registration.captain.email,
    subject,
    htmlContent,
  });
};

/**
 * Template: Payment Verified & Registration Approved
 */
export const sendPaymentVerifiedEmail = async (registration, tournament) => {
  const subject = `Payment Verified & Slot Confirmed: ${tournament.title} [${registration.referenceId}]`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0e14; color: #f1f5f9; padding: 25px; border-radius: 8px;">
      <h2 style="color: #10b981; margin-top: 0;">Payment Verified — You're In!</h2>
      <p>Hello <strong>${registration.captain.name}</strong>,</p>
      <p>Your payment for <strong>${tournament.title}</strong> has been successfully verified by tournament admins.</p>
      
      <div style="background-color: #161b26; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Reference ID:</strong> <span style="font-family: monospace; font-size: 16px; color: #10b981;">${registration.referenceId}</span></p>
        <p style="margin: 5px 0;"><strong>Team / Player:</strong> ${registration.format === 'squad' ? registration.teamName : registration.captain.name}</p>
        <p style="margin: 5px 0;"><strong>Match Date:</strong> ${new Date(tournament.matchDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
      </div>

      <p><strong>Note:</strong> Custom Room ID and Password will be sent to this email address 15–30 minutes before match time.</p>
      <p style="margin-top: 25px; font-size: 13px; color: #94a3b8;">Rahul Esports Arena Team</p>
    </div>
  `;

  return sendEmail({
    to: registration.captain.email,
    subject,
    htmlContent,
  });
};

/**
 * Template: Room ID & Password Distribution
 */
export const sendRoomCredentialsEmail = async ({ to, captainName, tournamentTitle, roomId, roomPassword, matchDate, customNote }) => {
  const subject = `URGENT: Free Fire Room Credentials for ${tournamentTitle}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0e14; color: #f1f5f9; padding: 25px; border-radius: 8px;">
      <h2 style="color: #ff5722; margin-top: 0;">Free Fire Custom Room Details</h2>
      <p>Hello <strong>${captainName}</strong>,</p>
      <p>Here are the official room credentials for <strong>${tournamentTitle}</strong>:</p>
      
      <div style="background-color: #161b26; padding: 20px; border-left: 4px solid #ff5722; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 8px 0; font-size: 16px;"><strong>ROOM ID:</strong> <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #06b6d4; background: #07090d; padding: 4px 10px; border-radius: 4px;">${roomId}</span></p>
        <p style="margin: 8px 0; font-size: 16px;"><strong>PASSWORD:</strong> <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #f59e0b; background: #07090d; padding: 4px 10px; border-radius: 4px;">${roomPassword}</span></p>
        <p style="margin: 8px 0; font-size: 14px; color: #cbd5e1;"><strong>Match Time:</strong> ${new Date(matchDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
      </div>

      ${customNote ? `<div style="background: #1e293b; padding: 10px 15px; border-radius: 4px; margin: 15px 0;"><p style="margin:0; font-size: 14px;"><strong>Admin Note:</strong> ${customNote}</p></div>` : ''}

      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 12px; border-radius: 4px; margin: 20px 0;">
        <p style="color: #f87171; margin: 0; font-size: 13px;"><strong>CONFIDENTIALITY WARNING:</strong> Do not share these credentials with unauthorized players. Joining with unauthorized Free Fire accounts will lead to immediate disqualification without refund.</p>
      </div>

      <p style="margin-top: 25px; font-size: 13px; color: #94a3b8;">Good luck and Booyah!<br/>Rahul Esports Arena Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    htmlContent,
  });
};

/**
 * Template: Password Reset Link via Brevo
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = 'Rahul Esports - Password Reset Request';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0e14; color: #f1f5f9; padding: 25px; border-radius: 8px; max-width: 580px; margin: 0 auto; border: 1px solid #1f293d;">
      <h2 style="color: #ff5722; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">Rahul Esports Arena</h2>
      <p style="font-size: 15px; color: #cbd5e1;">Hello <strong>${name || 'Player'}</strong>,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
        We received a request to reset the password for your Rahul Esports account. Click the button below to set a new password:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #ff5500, #ff8800); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 15px rgba(255, 85, 0, 0.4);">
          Reset Your Password
        </a>
      </div>

      <div style="background-color: #121722; padding: 15px; border-radius: 6px; border-left: 4px solid #ff5722; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          <strong>Security Notice:</strong> This link is valid for <strong>15 minutes only</strong> and can be used once. If you did not request this password reset, please ignore this email. Your account remains completely secure.
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; word-break: break-all; margin-top: 20px;">
        If the button above does not work, copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color: #ff5722;">${resetUrl}</a>
      </p>

      <p style="margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #1f293d; padding-top: 15px;">
        Rahul Esports Arena · Free Fire Competitive League · Odisha
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    htmlContent,
  });
};
