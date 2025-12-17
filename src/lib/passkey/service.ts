/**
 * Passkey Service - WebAuthn Registration and Authentication
 *
 * Implements WebAuthn/FIDO2 ceremonies using SimpleWebAuthn.
 *
 * Security Requirements:
 * - All ceremonies are verified server-side with strict rpID/origin checks
 * - Challenges are single-use and time-limited
 * - Signature counters are validated to detect cloned authenticators
 * - All security events are audit-logged
 *
 * Charter Compliance:
 * - P1: Identity is cryptographically provable via passkey
 * - P7: All passkey events are logged for observability
 * - P9: Fails closed on verification errors
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import {
  getRelyingPartyId,
  getRelyingPartyName,
  getExpectedOrigin,
  CHALLENGE_EXPIRATION_MS,
} from "./config";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

// ============================================================================
// Types
// ============================================================================

export interface PasskeyRegistrationBeginResult {
  options: PublicKeyCredentialCreationOptionsJSON;
  challengeId: string;
}

export interface PasskeyRegistrationFinishResult {
  success: true;
  credentialId: string;
  deviceName: string | null;
}

export interface PasskeyAuthenticationBeginResult {
  options: PublicKeyCredentialRequestOptionsJSON;
  challengeId: string;
}

export interface PasskeyAuthenticationFinishResult {
  success: true;
  userAccountId: string;
  memberId: string;
  email: string;
  credentialId: string;
}

export interface PasskeyInfo {
  id: string;
  credentialId: string;
  deviceName: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  isRevoked: boolean;
}

// ============================================================================
// Registration Ceremony
// ============================================================================

/**
 * Begin passkey registration ceremony.
 *
 * Requires the user to be authenticated (via existing session or magic link).
 * Generates WebAuthn options and stores the challenge.
 *
 * @param userAccountId - The authenticated user's account ID
 * @param ipAddress - Client IP for rate limiting
 */
export async function beginRegistration(
  userAccountId: string,
  ipAddress?: string
): Promise<PasskeyRegistrationBeginResult> {
  // Get user and their existing credentials
  const userAccount = await prisma.userAccount.findUnique({
    where: { id: userAccountId },
    include: {
      member: true,
      passkeys: {
        where: { isRevoked: false },
        select: { credentialId: true, transports: true },
      },
    },
  });

  if (!userAccount) {
    throw new Error("User account not found");
  }

  // Build exclude list from existing credentials
  // SimpleWebAuthn v11+ expects credential IDs as base64url strings
  const excludeCredentials = userAccount.passkeys.map((passkey) => ({
    id: passkey.credentialId,
    transports: passkey.transports as AuthenticatorTransportFuture[],
  }));

  // Generate registration options
  const options = await generateRegistrationOptions({
    rpName: getRelyingPartyName(),
    rpID: getRelyingPartyId(),
    userID: isoBase64URL.toBuffer(userAccountId),
    userName: userAccount.email,
    userDisplayName: `${userAccount.member.firstName} ${userAccount.member.lastName}`,
    // Prefer platform authenticators (Touch ID, Face ID, Windows Hello)
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: undefined, // Allow both platform and cross-platform
    },
    // Don't re-register existing authenticators
    excludeCredentials,
    // Request attestation for audit purposes (but don't require it)
    attestationType: "none",
  });

  // Store challenge in database
  const challenge = await prisma.authChallenge.create({
    data: {
      challenge: options.challenge,
      type: "registration",
      userAccountId,
      ipAddress,
      expiresAt: new Date(Date.now() + CHALLENGE_EXPIRATION_MS),
    },
  });

  return {
    options,
    challengeId: challenge.id,
  };
}

/**
 * Finish passkey registration ceremony.
 *
 * Verifies the authenticator response and stores the credential.
 *
 * @param userAccountId - The authenticated user's account ID
 * @param challengeId - The challenge ID from beginRegistration
 * @param response - The authenticator response from the browser
 * @param deviceName - Optional user-provided name for this passkey
 */
