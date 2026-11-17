import crypto from 'crypto';

/**
 * Generates a cryptographically strong, human-readable unique registration reference code.
 * Format: RIT-FF-[SQ/SO]-[12 alphanumeric characters]
 * Keyspace: 16^12 (~2.81 x 10^14 combinations), completely immune to brute-force IDOR enumeration.
 * Example: RIT-FF-SQ-8F3B9A1C4E72
 */
export const generateRegistrationRef = (format) => {
  const prefix = format === 'squad' ? 'SQ' : 'SO';
  const randomChars = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `RIT-FF-${prefix}-${randomChars}`;
};

