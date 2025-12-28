/**
 * Payment History API
 *
 * GET /api/payments/history - Get payment history for current user
 */

import { NextResponse } from "next/server";
import { getPaymentService } from "@/services";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentService = await getPaymentService();
    const invoices = await paymentService.getPaymentHistory(session.userAccountId);

    return NextResponse.json({
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        description: invoice.description,
        paidAt: invoice.paidAt?.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to get payment history:", error);
    return NextResponse.json(
      { error: "Failed to get payment history" },
      { status: 500 }
    );
  }
}
