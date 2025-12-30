// Copyright © 2025 Murmurant, Inc.
// Committee list page - view and manage all committees

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type CommitteeStatus = "active" | "inactive";

interface Committee {
  id: string;
  name: string;
  description: string;
  status: CommitteeStatus;
  chairName: string;
  chairEmail: string;
  memberCount: number;
  createdAt: string;
  meetingSchedule?: string;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const committees: Committee[] = [
  {
    id: "comm-1",
    name: "Membership Committee",
    description: "Reviews applications and manages member onboarding",
    status: "active",
    chairName: "Margaret Thompson",
    chairEmail: "margaret.thompson@email.com",
    memberCount: 8,
    createdAt: "2020-01-15",
    meetingSchedule: "First Tuesday, 10:00 AM",
  },
  {
    id: "comm-2",
    name: "Events Committee",
    description: "Plans and coordinates club events and activities",
    status: "active",
    chairName: "Robert Chen",
    chairEmail: "robert.chen@email.com",
    memberCount: 12,
    createdAt: "2020-01-15",
    meetingSchedule: "Second Wednesday, 2:00 PM",
  },
  {
    id: "comm-3",
    name: "Communications Committee",
    description: "Manages newsletter, website, and member communications",
    status: "active",
    chairName: "Susan Martinez",
    chairEmail: "susan.martinez@email.com",
    memberCount: 6,
    createdAt: "2021-03-01",
    meetingSchedule: "Weekly, Friday 9:00 AM",
  },
  {
    id: "comm-4",
    name: "Finance Committee",
    description: "Oversees budget, dues collection, and financial reporting",
    status: "active",
    chairName: "David Wilson",
    chairEmail: "david.wilson@email.com",
    memberCount: 4,
    createdAt: "2020-01-15",
    meetingSchedule: "Monthly, last Thursday",
  },
  {
    id: "comm-5",
    name: "Nominating Committee",
    description: "Identifies and recruits candidates for board positions",
    status: "active",
    chairName: "Patricia Anderson",
    chairEmail: "patricia.anderson@email.com",
    memberCount: 5,
    createdAt: "2020-01-15",
    meetingSchedule: "As needed",
  },
  {
    id: "comm-6",
    name: "Hospitality Committee",
    description: "Welcomes new members and organizes social gatherings",
    status: "active",
    chairName: "Linda Garcia",
    chairEmail: "linda.garcia@email.com",
    memberCount: 10,
    createdAt: "2020-06-01",
    meetingSchedule: "Third Monday, 11:00 AM",
  },
  {
    id: "comm-7",
    name: "Interest Groups Committee",
    description: "Coordinates and supports member interest groups",
    status: "active",
    chairName: "James Taylor",
    chairEmail: "james.taylor@email.com",
    memberCount: 7,
    createdAt: "2021-09-01",
    meetingSchedule: "Quarterly",
  },
  {
    id: "comm-8",
    name: "Community Outreach",
    description: "Manages charitable activities and community partnerships",
    status: "inactive",
    chairName: "Elizabeth Brown",
    chairEmail: "elizabeth.brown@email.com",
    memberCount: 3,
    createdAt: "2022-01-15",
  },
  {
    id: "comm-9",
    name: "Technology Committee",
    description: "Supports website and technology initiatives",
    status: "inactive",
    chairName: "Michael Lee",
    chairEmail: "michael.lee@email.com",
    memberCount: 2,
    createdAt: "2023-06-01",
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getStatusColor(status: CommitteeStatus): { bg: string; text: string } {
  switch (status) {
    case "active":
      return { bg: "bg-green-100", text: "text-green-700" };
    case "inactive":
      return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}

function exportRoster(committee: Committee) {
  const headers = ["Committee", "Chair", "Chair Email", "Member Count", "Status"];
  const row = [committee.name, committee.chairName, committee.chairEmail, committee.memberCount.toString(), committee.status];
  const csv = [headers.join(","), row.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${committee.name.toLowerCase().replace(/\s+/g, "-")}-roster.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// Quick Actions Dropdown
// -----------------------------------------------------------------------------

function QuickActionsDropdown({
  committee,
  onEmailMembers,
}: {
  committee: Committee;
  onEmailMembers: (committee: Committee) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Quick actions"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
            <button
              onClick={() => {
                onEmailMembers(committee);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Members
            </button>
            <button
              onClick={() => {
                exportRoster(committee);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Roster
            </button>
            <hr className="my-1" />
            <Link
              href={`/admin/committees/${committee.id}`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              View Details
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Committee Card
// -----------------------------------------------------------------------------

function CommitteeCard({
  committee,
  onEmailMembers,
}: {
  committee: Committee;
  onEmailMembers: (committee: Committee) => void;
}) {
  const statusColors = getStatusColor(committee.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{committee.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}>
              {committee.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{committee.description}</p>
        </div>
        <QuickActionsDropdown committee={committee} onEmailMembers={onEmailMembers} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-gray-600">Chair:</span>
          <span className="font-medium text-gray-900">{committee.chairName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-gray-600">Members:</span>
          <span className="font-medium text-gray-900">{committee.memberCount}</span>
        </div>
        {committee.meetingSchedule && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-600">Meets:</span>
            <span className="text-gray-700">{committee.meetingSchedule}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <Link
          href={`/admin/committees/${committee.id}/edit`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Edit
        </Link>
        <Link
          href={`/admin/committees/${committee.id}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Empty State
// -----------------------------------------------------------------------------

function EmptyState({ filter }: { filter: CommitteeStatus | "all" }) {
  return (
    <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No committees found</h3>
      <p className="text-gray-500">
        {filter === "all"
          ? "Get started by creating your first committee."
          : `No ${filter} committees at this time.`}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function CommitteeListPage() {
  const [filter, setFilter] = useState<CommitteeStatus | "all">("all");

  // Filter committees
  const filteredCommittees = useMemo(() => {
    if (filter === "all") return committees;
    return committees.filter((c) => c.status === filter);
  }, [filter]);

  // Stats
  const stats = useMemo(() => {
    const active = committees.filter((c) => c.status === "active").length;
    const inactive = committees.filter((c) => c.status === "inactive").length;
    const totalMembers = committees.reduce((sum, c) => sum + c.memberCount, 0);
    return { active, inactive, total: committees.length, totalMembers };
  }, []);

  // Handlers
  const handleEmailMembers = (committee: Committee) => {
    window.location.href = `mailto:${committee.chairEmail}?subject=${encodeURIComponent(`${committee.name} - Message to Members`)}`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Committees</h1>
              <p className="mt-1 text-gray-600">
                {stats.total} committees with {stats.totalMembers} total members
              </p>
            </div>
            <Link
              href="/admin/committees/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Committee
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Committees</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Members</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalMembers}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(["all", "active", "inactive"] as const).map((status) => {
            const isActive = filter === status;
            const count = status === "all" ? stats.total : status === "active" ? stats.active : stats.inactive;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* Committee Grid */}
        {filteredCommittees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommittees.map((committee) => (
              <CommitteeCard
                key={committee.id}
                committee={committee}
                onEmailMembers={handleEmailMembers}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}
      </div>
    </main>
  );
}
