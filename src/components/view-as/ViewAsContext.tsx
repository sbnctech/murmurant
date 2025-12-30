/**
 * ViewAsContext - Client-side context for view simulation
 *
 * Provides the "Viewing as" functionality throughout the app.
 * This is UI-only - actual authorization remains server-side.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ViewMode, ViewContext } from "@/lib/view-context";
import {
  VIEW_AS_COOKIE_NAME,
  VIEW_MODE_CONFIG,
  buildViewContext,
} from "@/lib/view-context";

// ============================================================================
// Context Types
// ============================================================================

interface ViewAsContextValue {
  /** Current view context */
  viewContext: ViewContext;
  /** Change the view mode */
  setViewMode: (mode: ViewMode) => void;
  /** Whether view-as is enabled */
  isEnabled: boolean;
}

const ViewAsReactContext = createContext<ViewAsContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface ViewAsProviderProps {
  children: ReactNode;
  /** Initial view mode from server */
  initialMode?: ViewMode;
  /** Whether view-as is enabled (from server) */
  enabled?: boolean;
}

/**
 * Read view mode from cookie (client-side only).
 */
function getInitialModeFromCookie(): ViewMode {
  if (typeof document === "undefined") return "actual";

  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const cookieMode = cookies[VIEW_AS_COOKIE_NAME] as ViewMode | undefined;
  if (cookieMode && VIEW_MODE_CONFIG[cookieMode]) {
    return cookieMode;
  }
  return "actual";
}

export function ViewAsProvider({
  children,
  initialMode = "actual",
  enabled = true,
}: ViewAsProviderProps) {
  // Use lazy initializer to read from cookie on first render
  const [viewContext, setViewContext] = useState<ViewContext>(() => {
    if (!enabled) return buildViewContext(initialMode);
    const cookieMode = getInitialModeFromCookie();
    return buildViewContext(cookieMode !== "actual" ? cookieMode : initialMode);
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    // Validate mode
    if (!VIEW_MODE_CONFIG[mode]) {
      console.warn(`Invalid view mode: ${mode}`);
      return;
    }

    // Update context
    setViewContext(buildViewContext(mode));

    // Set cookie for server-side reading
    document.cookie = `${VIEW_AS_COOKIE_NAME}=${mode}; path=/; max-age=${60 * 60 * 24}`; // 24 hours

    // Reload to apply changes (server components need fresh render)
    window.location.reload();
  }, []);

  return (
    <ViewAsReactContext.Provider
      value={{
        viewContext,
        setViewMode,
        isEnabled: enabled,
      }}
    >
      {children}
    </ViewAsReactContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useViewAs(): ViewAsContextValue {
  const context = useContext(ViewAsReactContext);
  if (!context) {
    // Return a default context if not wrapped in provider
    return {
      viewContext: buildViewContext("actual"),
      setViewMode: () => {},
      isEnabled: false,
    };
  }
  return context;
}

export default ViewAsProvider;
