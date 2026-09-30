import { isValidSignature, signPayload } from './webhook-signature.js';

describe('webhook signature', () => {
  const secret = 'whsec_test';
  const payload = JSON.stringify({ id: 'evt_1', type: 'payment.succeeded' });

  it('accepts a payload signed with the shared secret', () => {
    const signature = signPayload(payload, secret);
    expect(isValidSignature(payload, signature, secret)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const signature = signPayload(payload, secret);
    expect(isValidSignature(`${payload} `, signature, secret)).toBe(false);
  });

  it('rejects a signature made with another secret', () => {
    const signature = signPayload(payload, 'wrong-secret');
    expect(isValidSignature(payload, signature, secret)).toBe(false);
  });

  it('rejects a missing or malformed signature', () => {
    expect(isValidSignature(payload, undefined, secret)).toBe(false);
    expect(isValidSignature(payload, 'sha256=short', secret)).toBe(false);
  });
});
