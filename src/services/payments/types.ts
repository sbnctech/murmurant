/**
 * Payment Service Types
 * Phase 0: Abstraction layer for payment processing
 */

export type PaymentStatus = "pending" | "succeeded" | "failed" | "canceled" | "refunded";

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account" | "check";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  errorMessage?: string;
  errorCode?: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  priceId: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  paidAt?: Date;
  createdAt: Date;
  description?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: "pending" | "succeeded" | "failed";
  errorMessage?: string;
}
