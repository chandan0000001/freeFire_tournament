const env = import.meta.env;
const safeUrl = (value) => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
export const site = Object.freeze({
  name: env.VITE_SITE_NAME || 'Rahul Esports',
  region: env.VITE_SITE_REGION || 'Odisha',
  tagline: env.VITE_SITE_TAGLINE || 'Free Fire Competitive Arena',
  communityUrl: safeUrl(env.VITE_COMMUNITY_URL),
  contactEmail: env.VITE_CONTACT_EMAIL || '',
  regionNative: env.VITE_SITE_REGION_NATIVE || 'ଓଡ଼ିଶା',
  organizerName: env.VITE_ORGANIZER_NAME || 'Rahul',
  organizerImage: env.VITE_ORGANIZER_IMAGE || '/images/rahul.webp',
  organizerRole: env.VITE_ORGANIZER_ROLE || 'Tournament organizer',
  heroImage: env.VITE_HERO_IMAGE || '/images/odisha-squad.webp',
  soloImage: env.VITE_SOLO_IMAGE || '/images/chilika-solo.webp',
  accountImage: env.VITE_ACCOUNT_IMAGE || '/images/arena-account.webp',
  tournamentImage: env.VITE_TOURNAMENT_IMAGE || '/images/konark-squad.webp',
  championImage: env.VITE_CHAMPION_IMAGE || '/images/odisha-champion.webp',
  adminUpiId: env.VITE_ADMIN_UPI_ID || '',
  adminUpiName: env.VITE_ADMIN_UPI_NAME || env.VITE_SITE_NAME || 'Rahul Esports',
  adminWhatsAppNumber: env.VITE_ADMIN_WHATSAPP_NUMBER || '',
  qrCodeApiUrl: env.VITE_QR_CODE_API_URL || 'https://api.qrserver.com/v1/create-qr-code/',
  locale: env.VITE_LOCALE || 'en-IN',
  timeZone: env.VITE_TIME_ZONE || 'Asia/Kolkata',
});

export function tournamentArtwork(tournament) {
  const banner = tournament?.bannerUrl;
  if (banner && !/^\/images\/(?:odisha-arena|og-image|ff-(?:banner|character)(?:-[\w-]+)?)\.webp$/.test(banner)) return banner;
  return tournament?.format === 'solo' ? site.soloImage : site.tournamentImage;
}
