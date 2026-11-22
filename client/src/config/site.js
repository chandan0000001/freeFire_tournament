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
  heroImage: env.VITE_HERO_IMAGE || '/images/ff-odisha-cliff-squad.webp',
  soloImage: env.VITE_SOLO_IMAGE || '/images/ff-odisha-chilika-solo.webp',
  accountImage: env.VITE_ACCOUNT_IMAGE || '/images/arena-account.webp',
  tournamentImage: env.VITE_TOURNAMENT_IMAGE || '/images/ff-odisha-cliff-squad.webp',
  championImage: env.VITE_CHAMPION_IMAGE || '/images/ff-odisha-top-fragger.webp',
  adminUpiId: env.VITE_ADMIN_UPI_ID || '',
  adminUpiName: env.VITE_ADMIN_UPI_NAME || env.VITE_SITE_NAME || 'Rahul Esports',
  adminWhatsAppNumber: env.VITE_ADMIN_WHATSAPP_NUMBER || '',
  qrCodeApiUrl: env.VITE_QR_CODE_API_URL || 'https://api.qrserver.com/v1/create-qr-code/',
  locale: env.VITE_LOCALE || 'en-IN',
  timeZone: env.VITE_TIME_ZONE || 'Asia/Kolkata',
});

const SQUAD_BANNERS = [
  '/images/ff-odisha-cliff-squad.webp',
  '/images/ff-odisha-temple-squad.webp',
  '/images/ff-odisha-captain-sunset.webp',
  '/images/ff-odisha-coastal-vista.webp',
  '/images/ff-odisha-heavy-flanker.webp',
  '/images/ff-odisha-airdrop-crate.webp',
  '/images/ff-odisha-konark-wheel.webp',
  '/images/ff-odisha-coastal-arena.webp',
];

const SOLO_BANNERS = [
  '/images/ff-odisha-chilika-solo.webp',
  '/images/ff-odisha-scout-sunset.webp',
  '/images/ff-odisha-temple-sniper.webp',
  '/images/ff-odisha-top-fragger.webp',
];

export function tournamentArtwork(tournament) {
  const banner = tournament?.bannerUrl;
  if (banner && !/^\/images\/(?:og-image|ff-(?:banner|character)(?:-[\w-]+)?)\.webp$/.test(banner)) {
    return banner;
  }
  const isSolo = tournament?.format === 'solo';
  const pool = isSolo ? SOLO_BANNERS : SQUAD_BANNERS;
  const identifier = String(tournament?._id || tournament?.slug || tournament?.title || '');
  if (!identifier) {
    return isSolo ? site.soloImage : site.tournamentImage;
  }
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash * 31 + identifier.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}
