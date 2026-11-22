import crypto from 'crypto';

/**
 * Generates a cryptographically strong, human-readable unique reference code for Rahul Esports.
 * Format: RE-FF-[SQ/SO]-[12 alphanumeric characters]
 */
export const generateRegistrationRef = (format) => {
  const prefix = format === 'squad' ? 'SQ' : 'SO';
  const randomChars = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `RE-FF-${prefix}-${randomChars}`;
};

/**
 * Generates unique reference for Wallet transactions, withdrawals, and deposits.
 */
export const generateWalletRef = (type = 'TXN') => {
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase();
  const dateStr = Date.now().toString(36).toUpperCase();
  return `RE-${type.toUpperCase()}-${dateStr}${randomChars}`;
};
