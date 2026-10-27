import { createHash, randomBytes, randomInt } from "crypto";

/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 */
export function generateOtpCode(): string {
  const code = randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Computes a SHA-256 hash of the OTP code with a salt.
 */
export function hashOtp(code: string, salt: string = "pottyplay_otp_salt"): string {
  return createHash("sha256")
    .update(`${salt}:${code.trim()}`)
    .digest("hex");
}

/**
 * Compares a candidate OTP against a stored hash in constant time.
 */
export function verifyOtpHash(
  candidateCode: string,
  storedHash: string,
  salt: string = "pottyplay_otp_salt"
): boolean {
  const candidateHash = hashOtp(candidateCode, salt);
  if (candidateHash.length !== storedHash.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < candidateHash.length; i++) {
    mismatch |= candidateHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Generates a cryptographically secure session token.
 */
export function generateSessionToken(): string {
  return "pstk_" + randomBytes(32).toString("hex");
}
