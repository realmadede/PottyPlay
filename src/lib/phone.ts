/**
 * Normalizes phone numbers to standard E.164 format.
 * Tanzanian national formats (06/07... or 255...) are standardized to +255...
 */
export function normalizePhoneNumber(rawNumber: string): string {
  // Strip whitespace, hyphens, parentheses, dots
  let cleaned = rawNumber.replace(/[\s\-\(\)\.]/g, "").trim();

  // If starts with 0 and followed by 9 digits (Tanzanian local format e.g. 0712345678 or 0612345678)
  if (/^0[67]\d{8}$/.test(cleaned)) {
    return "+255" + cleaned.slice(1);
  }

  // If starts with 255 without plus
  if (/^255[67]\d{8}$/.test(cleaned)) {
    return "+" + cleaned;
  }

  // If already in international format starting with +
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }

  // If 9 digits starting with 6 or 7
  if (/^[67]\d{8}$/.test(cleaned)) {
    return "+255" + cleaned;
  }

  return cleaned;
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  // Standard E.164: + followed by 8 to 15 digits
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}
