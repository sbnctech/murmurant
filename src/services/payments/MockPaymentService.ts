/**
 * Mock Payment Service for Testing
 * Phase 0: In-memory implementation for tests and development
 */

import type { PaymentService } from "./PaymentService";
import type {
  PaymentIntent,
  PaymentResult,
  RefundResult,
  Subscription,
  Invoice,
} from "./types";

export class MockPaymentService implements PaymentService {
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private invoices: Map<string, Invoice[]> = new Map();
  private idCounter = 0;

  private generateId(prefix: string): string {
    return `${prefix}_mock_${++this.idCounter}`;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: this.generateId("pi"),
      amount,
      currency,
      status: "pending",
      clientSecret: `secret_${this.generateId("cs")}`,
      metadata,
      createdAt: new Date(),
    };
    this.paymentIntents.set(intent.id, intent);
    return intent;
  }

  async confirmPayment(intentId: string): Promise<PaymentResult> {
    const intent = this.paymentIntents.get(intentId);
    if (!intent) {
      return {
        success: false,
        paymentId: intentId,
        status: "failed",
        errorMessage: "Payment intent not found",
        errorCode: "not_found",
      };
    }

    intent.status = "succeeded";
    return {
      success: true,
      paymentId: intentId,
      status: "succeeded",
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    const intent = this.paymentIntents.get(paymentId);
    if (!intent) {
      return {
        success: false,
        refundId: "",
        amount: 0,
        status: "failed",
        errorMessage: "Payment not found",
      };
    }

    const refundAmount = amount ?? intent.amount;
    intent.status = "refunded";

    return {
      success: true,
      refundId: this.generateId("re"),
      amount: refundAmount,
      status: "succeeded",
    };
  }

  async createSubscription(customerId: string, priceId: string): Promise<Subscription> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription: Subscription = {
      id: this.generateId("sub"),
      customerId,
      priceId,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.status = "canceled";
    }
  }

  async getPaymentHistory(customerId: string): Promise<Invoice[]> {
    return this.invoices.get(customerId) ?? [];
  }

  // Test helpers
  reset(): void {
    this.paymentIntents.clear();
    this.subscriptions.clear();
    this.invoices.clear();
    this.idCounter = 0;
  }

  addInvoice(customerId: string, invoice: Omit<Invoice, "id" | "createdAt">): Invoice {
    const fullInvoice: Invoice = {
      ...invoice,
      id: this.generateId("inv"),
      createdAt: new Date(),
    };
    const customerInvoices = this.invoices.get(customerId) ?? [];
    customerInvoices.push(fullInvoice);
    this.invoices.set(customerId, customerInvoices);
    return fullInvoice;
  }
}
