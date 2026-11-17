import crypto from 'crypto';

/**
 * Generates a human-readable unique registration reference code.
 * Format: RIT-FF-[SQ/SO]-[5 alphanumeric chars]
 * Example: RIT-FF-SQ-A89K2
 */
export const generateRegistrationRef = (format) => {
  const prefix = format === 'squad' ? 'SQ' : 'SO';
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
  return `RIT-FF-${prefix}-${randomChars}`;
};
