/**
 * Admin Demo Dashboard
 *
 * A focused view for running live demos, showing:
 * - System status (database, email, environment)
 * - Work queue (upcoming events, recent registrations, pending governance)
 *
 * Charter: P1 (identity provable), P2 (default deny)
 */

import { getBaseUrl } from "@/lib/getBaseUrl";
import { formatClubDateTime } from "@/lib/timezone";
import Link from "next/link";
import DemoScenarioCards from "./DemoScenarioCards";
import ViewAsMemberSection from "./ViewAsMemberSection";
import EventDerivedPreviewDemo from "./EventDerivedPreviewDemo";
import EntitlementsSection from "./EntitlementsSection";

// Use default dev token if ADMIN_E2E_TOKEN not set (matches auth.ts logic)
const adminHeaders =
  process.env.NODE_ENV !== "production"
    ? { "x-admin-test-token": process.env.ADMIN_E2E_TOKEN ?? "dev-admin-token" }
    : undefined;

type SystemStatus = {
  timestamp: string;
  database: {
    status: "connected" | "error";
    latencyMs: number | null;
    memberCount: number | null;
    eventCount: number | null;
  };
  email: {
    enabled: boolean;
    provider: string;
  };
  environment: {
    nodeEnv: string;
    isProduction: boolean;
    passkeyConfigured: boolean;
  };
};

type WorkQueueEvent = {
  id: string;
  title: string;
  category: string;
  startTime: string;
  isPublished: boolean;
  capacity: number | null;
  registrationCount: number;
};

