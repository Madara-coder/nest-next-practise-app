import { createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_HEADER = 'x-webhook-signature';

export function signPayload(payload: string | Buffer, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
}

export function isValidSignature(
  payload: string | Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) {
    return false;
  }
  const expected = Buffer.from(signPayload(payload, secret));
  const received = Buffer.from(signature);
  // Constant-time comparison prevents timing attacks.
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
