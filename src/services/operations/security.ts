import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { config } from '../../config/environment';

export function issueOpaqueCredential(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

function hmac(key: string, value: string): string {
  return createHmac('sha256', key).update(value).digest('hex');
}

export function hashDeviceCredential(value: string): string {
  return hmac(config.operations.deviceCredentialHmacKey, value);
}

export function verifyDeviceCredential(value: string, expected: string): boolean {
  const actual = Buffer.from(hashDeviceCredential(value), 'hex');
  const target = Buffer.from(expected, 'hex');
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export function hashGiftCardCode(value: string): string {
  return hmac(config.operations.giftCardHmacKey, value.trim().toUpperCase());
}

export function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function redactProviderMetadata(input: Record<string, unknown>): Record<string, unknown> {
  const blocked = /(^|_)(pan|number|track|cvv|cvc|pin|client.?secret|secret|cardholder)(_|$)/i;
  return Object.fromEntries(Object.entries(input).filter(([key]) => !blocked.test(key)));
}
