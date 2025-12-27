"use client";

import React from "react";
import { formatClubDate } from "@/lib/timezone";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface PendingApplication {
  id: string;
  name: string;
  email: string;
  appliedDate: string;
  tier: string;
  referredBy?: string;
}

interface ExpiringMember {
  id: string;
  name: string;
  email: string;
  tier: string;
  expiresDate: string;
  renewalReminders: number;
}

interface LapsedMember {
  id: string;
  name: string;
  email: string;
  tier: string;
  lapsedDate: string;
  yearsAsMember: number;
}

interface TierBreakdown {
  tier: string;
  count: number;
  color: string;
}

interface MonthlyStats {
  month: string;
  newMembers: number;
  renewals: number;
  lapsed: number;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const pendingApplications: PendingApplication[] = [
  {
    id: "app-1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    appliedDate: "2025-12-20",
    tier: "Individual",
    referredBy: "Jane Smith",
  },
  {
    id: "app-2",
    name: "Michael Chen",
    email: "m.chen@example.com",
    appliedDate: "2025-12-22",
    tier: "Household",
  },
  {
    id: "app-3",
    name: "Emily Rodriguez",
    email: "emily.r@example.com",
    appliedDate: "2025-12-24",
    tier: "Individual",
    referredBy: "Bob Wilson",
  },
];

const expiringMembers: ExpiringMember[] = [
  {
    id: "mem-1",
    name: "David Thompson",
    email: "david.t@example.com",
    tier: "Household",
    expiresDate: "2025-12-31",
    renewalReminders: 2,
  },
  {
    id: "mem-2",
    name: "Lisa Anderson",
    email: "lisa.a@example.com",
    tier: "Individual",
    expiresDate: "2026-01-05",
    renewalReminders: 1,
  },
  {
    id: "mem-3",
    name: "Robert Martinez",
    email: "robert.m@example.com",
    tier: "Household",
    expiresDate: "2026-01-10",
    renewalReminders: 0,
  },
  {
    id: "mem-4",
    name: "Patricia Wilson",
    email: "patricia.w@example.com",
    tier: "Individual",
    expiresDate: "2026-01-15",
    renewalReminders: 1,
  },
];

const lapsedMembers: LapsedMember[] = [
  {
    id: "lapsed-1",
    name: "James Brown",
    email: "james.b@example.com",
    tier: "Individual",
    lapsedDate: "2025-11-15",
    yearsAsMember: 3,
  },
  {
    id: "lapsed-2",
    name: "Nancy Taylor",
    email: "nancy.t@example.com",
    tier: "Household",
    lapsedDate: "2025-11-28",
    yearsAsMember: 5,
  },
];

const tierBreakdown: TierBreakdown[] = [
  { tier: "Individual", count: 145, color: "#3b82f6" },
  { tier: "Household", count: 87, color: "#10b981" },
  { tier: "Life", count: 12, color: "#f59e0b" },
  { tier: "Honorary", count: 5, color: "#8b5cf6" },
];

const monthlyStats: MonthlyStats[] = [
  { month: "Oct 2025", newMembers: 12, renewals: 28, lapsed: 4 },
  { month: "Nov 2025", newMembers: 8, renewals: 35, lapsed: 6 },
  { month: "Dec 2025", newMembers: 15, renewals: 42, lapsed: 3 },
];

// -----------------------------------------------------------------------------
// Summary Stats Card
// -----------------------------------------------------------------------------

function SummaryStats() {
  const totalMembers = tierBreakdown.reduce((sum, t) => sum + t.count, 0);
  const pendingCount = pendingApplications.length;
  const expiringCount = expiringMembers.length;
  const lapsedCount = lapsedMembers.length;
  const lastMonthStats = monthlyStats[monthlyStats.length - 1];
  const netGrowth = lastMonthStats.newMembers - lastMonthStats.lapsed;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Total Members</div>
        <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Pending Applications</div>
        <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Expiring Soon</div>
        <div className="text-2xl font-bold text-amber-600">{expiringCount}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Recently Lapsed</div>
        <div className="text-2xl font-bold text-red-600">{lapsedCount}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Net Growth (Dec)</div>
        <div className={`text-2xl font-bold ${netGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
          {netGrowth >= 0 ? "+" : ""}
          {netGrowth}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Pending Applications Card
// -----------------------------------------------------------------------------

function PendingApplicationsCard() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Pending Applications</h3>
        <p className="text-sm text-gray-500">Applications awaiting review</p>
      </div>
      <div className="divide-y divide-gray-100">
        {pendingApplications.map((app) => (
          <div key={app.id} className="px-4 py-3 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{app.name}</div>
                <div className="text-sm text-gray-500">{app.email}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Applied {formatClubDate(new Date(app.appliedDate))}
                  {app.referredBy && ` • Referred by ${app.referredBy}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {app.tier}
                </span>
                <button className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700">
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {pendingApplications.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500">No pending applications</div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Expiring Members Card
// -----------------------------------------------------------------------------

function ExpiringMembersCard() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Expiring Memberships</h3>
        <p className="text-sm text-gray-500">Members expiring in the next 30 days</p>
      </div>
      <div className="divide-y divide-gray-100">
        {expiringMembers.map((member) => (
          <div key={member.id} className="px-4 py-3 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Expires {formatClubDate(new Date(member.expiresDate))} •{" "}
                  {member.renewalReminders} reminder{member.renewalReminders !== 1 ? "s" : ""} sent
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                  {member.tier}
                </span>
                <button className="px-3 py-1 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100">
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Lapsed Members Card
// -----------------------------------------------------------------------------

function LapsedMembersCard() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recently Lapsed</h3>
        <p className="text-sm text-gray-500">Members who lapsed in the last 60 days</p>
      </div>
      <div className="divide-y divide-gray-100">
        {lapsedMembers.map((member) => (
          <div key={member.id} className="px-4 py-3 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Lapsed {formatClubDate(new Date(member.lapsedDate))} • Was member for{" "}
                  {member.yearsAsMember} year{member.yearsAsMember !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                  {member.tier}
                </span>
                <button className="px-3 py-1 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100">
                  Reach Out
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {lapsedMembers.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500">No recently lapsed members</div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Tier Breakdown Chart
// -----------------------------------------------------------------------------

function TierBreakdownChart() {
  const total = tierBreakdown.reduce((sum, t) => sum + t.count, 0);
  const maxCount = Math.max(...tierBreakdown.map((t) => t.count));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Membership by Tier</h3>
        <p className="text-sm text-gray-500">Current distribution across tiers</p>
      </div>
      <div className="p-4 space-y-4">
        {tierBreakdown.map((tier) => {
          const percentage = ((tier.count / total) * 100).toFixed(1);
          const barWidth = (tier.count / maxCount) * 100;
          return (
            <div key={tier.tier}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{tier.tier}</span>
                <span className="text-gray-500">
                  {tier.count} ({percentage}%)
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${barWidth}%`, backgroundColor: tier.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Monthly Stats Card
// -----------------------------------------------------------------------------

function MonthlyStatsCard() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
        <p className="text-sm text-gray-500">New members vs renewals vs lapsed</p>
      </div>
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="pb-2">Month</th>
              <th className="pb-2 text-right">New</th>
              <th className="pb-2 text-right">Renewed</th>
              <th className="pb-2 text-right">Lapsed</th>
              <th className="pb-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {monthlyStats.map((stat) => {
              const net = stat.newMembers - stat.lapsed;
              return (
                <tr key={stat.month} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{stat.month}</td>
                  <td className="py-2 text-right text-green-600">+{stat.newMembers}</td>
                  <td className="py-2 text-right text-blue-600">{stat.renewals}</td>
                  <td className="py-2 text-right text-red-600">-{stat.lapsed}</td>
                  <td
                    className={`py-2 text-right font-medium ${net >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {net >= 0 ? "+" : ""}
                    {net}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Dashboard Component
// -----------------------------------------------------------------------------

export default function MembershipDashboard() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Membership Chair Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of membership health and pending actions</p>
      </div>

      <SummaryStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingApplicationsCard />
        <TierBreakdownChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiringMembersCard />
        <LapsedMembersCard />
      </div>

      <MonthlyStatsCard />
    </div>
  );
}
