"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatClubTime } from "@/lib/timezone";

/**
 * Event Check-In Page
 *
 * For event chairs to check in attendees at events.
 * Features:
 * - List of registered attendees
 * - Check-in checkbox per person
 * - Search/filter attendees
 * - Check-in count vs total
 * - Walk-in registration
 * - QR code scanner placeholder
 * - Export attendance list
 *
 * Charter: P7 (Observability is a product feature)
 */

type AttendeeStatus = "registered" | "waitlisted" | "walk-in";
type CheckInStatus = "checked-in" | "not-checked-in" | "no-show";

type Attendee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: AttendeeStatus;
  checkInStatus: CheckInStatus;
  checkInTime?: string;
  ticketType: string;
  guestCount: number;
};

// Demo event data
const DEMO_EVENT = {
  id: "evt-001",
  name: "Wine Tasting at Grassini Vineyards",
  date: "2025-01-25",
  time: "4:00 PM",
  location: "Grassini Family Vineyards",
  capacity: 40,
};

// Demo attendee data
const DEMO_ATTENDEES: Attendee[] = [
  {
    id: "att-001",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@email.com",
    phone: "(805) 555-0101",
    status: "registered",
    checkInStatus: "checked-in",
    checkInTime: "3:45 PM",
    ticketType: "Member",
    guestCount: 1,
  },
  {
    id: "att-002",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob.smith@email.com",
    phone: "(805) 555-0102",
    status: "registered",
    checkInStatus: "checked-in",
    checkInTime: "3:52 PM",
    ticketType: "Member",
    guestCount: 0,
  },
  {
    id: "att-003",
    firstName: "Carol",
    lastName: "Williams",
    email: "carol.williams@email.com",
    status: "registered",
    checkInStatus: "not-checked-in",
    ticketType: "Member + Guest",
    guestCount: 1,
  },
  {
    id: "att-004",
    firstName: "David",
    lastName: "Brown",
    email: "david.brown@email.com",
    phone: "(805) 555-0104",
    status: "registered",
    checkInStatus: "not-checked-in",
    ticketType: "Member",
    guestCount: 0,
  },
  {
    id: "att-005",
    firstName: "Emma",
    lastName: "Davis",
    email: "emma.davis@email.com",
    status: "registered",
    checkInStatus: "not-checked-in",
    ticketType: "Member + Guest",
    guestCount: 2,
  },
  {
    id: "att-006",
    firstName: "Frank",
    lastName: "Miller",
    email: "frank.miller@email.com",
    phone: "(805) 555-0106",
    status: "waitlisted",
    checkInStatus: "not-checked-in",
    ticketType: "Waitlist",
    guestCount: 0,
  },
  {
    id: "att-007",
    firstName: "Grace",
    lastName: "Wilson",
    email: "grace.wilson@email.com",
    status: "walk-in",
    checkInStatus: "checked-in",
    checkInTime: "4:10 PM",
    ticketType: "Walk-in",
    guestCount: 0,
  },
  {
    id: "att-008",
    firstName: "Henry",
    lastName: "Moore",
    email: "henry.moore@email.com",
    phone: "(805) 555-0108",
    status: "registered",
    checkInStatus: "not-checked-in",
    ticketType: "Member",
    guestCount: 1,
  },
];

function StatusBadge({ status }: { status: AttendeeStatus }) {
  const styles = {
    registered: "bg-green-100 text-green-800",
    waitlisted: "bg-yellow-100 text-yellow-800",
    "walk-in": "bg-blue-100 text-blue-800",
  };
  const labels = {
    registered: "Registered",
    waitlisted: "Waitlist",
    "walk-in": "Walk-in",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function CheckInBadge({ status, time }: { status: CheckInStatus; time?: string }) {
  if (status === "checked-in") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">{time}</span>
      </span>
    );
  }
  return (
    <span className="text-gray-400 text-sm">Not checked in</span>
  );
}

