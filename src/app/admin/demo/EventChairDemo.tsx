/**
 * Event Chair Demo
 *
 * Interactive walkthrough showing the event chair workflow:
 * 1. "Your Events" - list of events I'm chairing
 * 2. One-click: See registrations, waitlist, revenue
 * 3. One-click: Send reminder to registrants
 * 4. One-click: Submit postmortem after event
 * 5. Status badges: Draft → Pending → Approved → Published
 *
 * Charter: P3 (state machine), P7 (observability)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

type EventStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "COMPLETED"
  | "CANCELED";

type PostmortemStatus = "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "APPROVED";

type DemoEvent = {
  id: string;
  title: string;
  category: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
  capacity: number | null;
  registrationCount: number;
  waitlistCount: number;
  revenue: number;
  postmortemStatus: PostmortemStatus | null;
};

type Registration = {
  id: string;
  memberName: string;
  email: string;
  status: "REGISTERED" | "WAITLISTED" | "CANCELED" | "ATTENDED";
  registeredAt: Date;
  ticketType: string;
  amountPaid: number;
};

// ============================================================================
// MOCK DATA - Realistic SBNC events
// ============================================================================

const MOCK_EVENTS: DemoEvent[] = [
  {
    id: "evt-1",
    title: "New Member Welcome Coffee",
    category: "Social",
    startTime: new Date("2025-01-15T10:00:00"),
    endTime: new Date("2025-01-15T12:00:00"),
    status: "PUBLISHED",
    capacity: 30,
    registrationCount: 24,
    waitlistCount: 3,
    revenue: 240,
    postmortemStatus: null,
  },
  {
    id: "evt-2",
    title: "Wine Tasting at Sanford Winery",
    category: "Wine",
    startTime: new Date("2025-01-22T14:00:00"),
    endTime: new Date("2025-01-22T17:00:00"),
    status: "APPROVED",
    capacity: 20,
    registrationCount: 18,
    waitlistCount: 5,
    revenue: 900,
    postmortemStatus: null,
  },
  {
    id: "evt-3",
    title: "Book Club: 'Lessons in Chemistry'",
    category: "Books",
    startTime: new Date("2025-01-10T13:00:00"),
    endTime: new Date("2025-01-10T15:00:00"),
    status: "COMPLETED",
    capacity: 15,
    registrationCount: 12,
    waitlistCount: 0,
    revenue: 0,
    postmortemStatus: "DRAFT",
  },
  {
    id: "evt-4",
    title: "Hiking: Inspiration Point",
    category: "Outdoor",
    startTime: new Date("2025-02-01T08:00:00"),
    endTime: new Date("2025-02-01T12:00:00"),
    status: "PENDING_APPROVAL",
    capacity: 25,
    registrationCount: 0,
    waitlistCount: 0,
    revenue: 0,
    postmortemStatus: null,
  },
  {
    id: "evt-5",
    title: "Garden Tour: Lotusland",
    category: "Garden",
    startTime: new Date("2025-02-15T10:00:00"),
    endTime: new Date("2025-02-15T13:00:00"),
    status: "DRAFT",
    capacity: 40,
    registrationCount: 0,
    waitlistCount: 0,
    revenue: 0,
    postmortemStatus: null,
  },
];

const MOCK_REGISTRATIONS: Registration[] = [
  {
    id: "reg-1",
    memberName: "Jane Smith",
    email: "jane.smith@example.com",
    status: "REGISTERED",
    registeredAt: new Date("2025-01-05T09:30:00"),
    ticketType: "Member",
    amountPaid: 10,
  },
  {
    id: "reg-2",
    memberName: "Robert Johnson",
    email: "robert.j@example.com",
    status: "REGISTERED",
    registeredAt: new Date("2025-01-05T10:15:00"),
    ticketType: "Member",
    amountPaid: 10,
  },
  {
    id: "reg-3",
    memberName: "Emily Davis",
    email: "emily.d@example.com",
    status: "WAITLISTED",
    registeredAt: new Date("2025-01-08T14:00:00"),
    ticketType: "Member",
    amountPaid: 0,
  },
  {
    id: "reg-4",
    memberName: "Michael Brown",
    email: "m.brown@example.com",
    status: "REGISTERED",
    registeredAt: new Date("2025-01-06T11:00:00"),
    ticketType: "Guest",
    amountPaid: 15,
  },
  {
    id: "reg-5",
    memberName: "Sarah Wilson",
    email: "sarah.w@example.com",
    status: "CANCELED",
    registeredAt: new Date("2025-01-04T16:00:00"),
    ticketType: "Member",
    amountPaid: 0,
  },
];

// ============================================================================
// STATUS UTILITIES
// ============================================================================

function getStatusColor(status: EventStatus): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "PENDING_APPROVAL":
      return "bg-yellow-100 text-yellow-800";
    case "CHANGES_REQUESTED":
      return "bg-orange-100 text-orange-800";
    case "APPROVED":
      return "bg-blue-100 text-blue-800";
    case "PUBLISHED":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-purple-100 text-purple-800";
    case "CANCELED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusLabel(status: EventStatus): string {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending Approval";
    case "CHANGES_REQUESTED":
      return "Changes Requested";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function getPostmortemStatusColor(status: PostmortemStatus | null): string {
  switch (status) {
    case "NOT_STARTED":
      return "bg-gray-100 text-gray-600";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-50 text-gray-400";
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function EventChairDemo() {
  const [selectedEvent, setSelectedEvent] = useState<DemoEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"registrations" | "waitlist" | "revenue">("registrations");
  const [actionLog, setActionLog] = useState<string[]>([]);

  const logAction = (action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog((prev) => [`[${timestamp}] ${action}`, ...prev.slice(0, 9)]);
  };

  const handleSubmitForApproval = (event: DemoEvent) => {
    logAction(`Submitted "${event.title}" for VP approval`);
    alert(`Event "${event.title}" submitted for VP approval.\n\nIn production, this triggers:\n- Email to VP of Activities\n- Status change: DRAFT → PENDING_APPROVAL\n- Audit log entry`);
  };

  const handleSendReminder = (event: DemoEvent) => {
    logAction(`Sent reminder to ${event.registrationCount} registrants for "${event.title}"`);
    alert(`Reminder sent to ${event.registrationCount} registrants!\n\nIn production, this sends:\n- Email to all REGISTERED attendees\n- Event details and calendar link\n- Audit log entry`);
  };

  const handleSubmitPostmortem = (event: DemoEvent) => {
    logAction(`Submitted postmortem for "${event.title}"`);
    alert(`Postmortem submitted for VP review.\n\nIn production:\n- Status: DRAFT → SUBMITTED\n- VP receives notification\n- Attendance data captured`);
  };

  const handleViewDetails = (event: DemoEvent) => {
    setSelectedEvent(event);
    setActiveTab("registrations");
    logAction(`Viewing details for "${event.title}"`);
  };

  const registeredCount = MOCK_REGISTRATIONS.filter((r) => r.status === "REGISTERED").length;
  const waitlistedCount = MOCK_REGISTRATIONS.filter((r) => r.status === "WAITLISTED").length;
  const totalRevenue = MOCK_REGISTRATIONS.filter((r) => r.status === "REGISTERED").reduce((sum, r) => sum + r.amountPaid, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold">Event Chair Dashboard</h2>
        <p className="mt-1 text-blue-100">
          Manage your events, track registrations, and complete postmortems
        </p>
      </div>

      {/* Status Flow Legend */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Event Status Flow</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`px-2 py-1 rounded-full ${getStatusColor("DRAFT")}`}>Draft</span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-1 rounded-full ${getStatusColor("PENDING_APPROVAL")}`}>Pending</span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-1 rounded-full ${getStatusColor("APPROVED")}`}>Approved</span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-1 rounded-full ${getStatusColor("PUBLISHED")}`}>Published</span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-1 rounded-full ${getStatusColor("COMPLETED")}`}>Completed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Events</h3>

          {MOCK_EVENTS.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-lg border p-4 transition-all ${
                selectedEvent?.id === event.id ? "ring-2 ring-blue-500" : "hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {event.category} • {formatDate(event.startTime)}
                  </p>

                  {/* Quick Stats */}
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-600">
                      <strong>{event.registrationCount}</strong>/{event.capacity ?? "∞"} registered
                    </span>
                    {event.waitlistCount > 0 && (
                      <span className="text-orange-600">
                        <strong>{event.waitlistCount}</strong> waitlisted
                      </span>
                    )}
                    {event.revenue > 0 && (
                      <span className="text-green-600">
                        {formatCurrency(event.revenue)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleViewDetails(event)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  View Details
                </button>

                {event.status === "DRAFT" && (
                  <button
                    onClick={() => handleSubmitForApproval(event)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Submit for Approval
                  </button>
                )}

                {event.status === "PUBLISHED" && event.registrationCount > 0 && (
                  <button
                    onClick={() => handleSendReminder(event)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Send Reminder
                  </button>
                )}

                {event.status === "COMPLETED" && event.postmortemStatus === "DRAFT" && (
                  <button
                    onClick={() => handleSubmitPostmortem(event)}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Submit Postmortem
                  </button>
                )}

                {event.postmortemStatus && (
                  <span className={`px-2 py-1 text-xs rounded-full ${getPostmortemStatusColor(event.postmortemStatus)}`}>
                    Postmortem: {event.postmortemStatus}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {/* Selected Event Details */}
          {selectedEvent ? (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{selectedEvent.title}</h3>

              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveTab("registrations")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === "registrations"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Registrations ({registeredCount})
                </button>
                <button
                  onClick={() => setActiveTab("waitlist")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === "waitlist"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Waitlist ({waitlistedCount})
                </button>
                <button
                  onClick={() => setActiveTab("revenue")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === "revenue"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Revenue
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "registrations" && (
                <div className="space-y-2">
                  {MOCK_REGISTRATIONS.filter((r) => r.status === "REGISTERED").map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{reg.memberName}</p>
                        <p className="text-xs text-gray-500">{reg.ticketType}</p>
                      </div>
                      <span className="text-sm text-gray-600">{formatCurrency(reg.amountPaid)}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "waitlist" && (
                <div className="space-y-2">
                  {MOCK_REGISTRATIONS.filter((r) => r.status === "WAITLISTED").map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{reg.memberName}</p>
                        <p className="text-xs text-gray-500">Joined waitlist {formatDate(reg.registeredAt)}</p>
                      </div>
                      <button className="text-xs text-blue-600 hover:underline">Promote</button>
                    </div>
                  ))}
                  {waitlistedCount === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No one on waitlist</p>
                  )}
                </div>
              )}

              {activeTab === "revenue" && (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
                    <p className="text-sm text-green-600">Total collected</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-lg font-semibold">{registeredCount}</p>
                      <p className="text-xs text-gray-500">Paid registrations</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-lg font-semibold">
                        {formatCurrency(registeredCount > 0 ? totalRevenue / registeredCount : 0)}
                      </p>
                      <p className="text-xs text-gray-500">Avg per person</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-500">Select an event to view details</p>
            </div>
          )}

          {/* Action Log */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Action Log</h3>
            <div className="space-y-1 font-mono text-xs">
              {actionLog.length > 0 ? (
                actionLog.map((log, i) => (
                  <p key={i} className="text-green-400">{log}</p>
                ))
              ) : (
                <p className="text-gray-500">No actions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
