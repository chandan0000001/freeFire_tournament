/**
 * Sanitizes and escapes user input strings for safe inclusion in MongoDB $regex queries,
 * mitigating NoSQL Injection and Regular Expression Denial of Service (ReDoS) attacks.
 *
 * @param {string} str - Raw user search input
 * @param {number} maxLen - Maximum allowed character length
 * @returns {string} - Escaped safe regular expression string
 */
export const escapeRegex = (str, maxLen = 80) => {
  if (typeof str !== 'string') return '';
  const sanitized = str.trim().slice(0, maxLen);
  // Escapes all special regex metacharacters: . * + ? ^ $ { } ( ) | [ ] \
  return sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates whether an incoming string matches safe alphanumeric format for reference codes or IDs
 */
export const isSafeIdentifier = (str) => {
  if (typeof str !== 'string') return false;
  return /^[a-zA-Z0-9_-]{1,64}$/.test(str.trim());
};
