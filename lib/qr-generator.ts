import crypto from 'crypto';

// Constants for QR token timing
const WINDOW_SIZE_MS = 3000; // 3 seconds (instead of 30 seconds)
const VALIDITY_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_WINDOW_OFFSET = Math.floor(VALIDITY_DURATION_MS / WINDOW_SIZE_MS); // ±100 windows for 5 minutes

/**
 * Generate a QR token for a seance
 * Token format: base64(seanceId.epochWindow.hmac)
 * HMAC is generated from qrSecret and "seanceId|epochWindow"
 * Token remains valid for 5 minutes (±100 windows of 3 seconds each)
 */
export function generateQRToken(
  seanceId: string,
  qrSecret: string
): string {
  const now = Date.now();
  const epochWindow = Math.floor(now / WINDOW_SIZE_MS); // 3-second windows
  
  const message = `${seanceId}|${epochWindow}`;
  const hmac = crypto
    .createHmac('sha256', qrSecret)
    .update(message)
    .digest('hex');

  const token = `${seanceId}.${epochWindow}.${hmac}`;
  return Buffer.from(token).toString('base64');
}

/**
 * Validate a QR token
 * Accepts tokens from current window and within ±100 windows (5 minutes total validity)
 * This allows the same QR to be valid for 5 minutes while changing every 3 seconds
 */
export function validateQRToken(
  token: string,
  seanceId: string,
  qrSecret: string
): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [tokenSeanceId, tokenWindow, tokenHmac] = decoded.split('.');

    if (tokenSeanceId !== seanceId) {
      return false;
    }

    const currentWindow = Math.floor(Date.now() / WINDOW_SIZE_MS);
    const windowNum = parseInt(tokenWindow, 10);

    // Allow windows within 5 minutes (±100 windows of 3 seconds)
    if (Math.abs(currentWindow - windowNum) > MAX_WINDOW_OFFSET) {
      return false;
    }

    // Verify HMAC
    const message = `${seanceId}|${tokenWindow}`;
    const expectedHmac = crypto
      .createHmac('sha256', qrSecret)
      .update(message)
      .digest('hex');

    return tokenHmac === expectedHmac;
  } catch {
    return false;
  }
}

/**
 * Generate a random QR secret for a seance
 */
export function generateQRSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
