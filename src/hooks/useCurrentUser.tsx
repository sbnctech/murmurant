/**
 * useCurrentUser Hook
 *
 * Client-side hook for accessing the authenticated user's information.
 * Provides loading state, error handling, and capability checks.
 *
 * Charter Compliance:
 * - P1: Identity from server-validated session
 * - P2: Capabilities exposed for client-side UI gating (server enforces)
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { GlobalRole, Capability } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

export interface CurrentUser {
  id: string;
  email: string;
  memberId: string;
  firstName: string;
  lastName: string;
  globalRole: GlobalRole;
  capabilities: Capability[];
  sessionCreatedAt: string;
  sessionExpiresAt: string;
}

export interface UseCurrentUserResult {
  /** The authenticated user, or null if not authenticated */
  user: CurrentUser | null;
  /** True while fetching user data */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** True if user is authenticated */
  isAuthenticated: boolean;
  /** Check if user has a specific capability */
  hasCapability: (capability: Capability) => boolean;
  /** Check if user has any of the specified capabilities */
  hasAnyCapability: (capabilities: Capability[]) => boolean;
  /** Check if user has all of the specified capabilities */
  hasAllCapabilities: (capabilities: Capability[]) => boolean;
  /** Get display name (first + last) */
  displayName: string | null;
  /** Refetch user data */
  refetch: () => Promise<void>;
  /** Clear user data (for logout) */
  clear: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        // Not authenticated - this is a valid state, not an error
        setUser(null);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to fetch user");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load user";
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const clear = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  // Memoized capability checks
  const hasCapability = useCallback(
    (capability: Capability): boolean => {
      if (!user) return false;
      // admin:full implies all capabilities
      if (user.capabilities.includes("admin:full" as Capability)) return true;
      return user.capabilities.includes(capability);
    },
    [user]
  );

  const hasAnyCapability = useCallback(
    (capabilities: Capability[]): boolean => {
      return capabilities.some((cap) => hasCapability(cap));
    },
    [hasCapability]
  );

  const hasAllCapabilities = useCallback(
    (capabilities: Capability[]): boolean => {
      return capabilities.every((cap) => hasCapability(cap));
    },
    [hasCapability]
  );

  const displayName = useMemo(() => {
    if (!user) return null;
    return `${user.firstName} ${user.lastName}`.trim();
  }, [user]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    hasCapability,
    hasAnyCapability,
    hasAllCapabilities,
    displayName,
    refetch: fetchUser,
    clear,
  };
}

// ============================================================================
// Context Provider (optional - for avoiding prop drilling)
// ============================================================================

import { createContext, useContext, type ReactNode } from "react";

const CurrentUserContext = createContext<UseCurrentUserResult | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser();

  return (
    <CurrentUserContext.Provider value={currentUser}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUserContext(): UseCurrentUserResult {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error(
      "useCurrentUserContext must be used within a CurrentUserProvider"
    );
  }
  return context;
}

// ============================================================================
// Role Display Helpers
// ============================================================================

const ROLE_DISPLAY_NAMES: Record<GlobalRole, string> = {
  admin: "Administrator",
  president: "President",
  "past-president": "Past President",
  "vp-activities": "VP Activities",
  "event-chair": "Event Chair",
  webmaster: "Webmaster",
  secretary: "Secretary",
  parliamentarian: "Parliamentarian",
  member: "Member",
};

export function getRoleDisplayName(role: GlobalRole): string {
  return ROLE_DISPLAY_NAMES[role] ?? role;
}

export default useCurrentUser;
