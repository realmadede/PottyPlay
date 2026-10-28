import { createHash, randomBytes, randomInt, pbkdf2Sync, timingSafeEqual } from "crypto";

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
export function generateSessionToken(prefix: string = "pstk_"): string {
  return prefix + randomBytes(32).toString("hex");
}

import { hashSync as argon2HashSync, verifySync as argon2VerifySync } from "@node-rs/argon2";

/**
 * Securely hashes a password using modern Argon2id.
 */
export function hashPassword(password: string): string {
  return argon2HashSync(password);
}

/**
 * Verifies a candidate password against an Argon2id or legacy PBKDF2 hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (storedHash.startsWith("$argon2")) {
      return argon2VerifySync(storedHash, password);
    }
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const derived = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    const keyBuf = Buffer.from(key, "hex");
    const derivedBuf = Buffer.from(derived, "hex");
    if (keyBuf.length !== derivedBuf.length) return false;
    return timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}
