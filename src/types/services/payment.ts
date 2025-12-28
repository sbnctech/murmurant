/**
 * Payment Service Interface Types
 */

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentType =
  | "membership_dues"
  | "event_registration"
  | "donation"
  | "other";

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  description: string | null;
  externalId: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  expiresAt: Date;
}

export interface CreatePaymentInput {
  memberId: string;
  type: PaymentType;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface DuesBalance {
  memberId: string;
  currentBalance: number;
  dueDate: Date | null;
  isPastDue: boolean;
  lastPaymentAt: Date | null;
}

export interface DuesPaymentInput {
  memberId: string;
  amount: number;
  paymentMethodId?: string;
}

export interface PaymentService {
  createIntent(input: CreatePaymentInput): Promise<PaymentIntent>;
  confirmIntent(intentId: string, paymentMethodId: string): Promise<Payment>;
  cancelIntent(intentId: string): Promise<void>;
  getById(paymentId: string): Promise<Payment | null>;
  getMemberPayments(memberId: string, limit?: number): Promise<Payment[]>;
  getDuesBalance(memberId: string): Promise<DuesBalance>;
  payDues(input: DuesPaymentInput): Promise<Payment>;
  refund(paymentId: string, amount?: number, reason?: string): Promise<Payment>;
}
