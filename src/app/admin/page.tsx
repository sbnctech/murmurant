import Link from "next/link";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { listMockEmails, MockEmailEntry } from "@/lib/email";
import SystemCommsPanel from "./SystemCommsPanel";
import AdminSectionNav from "./AdminSectionNav";
import AdminSearchPanel from "./AdminSearchPanel";
import TransitionWidget from "./TransitionWidget";
import AchMetricsWidget from "./AchMetricsWidget";

// Use default dev token if ADMIN_E2E_TOKEN not set (matches auth.ts logic)
const adminHeaders =
  process.env.NODE_ENV !== "production"
    ? { "x-admin-test-token": process.env.ADMIN_E2E_TOKEN ?? "dev-admin-token" }
    : undefined;

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type EventItem = {
  id: string;
  title: string;
  category: string;
  startTime: string;
};

type Registration = {
  id: string;
  memberId: string;
  eventId: string;
  status: string;
};

type JoinedRegistration = {
  id: string;
  memberName: string;
  eventTitle: string;
  status: string;
};

type AdminSummary = {
  totalActiveMembers: number;
  totalEvents: number;
  totalRegistrations: number;
  totalWaitlistedRegistrations: number;
};

type ActivityItem = {
  id: string;
  type: string;
  memberName: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

async function getMembers(): Promise<Member[]> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/members`, { cache: "no-store" });

  if (!res.ok) {
    console.error("Failed to fetch members:", res.status, res.statusText);
    return [];
  }

  const data = await res.json();
  return data.members ?? [];
}

async function getEvents(): Promise<EventItem[]> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/events`, { cache: "no-store" });

  if (!res.ok) {
    console.error("Failed to fetch events:", res.status, res.statusText);
    return [];
  }

  const data = await res.json();
  return data.events ?? [];
}

async function getRegistrations(): Promise<Registration[]> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/registrations`, { cache: "no-store" });

  if (!res.ok) {
    console.error("Failed to fetch registrations:", res.status, res.statusText);
    return [];
  }

  const data = await res.json();
  return data.registrations ?? [];
}

async function getAdminSummary(): Promise<AdminSummary | null> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/admin/summary`, { headers: adminHeaders, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.summary ?? null;
  } catch {
    return null;
  }
}

