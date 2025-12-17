import { notFound } from "next/navigation";

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

type Registration = {
  id: string;
  memberId: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  status: string;
  registeredAt: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RegistrationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/admin/registrations/${id}`, { headers: adminHeaders, cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    return (
      <div data-test-id="admin-registration-detail-error" style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Error</h1>
        <p>Failed to load registration details.</p>
      </div>
    );
  }

  const data = await res.json();
  const registration: Registration = data.registration;

  return (
    <div data-test-id="admin-registration-detail-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Registration Detail</h1>

      <div style={{ marginBottom: "24px" }}>
        <div style={{ marginBottom: "8px" }}>
          <strong>Member:</strong>{" "}
          <span data-test-id="admin-registration-member-name">{registration.memberName}</span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Event:</strong>{" "}
          <span data-test-id="admin-registration-event-title">{registration.eventTitle}</span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Status:</strong>{" "}
          <span data-test-id="admin-registration-status">{registration.status}</span>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Registered at:</strong>{" "}
          <span data-test-id="admin-registration-registered-at">{registration.registeredAt}</span>
        </div>
      </div>
    </div>
  );
}