type WorkQueueRegistration = {
  id: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

type GovernanceFlag = {
  id: string;
  title: string;
  flagType: string;
  targetType: string;
  createdAt: string;
  dueDate: string | null;
};

type GovernanceMinutes = {
  id: string;
  status: string;
  meetingDate: string;
  meetingType: string;
};

type GovernanceMotion = {
  id: string;
  motionNumber: string | null;
  motionText: string;
  result: string | null;
  meetingDate: string;
};

type LifecycleDemoMember = {
  id: string;
  name: string;
  email: string;
  status: string;
  statusLabel: string;
  tier: string | null;
  tierName: string | null;
  joinedAt: string;
  daysSinceJoin: number;
  expectedLifecycleState: string;
  stateLabel: string;
  description: string;
};

type WorkQueue = {
  timestamp: string;
  upcomingEvents: WorkQueueEvent[];
  recentRegistrations: WorkQueueRegistration[];
  pendingGovernance: {
    openFlags: GovernanceFlag[];
    draftMinutes: GovernanceMinutes[];
    recentMotions: GovernanceMotion[];
  };
};

async function getSystemStatus(): Promise<SystemStatus | null> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/admin/demo/status`, {
      headers: adminHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getWorkQueue(): Promise<WorkQueue | null> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/admin/demo/work-queue`, {
      headers: adminHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getLifecycleDemoMembers(): Promise<LifecycleDemoMember[] | null> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/admin/demo/lifecycle-members`, {
      headers: adminHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.members;
  } catch {
    return null;
  }
}

function formatDate(isoString: string): string {
  return formatClubDateTime(new Date(isoString));
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: 500,
        backgroundColor: ok ? "#d4edda" : "#f8d7da",
        color: ok ? "#155724" : "#721c24",
      }}
    >
      {label}
    </span>
  );
}

export default async function DemoPage() {
  const [status, workQueue, lifecycleMembers] = await Promise.all([
    getSystemStatus(),
    getWorkQueue(),
    getLifecycleDemoMembers(),
  ]);

  return (
    <div data-test-id="demo-root" style={{ padding: "20px", maxWidth: "1200px" }}>
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ fontSize: "24px", margin: 0 }}>Demo Dashboard</h1>
          <Link
            href="/admin"
            style={{ fontSize: "14px", color: "#0066cc" }}
          >
            Back to Admin
          </Link>
        </div>
        <p style={{ color: "#666", marginTop: "8px" }}>
          Live demo guidance - shows what to demonstrate and system health
        </p>
      </header>

      {/* Quick Links */}
      <section
        data-test-id="demo-quick-links"
        style={{
          marginBottom: "24px",
          padding: "12px 16px",
          backgroundColor: "#e7f3ff",
          borderRadius: "8px",
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 500, color: "#0066cc" }}>Quick Links:</span>
        <Link href="/admin/demo/members" style={{ color: "#0066cc" }}>
          Member List with Lifecycle Hints
        </Link>
        <Link href="#lifecycle-demo" style={{ color: "#0066cc" }}>
          Lifecycle State Demo
        </Link>
        <Link href="/admin/members" style={{ color: "#0066cc" }}>
          Full Member Admin
        </Link>
        <Link href="/admin/events" style={{ color: "#0066cc" }}>
          Events Admin
        </Link>
      </section>

      {/* View as Member - Impersonation Tool */}
      <ViewAsMemberSection />

      {/* Event Field Intelligence Demo */}
      <EventDerivedPreviewDemo />

      {/* System Status Section */}
      <section
        data-test-id="demo-status-section"
        style={{
          marginBottom: "32px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>System Status</h2>
        {status ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Database
              </div>
              <StatusBadge
                ok={status.database.status === "connected"}
                label={status.database.status === "connected" ? "Connected" : "Error"}
              />
              {status.database.latencyMs !== null && (
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                  {status.database.latencyMs}ms latency
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Email
              </div>
              <StatusBadge
                ok={status.email.enabled}
                label={status.email.enabled ? `${status.email.provider}` : "Disabled"}
              />
            </div>

            <div>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Environment
              </div>
              <StatusBadge
                ok={true}
                label={status.environment.nodeEnv}
              />
            </div>

            <div>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Passkey Auth
              </div>
              <StatusBadge
                ok={status.environment.passkeyConfigured}
                label={status.environment.passkeyConfigured ? "Configured" : "Dev Mode"}
              />
            </div>

            <div>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Data Summary
              </div>
              <div style={{ fontSize: "14px" }}>
                {status.database.memberCount ?? 0} members, {status.database.eventCount ?? 0} events
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            Unable to fetch system status
          </p>
        )}
      </section>

      {/* Entitlements Status */}
      <EntitlementsSection />

      {/* Demo Scenario Cards - Officers, Lifecycle, Events */}
      <DemoScenarioCards />

      {/* Lifecycle State Demo Section */}
      <section
        id="lifecycle-demo"
        data-test-id="demo-lifecycle-section"
        style={{
          marginBottom: "32px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#fff8e6",
        }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Lifecycle State Demo (Table View)</h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
          Alternative table view showing demo members by lifecycle state.
        </p>

        {lifecycleMembers && lifecycleMembers.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                  Member
                </th>
                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                  Status / Tier
                </th>
                <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #ddd" }}>
                  Days
                </th>
                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                  Lifecycle State
                </th>
                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {lifecycleMembers.map((member) => (
                <tr key={member.id}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                    <Link
                      href={`/admin/members/${member.id}#lifecycle`}
                      style={{ color: "#0066cc", fontWeight: 500 }}
                    >
                      {member.name}
                    </Link>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {member.email}
                    </div>
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                    <StatusBadge
                      ok={member.status === "active"}
                      label={member.statusLabel}
                    />
                    {member.tierName && (
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        {member.tierName}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                    {member.daysSinceJoin}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                    <code style={{
                      backgroundColor: "#f0f0f0",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}>
                      {member.expectedLifecycleState}
                    </code>
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px", color: "#555" }}>
                    {member.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : lifecycleMembers === null ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            Unable to fetch lifecycle demo members
          </p>
        ) : (
          <div>
            <p style={{ color: "#666", fontStyle: "italic", marginBottom: "12px" }}>
              No demo members found. Run the seed script to create them:
            </p>
            <code style={{
              display: "block",
              backgroundColor: "#f0f0f0",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "13px",
            }}>
              npx tsx scripts/demo/seed_demo_scenarios.ts
            </code>
          </div>
        )}
      </section>

      {/* Work Queue Section */}
      <section data-test-id="demo-work-queue-section">
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Demo Work Queue</h2>

        {workQueue ? (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Upcoming Events */}
            <div
              data-test-id="demo-upcoming-events"
              style={{
                padding: "16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
                Upcoming Events (Next 30 Days)
              </h3>
              {workQueue.upcomingEvents.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Event
                      </th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Category
                      </th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        When
                      </th>
                      <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Registered
                      </th>
                      <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workQueue.upcomingEvents.map((event) => (
                      <tr key={event.id}>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                          <Link
                            href={`/admin/events/${event.id}`}
                            style={{ color: "#0066cc" }}
                          >
                            {event.title}
                          </Link>
                        </td>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                          {event.category}
                        </td>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                          {formatDate(event.startTime)}
                        </td>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                          {event.registrationCount}
                          {event.capacity && ` / ${event.capacity}`}
                        </td>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                          <StatusBadge
                            ok={event.isPublished}
                            label={event.isPublished ? "Published" : "Draft"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No upcoming events in the next 30 days
                </p>
              )}
            </div>

            {/* Recent Registrations */}
            <div
              data-test-id="demo-recent-registrations"
              style={{
                padding: "16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
                Recent Registrations (Last 7 Days)
              </h3>
              {workQueue.recentRegistrations.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Member
                      </th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Event
                      </th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Status
                      </th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                        Registered
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workQueue.recentRegistrations.map((reg) => (
                      <tr key={reg.id}>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                          {reg.memberName}
                        </td>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                          <Link
                            href={`/admin/events/${reg.eventId}`}
                            style={{ color: "#0066cc" }}
                          >
                            {reg.eventTitle}
                          </Link>
                        </td>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                          {reg.status}
                        </td>
                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                          {formatDate(reg.registeredAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No registrations in the last 7 days
                </p>
              )}
            </div>

            {/* Pending Governance */}
            <div
              data-test-id="demo-pending-governance"
              style={{
                padding: "16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
                Pending Governance Items
              </h3>

              {/* Open Flags */}
              {workQueue.pendingGovernance.openFlags.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                    Open Review Flags
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {workQueue.pendingGovernance.openFlags.map((flag) => (
                      <li key={flag.id} style={{ marginBottom: "4px" }}>
                        <strong>{flag.title}</strong> ({flag.flagType})
                        {flag.dueDate && (
                          <span style={{ color: "#666" }}>
                            {" "}
                            - Due: {formatDate(flag.dueDate)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Draft Minutes */}
              {workQueue.pendingGovernance.draftMinutes.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                    Draft Minutes Awaiting Action
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {workQueue.pendingGovernance.draftMinutes.map((minutes) => (
                      <li key={minutes.id} style={{ marginBottom: "4px" }}>
                        {minutes.meetingType} Meeting ({formatDate(minutes.meetingDate)}) -{" "}
                        <StatusBadge
                          ok={minutes.status === "SUBMITTED"}
                          label={minutes.status}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Motions */}
              {workQueue.pendingGovernance.recentMotions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                    Recent Motions
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {workQueue.pendingGovernance.recentMotions.map((motion) => (
                      <li key={motion.id} style={{ marginBottom: "4px" }}>
                        {motion.motionNumber && <strong>#{motion.motionNumber}: </strong>}
                        {motion.motionText}
                        {motion.result && (
                          <span style={{ marginLeft: "8px" }}>
                            <StatusBadge
                              ok={motion.result === "PASSED"}
                              label={motion.result}
                            />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {workQueue.pendingGovernance.openFlags.length === 0 &&
                workQueue.pendingGovernance.draftMinutes.length === 0 &&
                workQueue.pendingGovernance.recentMotions.length === 0 && (
                  <p style={{ color: "#666", fontStyle: "italic" }}>
                    No pending governance items
                  </p>
                )}
            </div>
          </div>
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            Unable to fetch work queue
          </p>
        )}
      </section>
    </div>
  );
}