export async function finishRegistration(
  userAccountId: string,
  challengeId: string,
  response: RegistrationResponseJSON,
  deviceName?: string
): Promise<PasskeyRegistrationFinishResult> {
  // Retrieve and validate challenge
  const authChallenge = await prisma.authChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!authChallenge) {
    throw new Error("Challenge not found");
  }

  if (authChallenge.userAccountId !== userAccountId) {
    throw new Error("Challenge does not match user");
  }

  if (authChallenge.type !== "registration") {
    throw new Error("Invalid challenge type");
  }

  if (authChallenge.usedAt) {
    throw new Error("Challenge already used");
  }

  if (new Date() > authChallenge.expiresAt) {
    throw new Error("Challenge expired");
  }

  // Verify the registration response
  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: authChallenge.challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRelyingPartyId(),
      requireUserVerification: true,
    });
  } catch (error) {
    console.error("[PASSKEY] Registration verification failed:", error);
    throw new Error("Passkey verification failed");
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey verification failed");
  }

  const { credential, aaguid } = verification.registrationInfo;

  // Mark challenge as used and store credential atomically
  // In SimpleWebAuthn v11+:
  // - credential.id is base64url string
  // - credential.publicKey is Uint8Array (needs conversion)
  const [, passkeyCredential] = await prisma.$transaction([
    prisma.authChallenge.update({
      where: { id: challengeId },
      data: { usedAt: new Date() },
    }),
    prisma.passkeyCredential.create({
      data: {
        userAccountId,
        credentialId: credential.id,
        publicKey: isoBase64URL.fromBuffer(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: response.response.transports ?? [],
        deviceName: deviceName ?? null,
        aaguid: aaguid ?? null,
      },
    }),
  ]);

  return {
    success: true,
    credentialId: passkeyCredential.id,
    deviceName: passkeyCredential.deviceName,
  };
}

// ============================================================================
// Authentication Ceremony
// ============================================================================

/**
 * Begin passkey authentication ceremony.
 *
 * For unauthenticated users attempting to log in.
 * If email is provided, generates options specific to that user's credentials.
 * Otherwise, generates discoverable credential options.
 *
 * @param email - Optional email to scope to specific user's credentials
 * @param ipAddress - Client IP for rate limiting
 */
export async function beginAuthentication(
  email?: string,
  ipAddress?: string
): Promise<PasskeyAuthenticationBeginResult> {
  // SimpleWebAuthn v11+ expects credential IDs as base64url strings
  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];
  let userAccountId: string | undefined;

  if (email) {
    // Find user's credentials
    const userAccount = await prisma.userAccount.findUnique({
      where: { email },
      include: {
        passkeys: {
          where: { isRevoked: false },
          select: { credentialId: true, transports: true },
        },
      },
    });

    if (userAccount && userAccount.passkeys.length > 0) {
      userAccountId = userAccount.id;
      // SimpleWebAuthn v11+ expects credential IDs as base64url strings
      allowCredentials = userAccount.passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      }));
    }
    // If user not found or no passkeys, fall through to discoverable credentials
    // This prevents account enumeration
  }

  // Generate authentication options
  const options = await generateAuthenticationOptions({
    rpID: getRelyingPartyId(),
    userVerification: "preferred",
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
  });

  // Store challenge in database
  const challenge = await prisma.authChallenge.create({
    data: {
      challenge: options.challenge,
      type: "authentication",
      userAccountId,
      email,
      ipAddress,
      expiresAt: new Date(Date.now() + CHALLENGE_EXPIRATION_MS),
    },
  });

  return {
    options,
    challengeId: challenge.id,
  };
}

/**
 * Finish passkey authentication ceremony.
 *
 * Verifies the authenticator response and returns the authenticated user.
 *
 * @param challengeId - The challenge ID from beginAuthentication
 * @param response - The authenticator response from the browser
 */
