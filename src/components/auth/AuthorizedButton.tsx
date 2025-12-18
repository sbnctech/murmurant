"use client";

/**
 * Authorization-Aware Button Component
 *
 * Renders a button that is disabled if the user lacks required capabilities.
 * Provides a tooltip explaining why the button is disabled.
 *
 * Charter Compliance:
 * - P2: UI reflects actual authorization (server still enforces)
 * - N3: No UI-only gating - server still validates on action
 * - N5: Clear feedback when actions are unavailable
 */

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Capability } from "@/lib/auth";

interface AuthorizedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  /** Required capability to enable this button */
  requiredCapability?: Capability | Capability[];
  /** Whether all capabilities are required (default: any) */
  requireAll?: boolean;
  /** Message to show when button is disabled due to authorization */
  unauthorizedMessage?: string;
  /** Force disabled state (in addition to auth check) */
  disabled?: boolean;
  /** Children */
  children: ReactNode;
}

export default function AuthorizedButton({
  requiredCapability,
  requireAll = false,
  unauthorizedMessage = "You don't have permission to perform this action",
  disabled: forceDisabled = false,
  children,
  style,
  ...buttonProps
}: AuthorizedButtonProps) {
  const { loading, hasCapability, hasAnyCapability, hasAllCapabilities, isAuthenticated } = useCurrentUser();

  // Determine if button should be disabled due to authorization
  let isAuthorized = true;
  if (requiredCapability) {
    if (Array.isArray(requiredCapability)) {
      isAuthorized = requireAll
        ? hasAllCapabilities(requiredCapability)
        : hasAnyCapability(requiredCapability);
    } else {
      isAuthorized = hasCapability(requiredCapability);
    }
  }

  const isDisabled = loading || forceDisabled || !isAuthorized;
  const showUnauthorizedState = !loading && !isAuthorized && !forceDisabled;

  return (
    <button
      {...buttonProps}
      disabled={isDisabled}
      title={showUnauthorizedState ? unauthorizedMessage : buttonProps.title}
      aria-disabled={isDisabled}
      style={{
        ...style,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: showUnauthorizedState ? 0.6 : isDisabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Hook for checking if an action is authorized.
 * Use this when you need to check authorization without rendering a button.
 */
export function useIsAuthorized(
  requiredCapability?: Capability | Capability[],
  requireAll = false
): { isAuthorized: boolean; loading: boolean } {
  const { loading, hasCapability, hasAnyCapability, hasAllCapabilities } = useCurrentUser();

  let isAuthorized = true;
  if (requiredCapability) {
    if (Array.isArray(requiredCapability)) {
      isAuthorized = requireAll
        ? hasAllCapabilities(requiredCapability)
        : hasAnyCapability(requiredCapability);
    } else {
      isAuthorized = hasCapability(requiredCapability);
    }
  }

  return { isAuthorized, loading };
}
