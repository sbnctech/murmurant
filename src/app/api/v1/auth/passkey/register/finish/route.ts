/**
 * POST /api/v1/auth/passkey/register/finish
 *
 * Finish passkey registration ceremony.
 * Verifies the authenticator response and stores the credential.
 *
 * Request body:
 * {
 *   challengeId: string,
 *   response: RegistrationResponseJSON,
 *   deviceName?: string
 * }
 *
 * Response:
 * - 201: { success: true, credentialId: string, deviceName: string | null }
 * - 400: Invalid request
 * - 401: Not authenticated
 * - 500: Server error
 *
 * Security:
 * - Requires valid session cookie
 * - Challenge must match the authenticated user
 * - Response is verified against expected origin and rpID
 * - Event is audit-logged
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthContext } from "@/lib/auth";
import { finishRegistration } from "@/lib/passkey";
import { errors } from "@/lib/api";
import { auditMutation } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

const RequestSchema = z.object({
  challengeId: z.string().uuid(),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
      transports: z.array(z.string()).optional(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.string().optional(),
  }),
  deviceName: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  // Require authenticated session
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const context = auth.context as AuthContext;
  const { email } = context;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errors.validation("Invalid JSON body");
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.entries(fieldErrors)[0];
    const message = firstError
      ? `Invalid ${firstError[0]}: ${firstError[1]?.[0]}`
      : "Invalid request format";
    return errors.validation(message);
  }

  const { challengeId, response, deviceName } = parsed.data;

  try {
    // Get user account ID
    const userAccount = await prisma.userAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!userAccount) {
      return errors.notFound("UserAccount", email);
    }

    const result = await finishRegistration(
      userAccount.id,
      challengeId,
      response as RegistrationResponseJSON,
      deviceName
    );

    // Audit log the registration
    await auditMutation(req, context, {
      action: "PASSKEY_REGISTERED",
      capability: "self",
      objectType: "PasskeyCredential",
      objectId: result.credentialId,
      metadata: {
        deviceName: result.deviceName,
      },
    });

    return NextResponse.json(
      {
        success: true,
        credentialId: result.credentialId,
        deviceName: result.deviceName,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PASSKEY] Registration finish error:", message);

    // Return generic error to prevent information leakage
    if (
      message.includes("Challenge") ||
      message.includes("expired") ||
      message.includes("verification")
    ) {
      return errors.validation(message);
    }

    return errors.internal("Failed to complete passkey registration");
  }
}
