import mongoose from 'mongoose';

const siteSettingSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      default: 'RIT Esports Arena',
    },
    whatsappCommunityUrl: {
      type: String,
      default: 'https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2',
    },
    adminWhatsAppNumber: {
      type: String,
      default: () => process.env.ADMIN_WHATSAPP_NUMBER || '',
    },
    upiId: {
      type: String,
      default: () => process.env.ADMIN_UPI_ID || 'organizer@upi',
    },
    upiPayeeName: {
      type: String,
      default: () => process.env.ADMIN_UPI_NAME || 'RIT Esports Organizer',
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
      default: 'Welcome to RIT Esports Arena! Register now for Week 01 Squad & Solo Battles!',
    },
    contactEmail: {
      type: String,
      default: 'kumardalaichandan803@gmail.com',
    },
    brevoSenderEmail: {
      type: String,
      default: 'kumardalaichandan803@gmail.com',
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);
