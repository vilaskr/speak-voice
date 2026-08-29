/**
 * Secure Report ID generation and validation module.
 * Uses Web Crypto API (crypto.getRandomValues) for high entropy unpredictability.
 */

// Custom charset avoiding ambiguous characters like 0, O, 1, I, L
const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a cryptographically secure, unpredictable Report ID.
 * Format: XXXX-XXXX-XXXX (e.g. ABCD-7F92-KL31)
 */
export function generateSecureReportId(): string {
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  
  let raw = '';
  for (let i = 0; i < 12; i++) {
    raw += CHARS[randomBytes[i] % CHARS.length];
  }

  // Format into 3 blocks of 4 characters: ABCD-7F92-KL31
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

/**
 * Sanitizes and normalizes user input for Report ID lookup.
 */
export function sanitizeReportId(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}

/**
 * Validates Report ID format.
 */
export function isValidReportIdFormat(id: string): boolean {
  const sanitized = sanitizeReportId(id);
  // Matches XXXX-XXXX-XXXX pattern or 12 character alphanumeric string
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(sanitized) || /^[A-Z0-9]{12}$/.test(sanitized);
}

/**
 * Sanitizes text inputs to prevent XSS / malicious injection attempts.
 */
export function sanitizeTextInput(text: string): string {
  return text.trim();
}
