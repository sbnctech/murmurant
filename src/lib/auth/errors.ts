/**
 * Auth Error Messages
 *
 * User-friendly error messages for authentication failures.
 * Maps technical errors to messages suitable for display.
 *
 * Charter Compliance:
 * - P9: Fails closed - technical details not leaked to client
 * - N5: Error messages are actionable, not cryptic
 */

// ============================================================================
// Error Code Types
// ============================================================================

export type AuthErrorCode =
  // Passkey errors
  | "PASSKEY_NOT_SUPPORTED"
  | "PASSKEY_CANCELLED"
  | "PASSKEY_TIMEOUT"
  | "PASSKEY_INVALID"
  | "PASSKEY_REVOKED"
  | "PASSKEY_NOT_FOUND"
  // Challenge errors
  | "CHALLENGE_EXPIRED"
  | "CHALLENGE_USED"
  | "CHALLENGE_NOT_FOUND"
  | "CHALLENGE_INVALID"
  // Session errors
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "SESSION_INVALID"
  // Account errors
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_NOT_FOUND"
  // Magic link errors
  | "MAGIC_LINK_EXPIRED"
  | "MAGIC_LINK_USED"
  | "MAGIC_LINK_INVALID"
  | "MAGIC_LINK_SEND_FAILED"
  // Rate limiting
  | "RATE_LIMITED"
  // Network errors
  | "NETWORK_ERROR"
  // Generic
  | "UNKNOWN_ERROR";

// ============================================================================
// Error Messages
// ============================================================================

interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
}

const ERROR_MESSAGES: Record<AuthErrorCode, ErrorMessage> = {
  // Passkey errors
  PASSKEY_NOT_SUPPORTED: {
    title: "Passkeys not supported",
    message: "Your browser or device doesn't support passkeys.",
    action: "Try using a different browser or use the email sign-in option.",
  },
  PASSKEY_CANCELLED: {
    title: "Sign-in cancelled",
    message: "The passkey authentication was cancelled.",
    action: "Click 'Sign in with Passkey' to try again.",
  },
  PASSKEY_TIMEOUT: {
    title: "Request timed out",
    message: "The authentication request took too long.",
    action: "Please try signing in again.",
  },
  PASSKEY_INVALID: {
    title: "Passkey verification failed",
    message: "We couldn't verify your passkey.",
    action: "Please try again or use the email sign-in option.",
  },
  PASSKEY_REVOKED: {
    title: "Passkey disabled",
    message: "This passkey has been disabled and can no longer be used.",
    action: "Please use a different passkey or the email sign-in option.",
  },
  PASSKEY_NOT_FOUND: {
    title: "Passkey not recognized",
    message: "We don't recognize this passkey.",
    action: "Make sure you're using a passkey registered with your account.",
  },

  // Challenge errors
  CHALLENGE_EXPIRED: {
    title: "Request expired",
    message: "The sign-in request has expired.",
    action: "Please start the sign-in process again.",
  },
  CHALLENGE_USED: {
    title: "Request already used",
    message: "This sign-in request has already been used.",
    action: "Please start a new sign-in attempt.",
  },
  CHALLENGE_NOT_FOUND: {
    title: "Request not found",
    message: "We couldn't find this sign-in request.",
    action: "Please start the sign-in process again.",
  },
  CHALLENGE_INVALID: {
    title: "Invalid request",
    message: "The sign-in request is invalid.",
    action: "Please start the sign-in process again.",
  },

  // Session errors
  SESSION_EXPIRED: {
    title: "Session expired",
    message: "Your session has expired for security.",
    action: "Please sign in again to continue.",
  },
  SESSION_REVOKED: {
    title: "Session ended",
    message: "Your session was ended. This may happen if you signed in elsewhere.",
    action: "Please sign in again to continue.",
  },
  SESSION_INVALID: {
    title: "Invalid session",
    message: "Your session is no longer valid.",
    action: "Please sign in again to continue.",
  },

  // Account errors
  ACCOUNT_DISABLED: {
    title: "Account disabled",
    message: "Your account has been disabled.",
    action: "Please contact an administrator for assistance.",
  },
  ACCOUNT_NOT_FOUND: {
    title: "Account not found",
    message: "We couldn't find an account with those credentials.",
    action: "Please check your email address or contact an administrator.",
  },

  // Magic link errors
  MAGIC_LINK_EXPIRED: {
    title: "Link expired",
    message: "This sign-in link has expired.",
    action: "Please request a new sign-in link.",
  },
  MAGIC_LINK_USED: {
    title: "Link already used",
    message: "This sign-in link has already been used.",
    action: "If you need to sign in again, request a new link.",
  },
  MAGIC_LINK_INVALID: {
    title: "Invalid link",
    message: "This sign-in link is invalid.",
    action: "Please request a new sign-in link.",
  },
  MAGIC_LINK_SEND_FAILED: {
    title: "Couldn't send email",
    message: "We had trouble sending the sign-in email.",
    action: "Please check your email address and try again.",
  },

  // Rate limiting
  RATE_LIMITED: {
    title: "Too many attempts",
    message: "You've made too many sign-in attempts.",
    action: "Please wait a few minutes before trying again.",
  },

  // Network errors
  NETWORK_ERROR: {
    title: "Connection problem",
    message: "We couldn't connect to the server.",
    action: "Please check your internet connection and try again.",
  },

  // Generic
  UNKNOWN_ERROR: {
    title: "Something went wrong",
    message: "An unexpected error occurred.",
    action: "Please try again or contact support if the problem persists.",
  },
};

