/**
 * Officer Policies List Page
 *
 * Displays the club's policy registry with search and filtering.
 * Read-only view for all authenticated members.
 *
 * Charter Principles:
 * - N5: No hidden rules - policies are visible and documented
 * - P5: Visible state - policy status clearly shown
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { Suspense } from "react";
import PoliciesListClient from "./PoliciesListClient";

export const metadata = {
  title: "Club Policies | ClubOS",
  description: "View the Santa Barbara Newcomers Club policy registry",
};

export default function PoliciesPage() {
  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>
          Club Policies
        </h1>
        <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>
          Official policies governing club operations. Each policy is assigned
          a unique ID (POL-XXX) for reference in code and documentation.
        </p>
      </header>

      <Suspense
        fallback={
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Loading policies...
          </div>
        }
      >
        <PoliciesListClient />
      </Suspense>
    </div>
  );
}