export default function EventCheckInPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [attendees, setAttendees] = useState<Attendee[]>(DEMO_ATTENDEES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "checked-in" | "not-checked-in">("all");
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    let results = attendees;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.firstName.toLowerCase().includes(query) ||
          a.lastName.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query)
      );
    }

    // Filter by check-in status
    if (filterStatus === "checked-in") {
      results = results.filter((a) => a.checkInStatus === "checked-in");
    } else if (filterStatus === "not-checked-in") {
      results = results.filter((a) => a.checkInStatus !== "checked-in");
    }

    return results;
  }, [attendees, searchQuery, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = attendees.length;
    const checkedIn = attendees.filter((a) => a.checkInStatus === "checked-in").length;
    const totalGuests = attendees.reduce((sum, a) => sum + a.guestCount, 0);
    const walkIns = attendees.filter((a) => a.status === "walk-in").length;
    return { total, checkedIn, totalGuests, walkIns };
  }, [attendees]);

  const handleCheckIn = (attendeeId: string) => {
    setAttendees((prev) =>
      prev.map((a) => {
        if (a.id === attendeeId) {
          const newStatus = a.checkInStatus === "checked-in" ? "not-checked-in" : "checked-in";
          return {
            ...a,
            checkInStatus: newStatus,
            checkInTime: newStatus === "checked-in" ? formatClubTime(new Date()) : undefined,
          };
        }
        return a;
      })
    );
  };

  const handleExportAttendance = () => {
    // In production, this would generate a CSV
    alert("Demo mode: Attendance CSV export would start here");
  };

  const handleAddWalkIn = (firstName: string, lastName: string, email: string) => {
    const newAttendee: Attendee = {
      id: `att-${Date.now()}`,
      firstName,
      lastName,
      email,
      status: "walk-in",
      checkInStatus: "checked-in",
      checkInTime: formatClubTime(new Date()),
      ticketType: "Walk-in",
      guestCount: 0,
    };
    setAttendees((prev) => [...prev, newAttendee]);
    setShowWalkInModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/events/${eventId}`}
          className="inline-flex items-center gap-1 text-sm text-[var(--token-color-primary)] hover:underline mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-[var(--token-color-text)]">
          Event Check-In
        </h1>
        <p className="text-[var(--token-color-text-muted)]">
          {DEMO_EVENT.name} - {DEMO_EVENT.date} at {DEMO_EVENT.time}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-4 text-center">
          <p className="text-3xl font-bold text-[var(--token-color-text)]">
            {stats.checkedIn}/{stats.total}
          </p>
          <p className="text-sm text-[var(--token-color-text-muted)]">Checked In</p>
        </div>
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {Math.round((stats.checkedIn / stats.total) * 100)}%
          </p>
          <p className="text-sm text-[var(--token-color-text-muted)]">Attendance Rate</p>
        </div>
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-4 text-center">
          <p className="text-3xl font-bold text-[var(--token-color-text)]">
            {stats.totalGuests}
          </p>
          <p className="text-sm text-[var(--token-color-text-muted)]">Total Guests</p>
        </div>
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {stats.walkIns}
          </p>
          <p className="text-sm text-[var(--token-color-text-muted)]">Walk-ins</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attendees..."
              className="w-64 px-4 py-2 pl-10 rounded-lg border border-[var(--token-color-border)] bg-[var(--token-color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 rounded-lg border border-[var(--token-color-border)] bg-[var(--token-color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)]"
          >
            <option value="all">All Attendees</option>
            <option value="checked-in">Checked In</option>
            <option value="not-checked-in">Not Checked In</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* QR Scanner */}
          <button
            onClick={() => setShowQRScanner(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--token-color-border)] bg-[var(--token-color-surface)] text-sm font-medium hover:bg-[var(--token-color-surface-2)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR
          </button>

          {/* Walk-in */}
          <button
            onClick={() => setShowWalkInModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--token-color-primary)] text-white text-sm font-medium hover:bg-[var(--token-color-primary-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Walk-in
          </button>

          {/* Export */}
          <button
            onClick={handleExportAttendance}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--token-color-border)] bg-[var(--token-color-surface)] text-sm font-medium hover:bg-[var(--token-color-surface-2)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Attendee List */}
      <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--token-color-surface-2)]">
                <th className="w-12 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Ticket</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Guests</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--token-color-border)]">
              {filteredAttendees.map((attendee) => (
                <tr key={attendee.id} className="hover:bg-[var(--token-color-surface-2)] transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleCheckIn(attendee.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        attendee.checkInStatus === "checked-in"
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 hover:border-green-500"
                      }`}
                    >
                      {attendee.checkInStatus === "checked-in" && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--token-color-text)]">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--token-color-text)]">{attendee.email}</p>
                    {attendee.phone && (
                      <p className="text-xs text-[var(--token-color-text-muted)]">{attendee.phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--token-color-text)]">{attendee.ticketType}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {attendee.guestCount > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                        +{attendee.guestCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={attendee.status} />
                  </td>
                  <td className="px-4 py-3">
                    <CheckInBadge status={attendee.checkInStatus} time={attendee.checkInTime} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[var(--token-color-border)]">
          {filteredAttendees.map((attendee) => (
            <div key={attendee.id} className="p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleCheckIn(attendee.id)}
                  className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    attendee.checkInStatus === "checked-in"
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {attendee.checkInStatus === "checked-in" && (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[var(--token-color-text)]">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    <StatusBadge status={attendee.status} />
                  </div>
                  <p className="text-sm text-[var(--token-color-text-muted)] truncate">{attendee.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--token-color-text-muted)]">{attendee.ticketType}</span>
                    {attendee.guestCount > 0 && (
                      <span className="text-xs text-purple-600">+{attendee.guestCount} guest{attendee.guestCount > 1 ? "s" : ""}</span>
                    )}
                    {attendee.checkInTime && (
                      <span className="text-xs text-green-600">Checked in {attendee.checkInTime}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAttendees.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-[var(--token-color-text-muted)]">No attendees match your search.</p>
          </div>
        )}
      </div>

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <WalkInModal
          onClose={() => setShowWalkInModal(false)}
          onAdd={handleAddWalkIn}
        />
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal onClose={() => setShowQRScanner(false)} />
      )}

      {/* Demo Notice */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-amber-800">
            <strong>Demo Mode:</strong> This page displays sample data. In production, check-ins will be saved to the database and sync in real-time.
          </div>
        </div>
      </div>
    </div>
  );
}

function WalkInModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (firstName: string, lastName: string, email: string) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim() && email.trim()) {
      onAdd(firstName.trim(), lastName.trim(), email.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Walk-in Attendee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)]"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--token-color-primary)] hover:bg-[var(--token-color-primary-hover)] rounded-lg transition-colors"
            >
              Add & Check In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QRScannerModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">QR Code Scanner</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="text-gray-500 text-sm">Camera access required</p>
            <p className="text-gray-400 text-xs mt-1">QR scanner coming soon</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Point your camera at an attendee&apos;s QR code to automatically check them in.
        </p>
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