// ============================================================================
// Error Detection
// ============================================================================

/**
 * Parse an error message to determine the error code.
 * Maps server error messages and WebAuthn errors to user-friendly codes.
 */
export function parseAuthError(error: unknown): AuthErrorCode {
  const message = getErrorMessage(error).toLowerCase();

  // Passkey/WebAuthn errors
  if (
    message.includes("not supported") ||
    message.includes("not allowed") ||
    message.includes("notallowed")
  ) {
    return "PASSKEY_NOT_SUPPORTED";
  }
  if (
    message.includes("cancelled") ||
    message.includes("canceled") ||
    message.includes("user denied") ||
    message.includes("operation was aborted") ||
    message.includes("aborted")
  ) {
    return "PASSKEY_CANCELLED";
  }
  if (message.includes("timeout") || message.includes("timed out")) {
    return "PASSKEY_TIMEOUT";
  }
  if (message.includes("revoked") || message.includes("has been revoked")) {
    return "PASSKEY_REVOKED";
  }
  if (
    message.includes("credential not found") ||
    message.includes("passkey not found") ||
    message.includes("not recognized")
  ) {
    return "PASSKEY_NOT_FOUND";
  }
  if (
    message.includes("verification failed") ||
    message.includes("passkey verification")
  ) {
    return "PASSKEY_INVALID";
  }

  // Challenge errors
  if (
    message.includes("challenge expired") ||
    message.includes("request expired")
  ) {
    return "CHALLENGE_EXPIRED";
  }
  if (
    message.includes("challenge already used") ||
    message.includes("already used")
  ) {
    return "CHALLENGE_USED";
  }
  if (message.includes("challenge not found")) {
    return "CHALLENGE_NOT_FOUND";
  }
  if (message.includes("invalid challenge")) {
    return "CHALLENGE_INVALID";
  }

  // Session errors
  if (message.includes("session expired")) {
    return "SESSION_EXPIRED";
  }
  if (message.includes("session revoked")) {
    return "SESSION_REVOKED";
  }

  // Account errors
  if (
    message.includes("account disabled") ||
    message.includes("account is disabled")
  ) {
    return "ACCOUNT_DISABLED";
  }
  if (
    message.includes("user not found") ||
    message.includes("account not found")
  ) {
    return "ACCOUNT_NOT_FOUND";
  }

  // Magic link errors
  if (message.includes("link expired") || message.includes("token expired")) {
    return "MAGIC_LINK_EXPIRED";
  }
  if (message.includes("link used") || message.includes("token used")) {
    return "MAGIC_LINK_USED";
  }
  if (message.includes("invalid token") || message.includes("invalid link")) {
    return "MAGIC_LINK_INVALID";
  }

  // Rate limiting
  if (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("429")
  ) {
    return "RATE_LIMITED";
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection")
  ) {
    return "NETWORK_ERROR";
  }

  return "UNKNOWN_ERROR";
}

/**
 * Get error message string from unknown error.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get a user-friendly error message for an authentication error.
 */
export function getFriendlyAuthError(error: unknown): ErrorMessage {
  const code = parseAuthError(error);
  return ERROR_MESSAGES[code];
}

/**
 * Get a user-friendly error message by error code.
 */
export function getAuthErrorMessage(code: AuthErrorCode): ErrorMessage {
  return ERROR_MESSAGES[code];
}

/**
 * Format a friendly error for display.
 */
export function formatAuthError(error: unknown): string {
  const { title, message, action } = getFriendlyAuthError(error);
  return action ? `${title}: ${message} ${action}` : `${title}: ${message}`;
}

/**
 * Create an AuthError with a specific code.
 */
export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, originalMessage?: string) {
    const errorInfo = ERROR_MESSAGES[code];
    super(originalMessage || errorInfo.message);
    this.name = "AuthError";
    this.code = code;
  }

  get friendlyMessage(): ErrorMessage {
    return ERROR_MESSAGES[this.code];
  }
}
