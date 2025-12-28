/**
 * Subscriptions API
 *
 * POST /api/subscriptions - Create a subscription
 * GET /api/subscriptions - Get current subscription
 * DELETE /api/subscriptions - Cancel subscription
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
    const { priceId } = body;

    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    const paymentService = await getPaymentService();
    const subscription = await paymentService.createSubscription(
      session.userAccountId,
      priceId
    );

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Implement getSubscription in PaymentService
    return NextResponse.json({
      subscription: null,
      message: "No active subscription",
    });
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId || typeof subscriptionId !== "string") {
      return NextResponse.json(
        { error: "Invalid subscription ID" },
        { status: 400 }
      );
    }

    const paymentService = await getPaymentService();
    await paymentService.cancelSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled",
    });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
