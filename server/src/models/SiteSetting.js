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
      default: '918114603994',
    },
    upiId: {
      type: String,
      default: 'srikantap571-1@okaxis',
    },
    upiPayeeName: {
      type: String,
      default: 'Srikant Panda',
    },
    upiAid: {
      type: String,
      default: 'uGICAgIDP-4HlSw',
    },
    upiUriTemplate: {
      type: String,
      default: 'upi://pay?pa=srikantap571-1@okaxis&pn=Srikant%20Panda&aid=uGICAgIDP-4HlSw',
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