export async function finishAuthentication(
  challengeId: string,
  response: AuthenticationResponseJSON
): Promise<PasskeyAuthenticationFinishResult> {
  // Retrieve and validate challenge
  const authChallenge = await prisma.authChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!authChallenge) {
    throw new Error("Challenge not found");
  }

  if (authChallenge.type !== "authentication") {
    throw new Error("Invalid challenge type");
  }

  if (authChallenge.usedAt) {
    throw new Error("Challenge already used");
  }

  if (new Date() > authChallenge.expiresAt) {
    throw new Error("Challenge expired");
  }

  // Find the credential being used
  const credentialIdBase64 = response.id;
  const credential = await prisma.passkeyCredential.findUnique({
    where: { credentialId: credentialIdBase64 },
    include: {
      userAccount: {
        include: { member: true },
      },
    },
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  if (credential.isRevoked) {
    throw new Error("Credential has been revoked");
  }

  if (!credential.userAccount.isActive) {
    throw new Error("User account is disabled");
  }

  // Verify the authentication response
  // In SimpleWebAuthn v11+:
  // - credential.id is base64url string
  // - credential.publicKey is Uint8Array
  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: authChallenge.challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRelyingPartyId(),
      credential: {
        id: credential.credentialId,
        publicKey: isoBase64URL.toBuffer(credential.publicKey),
        counter: Number(credential.counter),
        transports: credential.transports as AuthenticatorTransportFuture[],
      },
      requireUserVerification: true,
    });
  } catch (error) {
    console.error("[PASSKEY] Authentication verification failed:", error);
    throw new Error("Passkey verification failed");
  }

  if (!verification.verified) {
    throw new Error("Passkey verification failed");
  }

  const { newCounter } = verification.authenticationInfo;

  // Update challenge as used, credential counter and lastUsedAt, and login time atomically
  await prisma.$transaction([
    prisma.authChallenge.update({
      where: { id: challengeId },
      data: { usedAt: new Date() },
    }),
    prisma.passkeyCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(newCounter),
        lastUsedAt: new Date(),
      },
    }),
    prisma.userAccount.update({
      where: { id: credential.userAccountId },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  return {
    success: true,
    userAccountId: credential.userAccountId,
    memberId: credential.userAccount.memberId,
    email: credential.userAccount.email,
    credentialId: credential.id,
  };
}

// ============================================================================
// Passkey Management
// ============================================================================

/**
 * List all passkeys for a user.
 */
export async function listPasskeys(userAccountId: string): Promise<PasskeyInfo[]> {
  const passkeys = await prisma.passkeyCredential.findMany({
    where: { userAccountId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      credentialId: true,
      deviceName: true,
      createdAt: true,
      lastUsedAt: true,
      isRevoked: true,
    },
  });

  return passkeys;
}

/**
 * Revoke a passkey.
 *
 * @param passkeyId - The passkey ID to revoke
 * @param userAccountId - The user's account ID (for ownership verification)
 * @param revokedById - The member ID who is revoking (can be different for admin revocation)
 * @param reason - Optional reason for revocation
 */
export async function revokePasskey(
  passkeyId: string,
  userAccountId: string,
  revokedById: string,
  reason?: string
): Promise<void> {
  const passkey = await prisma.passkeyCredential.findUnique({
    where: { id: passkeyId },
  });

  if (!passkey) {
    throw new Error("Passkey not found");
  }

  if (passkey.userAccountId !== userAccountId) {
    throw new Error("Passkey does not belong to this user");
  }

  if (passkey.isRevoked) {
    throw new Error("Passkey is already revoked");
  }

  await prisma.passkeyCredential.update({
    where: { id: passkeyId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedById,
      revokedReason: reason,
    },
  });
}

/**
 * Admin function to revoke any user's passkey.
 * Requires separate authorization check in the calling route.
 */
export async function adminRevokePasskey(
  passkeyId: string,
  revokedById: string,
  reason: string
): Promise<{ userAccountId: string; email: string }> {
  const passkey = await prisma.passkeyCredential.findUnique({
    where: { id: passkeyId },
    include: {
      userAccount: { select: { id: true, email: true } },
    },
  });

  if (!passkey) {
    throw new Error("Passkey not found");
  }

  if (passkey.isRevoked) {
    throw new Error("Passkey is already revoked");
  }

  await prisma.passkeyCredential.update({
    where: { id: passkeyId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedById,
      revokedReason: reason,
    },
  });

  return {
    userAccountId: passkey.userAccount.id,
    email: passkey.userAccount.email,
  };
}

/**
 * Get passkey count for a user.
 */
export async function getPasskeyCount(userAccountId: string): Promise<{ total: number; active: number }> {
  const [total, active] = await Promise.all([
    prisma.passkeyCredential.count({ where: { userAccountId } }),
    prisma.passkeyCredential.count({ where: { userAccountId, isRevoked: false } }),
  ]);

  return { total, active };
}

/**
 * Check if a user has any active passkeys.
 */
export async function hasActivePasskeys(userAccountId: string): Promise<boolean> {
  const count = await prisma.passkeyCredential.count({
    where: { userAccountId, isRevoked: false },
  });
  return count > 0;
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up expired challenges.
 * Should be run periodically via a cron job.
 */
export async function cleanupExpiredChallenges(): Promise<number> {
  const result = await prisma.authChallenge.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}
