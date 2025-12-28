/**
 * Payment Service Interface
 * Phase 0: Abstraction for payment processing providers
 */

import type {
  PaymentIntent,
  PaymentResult,
  RefundResult,
  Subscription,
  Invoice,
  PaymentMethod,
} from "./types";

export interface PaymentService {
  // Payment Intents
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent>;

  confirmPayment(intentId: string): Promise<PaymentResult>;

  // Refunds
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;

  // Subscriptions
  createSubscription(customerId: string, priceId: string): Promise<Subscription>;

  cancelSubscription(subscriptionId: string): Promise<void>;

  // Payment History
  getPaymentHistory(customerId: string): Promise<Invoice[]>;

  // Payment Methods (optional - not all providers support)
  listPaymentMethods?(customerId: string): Promise<PaymentMethod[]>;

  addPaymentMethod?(customerId: string, paymentMethodId: string): Promise<PaymentMethod>;

  removePaymentMethod?(paymentMethodId: string): Promise<void>;
}
