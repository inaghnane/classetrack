import crypto from 'crypto';

/**
 * Generate a QR token for a seance
 * Token format: base64(seanceId.epochWindow.hmac)
 * HMAC is generated from qrSecret and "seanceId|epochWindow"
 */
export function generateQRToken(
  seanceId: string,
  qrSecret: string
): string {
  const now = Date.now();
  const epochWindow = Math.floor(now / 30000); // 30-second windows (was 3s)
  
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
 * Accepts tokens from current window and ±1 window (total 90 seconds tolerance)
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

    const currentWindow = Math.floor(Date.now() / 30000); // 30-second windows (was 3s)
    const windowNum = parseInt(tokenWindow, 10);

    // Allow current window and ±1 windows (total 90 seconds tolerance)
    if (Math.abs(currentWindow - windowNum) > 1) {
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
