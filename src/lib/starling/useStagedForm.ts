// Copyright (c) Murmurant, Inc.
// Hook for consuming Starling-staged form data

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { StagingPayload } from "./types";

interface StagedFormResult<T> {
  /** Whether staging data is being loaded */
  isLoading: boolean;

  /** Staged form data (if any) */
  stagedData: Partial<T> | null;

  /** Which fields were staged by Starling */
  stagedFields: string[];

  /** Staging ID for audit trail */
  stagingId: string | null;

  /** Whether passkey is required to submit */
  requiresPasskey: boolean;

  /** Clear the staging (remove from URL) */
  clearStaging: () => void;

  /** Mark field as user-modified (removes Starling indicator) */
  markFieldModified: (fieldName: string) => void;

  /** Check if a field was staged */
  isFieldStaged: (fieldName: string) => boolean;
}

/**
 * Consume Starling-staged form data
 *
 * @example
 * ```tsx
 * function EventRegistrationForm({ event }) {
 *   const { stagedData, stagedFields, stagingId, requiresPasskey } =
 *     useStagedForm<RegistrationForm>();
 *
 *   const form = useForm({
 *     defaultValues: {
 *       guestCount: 0,
 *       ...stagedData, // Staged values override defaults
 *     }
 *   });
 *
 *   return (
 *     <form>
 *       <input
 *         {...form.register('guestCount')}
 *         className={stagedFields.includes('guestCount') ? 'starling-staged' : ''}
 *       />
 *       <button type="submit">Register</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useStagedForm<
  T extends Record<string, unknown>,
>(): StagedFormResult<T> {
  const searchParams = useSearchParams();
  const router = useRouter();

  const stagingId = searchParams.get("staging");

  const [isLoading, setIsLoading] = useState(!!stagingId);
  const [stagedData, setStagedData] = useState<Partial<T> | null>(null);
  const [stagedFields, setStagedFields] = useState<string[]>([]);
  const [requiresPasskey, setRequiresPasskey] = useState(false);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Load staging payload
  useEffect(() => {
    if (!stagingId) {
      setIsLoading(false);
      return;
    }

    async function loadStaging() {
      try {
        const res = await fetch(`/api/starling/staging/${stagingId}`);

        if (!res.ok) {
          if (res.status === 410) {
            // Expired
            showToast(
              "This staged action has expired. Please try again.",
              "error"
            );
          } else if (res.status === 404) {
            showToast("Staged action not found.", "error");
          }
          return;
        }

        const staging: StagingPayload = await res.json();

        setStagedData(staging.formData as Partial<T>);
        setStagedFields(staging.stagedFields);
        setRequiresPasskey(staging.requiresPasskey);

        // Show toast notification
        showToast(staging.toastMessage, "info");

        // Highlight submit button
        requestAnimationFrame(() => {
          const submitBtn = document.querySelector(staging.highlightSelector);
          if (submitBtn) {
            submitBtn.classList.add("starling-highlight");

            // Remove highlight after 10 seconds or on focus
            const removeHighlight = () => {
              submitBtn.classList.remove("starling-highlight");
              submitBtn.removeEventListener("focus", removeHighlight);
            };

            submitBtn.addEventListener("focus", removeHighlight);
            setTimeout(removeHighlight, 10000);
          }
        });

        // Mark staging as consumed
        await fetch(`/api/starling/staging/${stagingId}/consume`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to load staging:", error);
        showToast("Failed to load staged form data.", "error");
      } finally {
        setIsLoading(false);
      }
    }

    loadStaging();
  }, [stagingId]);

  const clearStaging = useCallback(() => {
    // Remove staging param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("staging");
    const newPath =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");
    router.replace(newPath);

    // Clear state
    setStagedData(null);
    setStagedFields([]);
    setRequiresPasskey(false);
  }, [searchParams, router]);

  const markFieldModified = useCallback((fieldName: string) => {
    setModifiedFields((prev) => new Set(prev).add(fieldName));
  }, []);

  const isFieldStaged = useCallback(
    (fieldName: string) => {
      return stagedFields.includes(fieldName) && !modifiedFields.has(fieldName);
    },
    [stagedFields, modifiedFields]
  );

  return {
    isLoading,
    stagedData,
    stagedFields,
    stagingId,
    requiresPasskey,
    clearStaging,
    markFieldModified,
    isFieldStaged,
  };
}

/**
 * Simple toast notification (replace with your toast library)
 */
function showToast(message: string, type: "info" | "error" | "success") {
  // This is a placeholder - integrate with your actual toast system
  // For example: toast[type](message) if using react-hot-toast

  // Fallback to console for now
  const prefix =
    type === "error" ? "❌" : type === "success" ? "✅" : "🐦";
  console.log(`${prefix} Starling: ${message}`);

  // If there's a global toast function, try to use it
  if (typeof window !== "undefined" && (window as unknown as { toast?: { [key: string]: (msg: string) => void } }).toast) {
    (window as unknown as { toast: { [key: string]: (msg: string) => void } }).toast[type]?.(message);
  }
}

/**
 * CSS class names for Starling styling
 */
export const StarlingStyles = {
  /** Pulsing highlight for submit button */
  highlight: "starling-highlight",

  /** Indicator for Starling-filled fields */
  stagedField: "starling-staged",

  /** Field that user has modified after staging */
  modifiedField: "starling-modified",
} as const;
