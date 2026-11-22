const env = import.meta.env;
const safeUrl = (value) => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
export const site = Object.freeze({
  name: env.VITE_SITE_NAME || '',
  region: env.VITE_SITE_REGION || '',
  tagline: env.VITE_SITE_TAGLINE || '',
  communityUrl: safeUrl(env.VITE_COMMUNITY_URL),
  contactEmail: env.VITE_CONTACT_EMAIL || '',
  regionNative: env.VITE_SITE_REGION_NATIVE || '',
  organizerName: env.VITE_ORGANIZER_NAME || '',
  organizerImage: env.VITE_ORGANIZER_IMAGE || '',
  organizerRole: env.VITE_ORGANIZER_ROLE || '',
  heroImage: env.VITE_HERO_IMAGE || '',
  tournamentImage: env.VITE_TOURNAMENT_IMAGE || '',
  locale: env.VITE_LOCALE || 'en-IN',
  timeZone: env.VITE_TIME_ZONE || 'Asia/Kolkata',
});
