/**
 * ViewAsWrapper - Client component wrapper for ViewAs context
 *
 * Wraps children with ViewAsProvider and displays banners:
 * - ImpersonationBanner: Shows when admin is impersonating a specific member
 * - ViewAsBanner: Shows when simulating a generic role
 *
 * This is a client component because ViewAsProvider uses React state.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { ReactNode } from "react";
import { ViewAsProvider, ViewAsBanner, ImpersonationBanner } from "@/components/view-as";

interface ViewAsWrapperProps {
  children: ReactNode;
}

export function ViewAsWrapper({ children }: ViewAsWrapperProps) {
  // Check if view-as is enabled (via env var or dev mode)
  const isEnabled =
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_DEMO_VIEW_AS === "1" ||
      process.env.NODE_ENV === "development");

  return (
    <ViewAsProvider enabled={isEnabled}>
      {/* Impersonation banner shows when admin is viewing as a specific member */}
      <ImpersonationBanner />
      {/* Role simulation banner shows when simulating a generic role */}
      <ViewAsBanner />
      {children}
    </ViewAsProvider>
  );
}
