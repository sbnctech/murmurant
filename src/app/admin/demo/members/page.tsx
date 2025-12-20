/**
 * Admin Demo Member List Page
 *
 * Read-only view of members with status, tier, and lifecycle hints.
 * Designed for live demos to showcase membership data.
 *
 * Charter: P1 (identity provable), P2 (default deny)
 */

import DemoMembersClient from "./DemoMembersClient";

export default function DemoMemberListPage() {
  return <DemoMembersClient />;
}
