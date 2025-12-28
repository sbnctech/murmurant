/**
 * Payment Intent API
 *
 * POST /api/payments/intent - Create a payment intent
 */

import { NextRequest, NextResponse } from "next/server";
import { getPaymentService } from "@/services";
import { getCurrentSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = "usd", metadata = {} } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    const paymentService = await getPaymentService();
    const paymentIntent = await paymentService.createPaymentIntent(
      amount,
      currency,
      {
        ...metadata,
        userId: session.userAccountId,
      }
    );

    return NextResponse.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error("Failed to create payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
