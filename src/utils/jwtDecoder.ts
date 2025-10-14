/**
 * JWT Token Decoder Utility
 * Helps decode and validate JWT tokens
 */

export interface DecodedJWT {
  header: any;
  payload: any;
  signature: string;
  isExpired: boolean;
  expirationDate?: Date;
}

export function decodeJWT(token: string): DecodedJWT | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = parts[2];

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? payload.exp < now : false;
    const expirationDate = payload.exp ? new Date(payload.exp * 1000) : undefined;

    return {
      header,
      payload,
      signature,
      isExpired,
      expirationDate
    };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function isJWTValid(token: string): boolean {
  const decoded = decodeJWT(token);
  return decoded !== null && !decoded.isExpired;
}