async function getActivity(): Promise<ActivityItem[]> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/admin/activity`, { headers: adminHeaders, cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.activity ?? [];
  } catch {
    return [];
  }
}

function formatActivityTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function joinRegistrations(
  registrations: Registration[],
  members: Member[],
  events: EventItem[]
): JoinedRegistration[] {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const eventById = new Map(events.map((e) => [e.id, e]));

  return registrations.map((r) => {
    const member = memberById.get(r.memberId);
    const event = eventById.get(r.eventId);

    const memberName = member
      ? `${member.firstName} ${member.lastName}`
      : r.memberId;

    const eventTitle = event ? event.title : r.eventId;

    return {
      id: r.id,
      memberName,
      eventTitle,
      status: r.status,
    };
  });
}

export default async function AdminPage() {
  const [members, events, registrations, emails, summary, activity] = await Promise.all([
    getMembers(),
    getEvents(),
    getRegistrations(),
    listMockEmails(20),
    getAdminSummary(),
    getActivity(),
  ]);

  const joinedRegistrations = joinRegistrations(registrations, members, events);
  const recentActivity = activity.slice(0, 10);

  // Mock pending tasks data
  const pendingTasks = {
    eventsToApprove: 3,
    applicationsToReview: 5,
    refundRequests: 2,
    expiringMemberships: 8,
  };

  return (
    <div data-test-id="admin-root" style={{ padding: "20px" }}>
      {/* Enhanced Welcome Header */}
      <header
        data-test-id="admin-header"
        style={{
          backgroundColor: "#1e40af",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          color: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
              Welcome back, Admin
            </h1>
            <p style={{ fontSize: "14px", opacity: 0.9, marginTop: "4px" }}>
              Club management dashboard
            </p>
          </div>
          <div
            data-test-id="system-health-indicator"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "8px 16px",
              borderRadius: "20px",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
              }}
            />
            <span style={{ fontSize: "14px" }}>System Healthy</span>
          </div>
        </div>
      </header>

      {/* Quick Action Buttons */}
      <section
        data-test-id="quick-actions-section"
        style={{ marginBottom: "24px" }}
      >
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/admin/events/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            + New Event
          </Link>
          <Link
            href="/admin/members/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#16a34a",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            + Add Member
          </Link>
          <Link
            href="/admin/comms/bulk-email"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#7c3aed",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            Send Email
          </Link>
          <Link
            href="/admin/members/import"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#0891b2",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            Import Members
          </Link>
        </div>
      </section>

      {/* Pending Tasks Alert */}
      {(pendingTasks.eventsToApprove > 0 ||
        pendingTasks.applicationsToReview > 0 ||
        pendingTasks.refundRequests > 0) && (
        <section
          data-test-id="pending-tasks-section"
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#92400e", margin: "0 0 12px 0" }}>
            Pending Tasks
          </h3>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {pendingTasks.eventsToApprove > 0 && (
              <Link
                href="/admin/events?filter=pending"
                style={{ color: "#92400e", textDecoration: "none", fontSize: "14px" }}
              >
                <strong>{pendingTasks.eventsToApprove}</strong> events to approve
              </Link>
            )}
            {pendingTasks.applicationsToReview > 0 && (
              <Link
                href="/admin/applications"
                style={{ color: "#92400e", textDecoration: "none", fontSize: "14px" }}
              >
                <strong>{pendingTasks.applicationsToReview}</strong> applications to review
              </Link>
            )}
            {pendingTasks.refundRequests > 0 && (
              <Link
                href="/admin/refunds"
                style={{ color: "#92400e", textDecoration: "none", fontSize: "14px" }}
              >
                <strong>{pendingTasks.refundRequests}</strong> refund requests
              </Link>
            )}
            {pendingTasks.expiringMemberships > 0 && (
              <Link
                href="/admin/members?filter=expiring"
                style={{ color: "#92400e", textDecoration: "none", fontSize: "14px" }}
              >
                <strong>{pendingTasks.expiringMemberships}</strong> expiring memberships
              </Link>
            )}
          </div>
        </section>
      )}

      <AdminSectionNav />

      {/* Transition Widget - visible only to President and Past President */}
      {/* Auth is handled via HttpOnly session cookies, not props (Charter P1, P7) */}
      <TransitionWidget />

      <section
        id="admin-search-section"
        data-test-id="admin-search-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Search</h2>
        <AdminSearchPanel />
      </section>

      <section
        id="admin-summary-section"
        data-test-id="admin-summary-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
          Dashboard summary
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ minWidth: "180px" }}>
            <div style={{ fontSize: "14px", color: "#888" }}>Active members</div>
            <div
              data-test-id="admin-summary-members"
              style={{ fontSize: "20px", fontWeight: 600 }}
            >
              {summary ? summary.totalActiveMembers : "-"}
            </div>
          </div>

          <div style={{ minWidth: "180px" }}>
            <div style={{ fontSize: "14px", color: "#888" }}>Events</div>
            <div
              data-test-id="admin-summary-events"
              style={{ fontSize: "20px", fontWeight: 600 }}
            >
              {summary ? summary.totalEvents : "-"}
            </div>
          </div>

          <div style={{ minWidth: "180px" }}>
            <div style={{ fontSize: "14px", color: "#888" }}>Registrations</div>
            <div
              data-test-id="admin-summary-registrations"
              style={{ fontSize: "20px", fontWeight: 600 }}
            >
              {summary ? summary.totalRegistrations : "-"}
            </div>
          </div>

          <div style={{ minWidth: "180px" }}>
            <div style={{ fontSize: "14px", color: "#888" }}>Waitlisted</div>
            <div
              data-test-id="admin-summary-waitlisted"
              style={{ fontSize: "20px", fontWeight: 600 }}
            >
              {summary ? summary.totalWaitlistedRegistrations : "-"}
            </div>
          </div>
        </div>
      </section>

      {/* ACH Metrics Widget - shows fee savings when ACH is enabled */}
      <AchMetricsWidget />

      <section
        id="admin-members-section"
        data-test-id="admin-members-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          Members overview
        </h2>
        <p style={{ marginBottom: "12px" }}>
          This table is backed by the /api/members endpoint. Data is currently
          mocked and will later be replaced with database-backed queries.
        </p>
        <table
          data-test-id="admin-members-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            maxWidth: "800px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Name
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} data-test-id="admin-members-row">
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {member.firstName} {member.lastName}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {member.email}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr data-test-id="admin-members-empty-state">
                <td
                  colSpan={2}
                  style={{
                    padding: "8px",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section
        id="admin-events-section"
        data-test-id="admin-events-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          Events overview
        </h2>
        <p style={{ marginBottom: "12px" }}>
          This table is backed by the /api/events endpoint. Data is currently
          mocked and will later be replaced with database-backed queries.
        </p>
        <table
          data-test-id="admin-events-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            maxWidth: "800px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Title
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Category
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Start time
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} data-test-id="admin-events-row">
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {event.title}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {event.category}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {event.startTime}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr data-test-id="admin-events-empty-state">
                <td
                  colSpan={3}
                  style={{
                    padding: "8px",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section
        id="admin-registrations-section"
        data-test-id="admin-registrations-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          Registrations overview
        </h2>
        <p style={{ marginBottom: "12px" }}>
          This table joins /api/registrations with members and events to show
          who is registered for what.
        </p>
        <table
          data-test-id="admin-registrations-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            maxWidth: "800px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Member
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Event
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {joinedRegistrations.map((r) => (
              <tr
                key={r.id}
                data-test-id="admin-registrations-row"
              >
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {r.memberName}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {r.eventTitle}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {r.status}
                </td>
              </tr>
            ))}
            {joinedRegistrations.length === 0 && (
              <tr data-test-id="admin-registrations-empty-state">
                <td
                  colSpan={3}
                  style={{
                    padding: "8px",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  No registrations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section
        id="admin-emails-section"
        data-test-id="admin-emails-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Email activity</h2>
        <p style={{ marginBottom: "12px" }}>
          This panel reads from the mock email log. In development, calls to
          /api/email/test append entries here instead of sending real email.
        </p>
        <table
          data-test-id="admin-email-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            maxWidth: "800px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                To
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Subject
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Sent at
              </th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email: MockEmailEntry) => (
              <tr
                key={email.id}
                data-test-id="admin-email-row"
              >
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {email.to}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {email.subject}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                    fontSize: "12px",
                    color: "#555",
                  }}
                >
                  {email.createdAt}
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr data-test-id="admin-email-empty-state">
                <td
                  colSpan={3}
                  style={{
                    padding: "8px",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  No emails logged yet. Hit /api/email/test to generate a mock
                  entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section
        id="admin-system-comms-section"
        data-test-id="admin-system-comms-section"
        style={{ marginBottom: "32px", marginTop: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          System communications
        </h2>
        <p style={{ marginBottom: "12px" }}>
          Check system health and test email/SMS delivery.
        </p>
        <SystemCommsPanel />
      </section>

      <section
        id="admin-activity-section"
        data-test-id="admin-activity-section"
        style={{ marginBottom: "32px" }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          Recent activity
        </h2>
        <p style={{ marginBottom: "12px" }}>
          Latest member registrations across events.
        </p>
        <table
          data-test-id="admin-activity-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            maxWidth: "800px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Member
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Event
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                Status
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                When
              </th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((item) => (
              <tr key={item.id} data-test-id="admin-activity-row">
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {item.memberName}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {item.eventTitle}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {item.status}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                  }}
                >
                  {formatActivityTime(item.registeredAt)}
                </td>
              </tr>
            ))}
            {recentActivity.length === 0 && (
              <tr data-test-id="admin-activity-empty-state">
                <td
                  colSpan={4}
                  style={{
                    padding: "8px",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  No recent activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
