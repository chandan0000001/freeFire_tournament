import mongoose from 'mongoose';

const siteSettingSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      default: () => process.env.SITE_NAME || '',
    },
    whatsappCommunityUrl: {
      type: String,
      default: () => process.env.WHATSAPP_COMMUNITY_URL || '',
    },
    adminWhatsAppNumber: {
      type: String,
      default: () => process.env.ADMIN_WHATSAPP_NUMBER || '',
    },
    upiId: {
      type: String,
      default: () => process.env.ADMIN_UPI_ID || '',
    },
    upiPayeeName: {
      type: String,
      default: () => process.env.ADMIN_UPI_NAME || process.env.SITE_NAME || '',
    },
    upiAid: {
      type: String,
      default: () => process.env.ADMIN_UPI_AID || '',
    },
    upiUriTemplate: {
      type: String,
      default: () => process.env.ADMIN_UPI_URI || '',
    },
    upiQrCodeUrl: {
      type: String,
      default: '',
    },
    announcementBanner: {
      type: String,
      default: () => process.env.SITE_ANNOUNCEMENT || '',
    },
    contactEmail: {
      type: String,
      default: () => process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || '',
    },
    brevoSenderEmail: {
      type: String,
      default: () => process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || '',
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);
