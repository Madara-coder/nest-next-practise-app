export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface CreatePaymentInput {
  orderId: string;
  amountCents: number;
  currency: string;
}

export interface CreatePaymentResult {
  paymentId: string;
}

/**
 * Abstraction over a payment provider (Stripe, Khalti, eSewa, ...).
 * Business code depends on this interface, never on a concrete provider.
 */
export interface PaymentGateway {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
}
