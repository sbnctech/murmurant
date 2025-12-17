import { notFound } from "next/navigation";
import MemberHistoryPanel from "./MemberHistoryPanel";

// Server-to-server auth for API calls (only in dev mode, with default fallback)
const adminHeaders =
  process.env.NODE_ENV !== "production"
    ? { "x-admin-test-token": process.env.ADMIN_E2E_TOKEN ?? "dev-admin-token" }
    : undefined;

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  status: string;
};

type Registration = {
  id: string;
  eventId: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/admin/members/${id}`, { headers: adminHeaders, cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    return (
      <div data-test-id="admin-member-error" style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Error</h1>
        <p>Failed to load member details.</p>
      </div>
    );
  }

  const data = await res.json();
  const member: Member = data.member;
  const registrations: Registration[] = data.registrations ?? [];

  return (
    <div data-test-id="admin-member-detail-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Member Detail</h1>

      <div style={{ marginBottom: "24px" }}>
        <div style={{ marginBottom: "8px" }}>
          <strong>Name:</strong>{" "}
          <span data-test-id="member-detail-name">{member.name}</span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Email:</strong>{" "}
          <span data-test-id="member-detail-email">{member.email}</span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Status:</strong>{" "}
          <span data-test-id="member-detail-status">{member.status}</span>
        </div>
      </div>

      <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
        Registered Events
      </h2>

      <table
        data-test-id="member-detail-registrations-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "600px",
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
          {registrations.map((reg) => (
            <tr key={reg.id} data-test-id="member-detail-registration-row">
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {reg.eventTitle}
              </td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                }}
              >
                {reg.status}
              </td>
            </tr>
          ))}
          {registrations.length === 0 && (
            <tr>
              <td
                colSpan={2}
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

      {/* History Tab - client component, permission-gated */}
      <MemberHistoryPanel memberId={member.id} />
    </div>
  );
}
