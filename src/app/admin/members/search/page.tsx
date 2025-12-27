// Copyright (c) Santa Barbara Newcomers Club
// Member search page - advanced search with filters and bulk actions

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type MembershipTier = "individual" | "household" | "honorary" | "lifetime";
type MemberStatus = "active" | "expired" | "pending";
type Committee = "activities" | "membership" | "hospitality" | "communications" | "finance" | "none";

interface Member {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tier: MembershipTier;
  status: MemberStatus;
  committee: Committee;
  joinDate: string;
  expirationDate: string;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const members: Member[] = [
  {
    id: "1",
    memberId: "M-2024-001",
    firstName: "Catherine",
    lastName: "Reynolds",
    email: "catherine.reynolds@email.com",
    phone: "(805) 555-0101",
    tier: "individual",
    status: "active",
    committee: "activities",
    joinDate: "2020-03-15",
    expirationDate: "2025-03-15",
  },
  {
    id: "2",
    memberId: "M-2024-002",
    firstName: "James",
    lastName: "Mitchell",
    email: "james.mitchell@email.com",
    phone: "(805) 555-0102",
    tier: "household",
    status: "active",
    committee: "membership",
    joinDate: "2019-06-20",
    expirationDate: "2025-06-20",
  },
  {
    id: "3",
    memberId: "M-2024-003",
    firstName: "Elizabeth",
    lastName: "Chen",
    email: "elizabeth.chen@email.com",
    phone: "(805) 555-0103",
    tier: "individual",
    status: "active",
    committee: "communications",
    joinDate: "2021-01-10",
    expirationDate: "2025-01-10",
  },
  {
    id: "4",
    memberId: "M-2024-004",
    firstName: "Robert",
    lastName: "Garcia",
    email: "robert.garcia@email.com",
    phone: "(805) 555-0104",
    tier: "lifetime",
    status: "active",
    committee: "finance",
    joinDate: "2015-09-05",
    expirationDate: "9999-12-31",
  },
  {
    id: "5",
    memberId: "M-2024-005",
    firstName: "Patricia",
    lastName: "Anderson",
    email: "patricia.anderson@email.com",
    phone: "(805) 555-0105",
    tier: "individual",
    status: "expired",
    committee: "hospitality",
    joinDate: "2022-04-12",
    expirationDate: "2024-04-12",
  },
  {
    id: "6",
    memberId: "M-2024-006",
    firstName: "Michael",
    lastName: "Thompson",
    email: "michael.thompson@email.com",
    phone: "(805) 555-0106",
    tier: "household",
    status: "active",
    committee: "none",
    joinDate: "2023-07-08",
    expirationDate: "2025-07-08",
  },
  {
    id: "7",
    memberId: "M-2024-007",
    firstName: "Susan",
    lastName: "Williams",
    email: "susan.williams@email.com",
    phone: "(805) 555-0107",
    tier: "honorary",
    status: "active",
    committee: "none",
    joinDate: "2010-01-01",
    expirationDate: "9999-12-31",
  },
  {
    id: "8",
    memberId: "M-2024-008",
    firstName: "David",
    lastName: "Brown",
    email: "david.brown@email.com",
    phone: "(805) 555-0108",
    tier: "individual",
    status: "pending",
    committee: "none",
    joinDate: "2024-12-01",
    expirationDate: "2025-12-01",
  },
  {
    id: "9",
    memberId: "M-2024-009",
    firstName: "Jennifer",
    lastName: "Martinez",
    email: "jennifer.martinez@email.com",
    phone: "(805) 555-0109",
    tier: "individual",
    status: "expired",
    committee: "activities",
    joinDate: "2021-08-22",
    expirationDate: "2024-08-22",
  },
  {
    id: "10",
    memberId: "M-2024-010",
    firstName: "William",
    lastName: "Davis",
    email: "william.davis@email.com",
    phone: "(805) 555-0110",
    tier: "household",
    status: "active",
    committee: "membership",
    joinDate: "2022-11-30",
    expirationDate: "2025-11-30",
  },
  {
    id: "11",
    memberId: "M-2024-011",
    firstName: "Linda",
    lastName: "Johnson",
    email: "linda.johnson@email.com",
    phone: "(805) 555-0111",
    tier: "individual",
    status: "pending",
    committee: "none",
    joinDate: "2024-12-15",
    expirationDate: "2025-12-15",
  },
  {
    id: "12",
    memberId: "M-2024-012",
    firstName: "Richard",
    lastName: "Wilson",
    email: "richard.wilson@email.com",
    phone: "(805) 555-0112",
    tier: "lifetime",
    status: "active",
    committee: "finance",
    joinDate: "2012-05-18",
    expirationDate: "9999-12-31",
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getStatusBadge(status: MemberStatus) {
  const styles: Record<MemberStatus, { bg: string; text: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700" },
    expired: { bg: "bg-red-100", text: "text-red-700" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  };
  const style = styles[status];
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function getTierLabel(tier: MembershipTier): string {
  const labels: Record<MembershipTier, string> = {
    individual: "Individual",
    household: "Household",
    honorary: "Honorary",
    lifetime: "Lifetime",
  };
  return labels[tier];
}

function getCommitteeLabel(committee: Committee): string {
  const labels: Record<Committee, string> = {
    activities: "Activities",
    membership: "Membership",
    hospitality: "Hospitality",
    communications: "Communications",
    finance: "Finance",
    none: "None",
  };
  return labels[committee];
}

function exportToCsv(data: Member[], filename: string) {
  const headers = [
    "Member ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Tier",
    "Status",
    "Committee",
    "Join Date",
    "Expiration Date",
  ];

  const rows = data.map((m) => [
    m.memberId,
    m.firstName,
    m.lastName,
    m.email,
    m.phone,
    getTierLabel(m.tier),
    m.status,
    getCommitteeLabel(m.committee),
    m.joinDate,
    m.expirationDate,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// -----------------------------------------------------------------------------
// Filter Options
// -----------------------------------------------------------------------------

const tierOptions: { value: MembershipTier | "all"; label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: "individual", label: "Individual" },
  { value: "household", label: "Household" },
  { value: "honorary", label: "Honorary" },
  { value: "lifetime", label: "Lifetime" },
];

const statusOptions: { value: MemberStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
];

const committeeOptions: { value: Committee | "all"; label: string }[] = [
  { value: "all", label: "All Committees" },
  { value: "activities", label: "Activities" },
  { value: "membership", label: "Membership" },
  { value: "hospitality", label: "Hospitality" },
  { value: "communications", label: "Communications" },
  { value: "finance", label: "Finance" },
  { value: "none", label: "No Committee" },
];

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function MemberSearchPage() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<MembershipTier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all");
  const [committeeFilter, setCommitteeFilter] = useState<Committee | "all">("all");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter (name, email, or member ID)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.memberId.toLowerCase().includes(searchLower) ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower);

      // Tier filter
      const matchesTier = tierFilter === "all" || member.tier === tierFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;

      // Committee filter
      const matchesCommittee = committeeFilter === "all" || member.committee === committeeFilter;

      return matchesSearch && matchesTier && matchesStatus && matchesCommittee;
    });
  }, [searchQuery, tierFilter, statusFilter, committeeFilter]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportAll = () => {
    exportToCsv(filteredMembers, `members-export-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportSelected = () => {
    const selectedMembers = filteredMembers.filter((m) => selectedIds.has(m.id));
    exportToCsv(selectedMembers, `members-selected-${new Date().toISOString().split("T")[0]}.csv`);
    setShowBulkMenu(false);
  };

  const handleBulkEmail = () => {
    const selectedMembers = filteredMembers.filter((m) => selectedIds.has(m.id));
    const emails = selectedMembers.map((m) => m.email).join(",");
    window.location.href = `mailto:${emails}`;
    setShowBulkMenu(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setStatusFilter("all");
    setCommitteeFilter("all");
    setSelectedIds(new Set());
  };

  const isAllSelected = filteredMembers.length > 0 && selectedIds.size === filteredMembers.length;
  const hasFilters = searchQuery || tierFilter !== "all" || statusFilter !== "all" || committeeFilter !== "all";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Member Search</h1>
              <p className="mt-1 text-gray-600">
                Search and filter members by various criteria
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Export All ({filteredMembers.length})
              </button>
              <Link
                href="/admin/members"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Members
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Search Input */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, email, or member ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tier Filter */}
            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">
                Membership Tier
              </label>
              <select
                id="tier"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as MembershipTier | "all")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tierOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MemberStatus | "all")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Committee Filter */}
            <div>
              <label htmlFor="committee" className="block text-sm font-medium text-gray-700 mb-1">
                Committee
              </label>
              <select
                id="committee"
                value={committeeFilter}
                onChange={(e) => setCommitteeFilter(e.target.value as Committee | "all")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {committeeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                disabled={!hasFilters}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  hasFilters
                    ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                    : "text-gray-400 bg-gray-50 cursor-not-allowed"
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredMembers.length} of {members.length} members
            {selectedIds.size > 0 && (
              <span className="ml-2 text-blue-600">
                ({selectedIds.size} selected)
              </span>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Bulk Actions ({selectedIds.size})
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showBulkMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={handleBulkEmail}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email Selected
                  </button>
                  <button
                    onClick={handleExportSelected}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export Selected
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Committee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={`hover:bg-gray-50 ${selectedIds.has(member.id) ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => handleSelectOne(member.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {member.memberId}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {getTierLabel(member.tier)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {getCommitteeLabel(member.committee)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {member.tier === "lifetime" || member.tier === "honorary"
                        ? "Never"
                        : formatClubDate(new Date(member.expirationDate))}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/members/${member.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {members.filter((m) => m.status === "active").length}
            </div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {members.filter((m) => m.status === "expired").length}
            </div>
            <div className="text-sm text-gray-500">Expired</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {members.filter((m) => m.status === "pending").length}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {members.length}
            </div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
