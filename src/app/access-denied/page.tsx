/**
 * Access Denied Page
 *
 * Friendly "You don't have access" page for 403 scenarios.
 * Users are redirected here when they lack required permissions.
 *
 * Charter Compliance:
 * - P2: Shows access is denied without leaking sensitive info
 * - P7: Provides actionable guidance
 */

import AccessDenied from "@/components/auth/AccessDenied";

export const metadata = {
  title: "Access Denied - ClubOS",
  description: "You don't have permission to access this page",
};

interface AccessDeniedPageProps {
  searchParams: Promise<{
    reason?: string;
    required?: string;
  }>;
}

export default async function AccessDeniedPage({ searchParams }: AccessDeniedPageProps) {
  const params = await searchParams;

  // Decode reason if provided
  const reason = params.reason ? decodeURIComponent(params.reason) : undefined;
  const required = params.required ? decodeURIComponent(params.required) : undefined;

  return (
    <AccessDenied
      fullPage
      message={reason}
      requiredAccess={required}
    />
  );
}
