/**
 * Payment Intents API
 *
 * POST /api/payments/intents - Create a payment intent
 *
 * Charter Principles:
 * - P1: Requires authentication
 * - N5: Idempotent (same idempotencyKey returns same intent)
 * - P9: Fails closed on errors
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateIntentSchema = z.object({
  registrationId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  idempotencyKey: z.string().min(1).max(255),
  currency: z.string().length(3).default("USD"),
  description: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  // Require authentication
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const parsed = CreateIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { registrationId, amountCents, idempotencyKey, currency, description, successUrl, cancelUrl } = parsed.data;

    // Verify the registration exists and belongs to the authenticated user
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    // Only allow the member who owns the registration to create payment intents
    if (registration.memberId !== auth.context.memberId) {
      return NextResponse.json(
        { error: "Forbidden", message: "You can only pay for your own registrations" },
        { status: 403 }
      );
    }

    // Don't allow payment for already confirmed registrations
    if (registration.status === "CONFIRMED") {
      return NextResponse.json(
        { error: "Registration already confirmed" },
        { status: 400 }
      );
    }

    // Get payment provider and create intent
    const provider = getPaymentProvider();

    if (!provider.isAvailable()) {
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      );
    }

    const result = await provider.createPaymentIntent({
      registrationId,
      amountCents,
      idempotencyKey,
      currency,
      description: description ?? `Registration for ${registration.event.title}`,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      intentId: result.intentId,
      providerRef: result.providerRef,
      status: result.status,
      checkoutUrl: result.checkoutUrl,
      isDuplicate: result.isDuplicate,
    });
  } catch (error) {
    console.error("[PaymentIntents] Error creating intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
