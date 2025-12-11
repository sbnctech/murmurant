import { getBaseUrl } from "@/lib/getBaseUrl";
import { listMockEmails, MockEmailEntry } from "@/lib/email";
import SystemCommsPanel from "./SystemCommsPanel";

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
  const [members, events, registrations, emails] = await Promise.all([
    getMembers(),
    getEvents(),
    getRegistrations(),
    listMockEmails(20),
  ]);

  const joinedRegistrations = joinRegistrations(registrations, members, events);

  return (
    <div data-test-id="admin-root" style={{ padding: "20px" }}>
      <header
        data-test-id="admin-header"
        style={{ fontSize: "24px", marginBottom: "20px" }}
      >
        Admin
      </header>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          Members overview
        </h2>
        <p style={{ marginBottom: "12px" }}>
          This table is backed by the /api/members endpoint. Data is currently
          mocked and will later be replaced with database-backed queries.
        </p>
      </section>

      <section style={{ marginBottom: "32px" }}>
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

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          Events overview
        </h2>
        <p style={{ marginBottom: "12px" }}>
          This table is backed by the /api/events endpoint. Data is currently
          mocked and will later be replaced with database-backed queries.
        </p>
      </section>

      <section style={{ marginBottom: "32px" }}>
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

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          Registrations overview
        </h2>
        <p style={{ marginBottom: "12px" }}>
          This table joins /api/registrations with members and events to show
          who is registered for what.
        </p>
      </section>

      <section style={{ marginBottom: "32px" }}>
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

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Email activity</h2>
        <p style={{ marginBottom: "12px" }}>
          This panel reads from the mock email log. In development, calls to
          /api/email/test append entries here instead of sending real email.
        </p>
      </section>

      <section>
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

      <section style={{ marginBottom: "24px", marginTop: "32px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
          System communications
        </h2>
        <p style={{ marginBottom: "12px" }}>
          Check system health and test email/SMS delivery.
        </p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <SystemCommsPanel />
      </section>
    </div>
  );
}
