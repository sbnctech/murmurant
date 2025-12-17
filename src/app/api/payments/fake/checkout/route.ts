/**
 * Fake Checkout Simulation
 *
 * GET /api/payments/fake/checkout?ref=xxx - Simulates checkout page
 *
 * Charter P9: DISABLED in production
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function GET(req: NextRequest) {
  // Charter P9: Disabled in production
  if (isProduction()) {
    return NextResponse.json(
      { error: "Fake checkout is disabled in production" },
      { status: 403 }
    );
  }

  const ref = req.nextUrl.searchParams.get("ref");

  if (!ref) {
    return NextResponse.json(
      { error: "Missing ref parameter" },
      { status: 400 }
    );
  }

  // Find the payment intent
  const intent = await prisma.paymentIntent.findFirst({
    where: { providerRef: ref },
    include: {
      registration: {
        include: {
          event: true,
          member: true,
        },
      },
    },
  });

  if (!intent) {
    return NextResponse.json(
      { error: "Payment intent not found" },
      { status: 404 }
    );
  }

  // Get redirect URLs from metadata
  const metadata = intent.metadata as { successUrl?: string; cancelUrl?: string } | null;
  const successUrl = metadata?.successUrl ?? "/member/registrations";
  const cancelUrl = metadata?.cancelUrl ?? "/member/events";

  // Return a simple HTML page that simulates checkout
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Fake Checkout - Development Only</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .amount { font-size: 2em; font-weight: bold; color: #333; }
    .event { color: #666; margin-bottom: 20px; }
    .buttons { display: flex; gap: 10px; }
    button { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
    .success { background: #22c55e; color: white; }
    .cancel { background: #ef4444; color: white; }
    .fail { background: #f59e0b; color: white; }
    .warning { background: #fef3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="warning">
    <strong>Development Mode:</strong> This is a fake checkout for testing purposes.
  </div>

  <div class="card">
    <div class="event">${intent.registration.event.title}</div>
    <div class="amount">$${(intent.amountCents / 100).toFixed(2)} ${intent.currency}</div>
    <p>Registrant: ${intent.registration.member.firstName} ${intent.registration.member.lastName}</p>
  </div>

  <div class="buttons">
    <form action="/api/payments/fake/complete" method="POST" style="display: inline;">
      <input type="hidden" name="ref" value="${ref}" />
      <input type="hidden" name="action" value="success" />
      <input type="hidden" name="successUrl" value="${successUrl}" />
      <button type="submit" class="success">Complete Payment</button>
    </form>

    <form action="/api/payments/fake/complete" method="POST" style="display: inline;">
      <input type="hidden" name="ref" value="${ref}" />
      <input type="hidden" name="action" value="fail" />
      <input type="hidden" name="cancelUrl" value="${cancelUrl}" />
      <button type="submit" class="fail">Simulate Failure</button>
    </form>

    <form action="/api/payments/fake/complete" method="POST" style="display: inline;">
      <input type="hidden" name="ref" value="${ref}" />
      <input type="hidden" name="action" value="cancel" />
      <input type="hidden" name="cancelUrl" value="${cancelUrl}" />
      <button type="submit" class="cancel">Cancel</button>
    </form>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
