// Copyright (c) Santa Barbara Newcomers Club
// Governance page - board members, meetings, motions, and policies

"use client";

import React from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BoardMember {
  id: string;
  name: string;
  title: string;
  email: string;
  photoUrl?: string;
  termEnds: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  minutesUrl?: string;
}

interface Motion {
  id: string;
  title: string;
  proposedBy: string;
  proposedDate: string;
  status: "pending" | "discussion" | "vote_scheduled" | "passed" | "rejected";
  summary: string;
}

interface PolicyDocument {
  id: string;
  name: string;
  category: string;
  lastUpdated: string;
  url: string;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const boardMembers: BoardMember[] = [
  {
    id: "1",
    name: "Catherine Reynolds",
    title: "President",
    email: "president@sbnewcomers.org",
    termEnds: "2025-06-30",
  },
  {
    id: "2",
    name: "James Mitchell",
    title: "Vice President",
    email: "vp@sbnewcomers.org",
    termEnds: "2025-06-30",
  },
  {
    id: "3",
    name: "Elizabeth Chen",
    title: "Secretary",
    email: "secretary@sbnewcomers.org",
    termEnds: "2025-06-30",
  },
  {
    id: "4",
    name: "Robert Garcia",
    title: "Treasurer",
    email: "treasurer@sbnewcomers.org",
    termEnds: "2025-06-30",
  },
  {
    id: "5",
    name: "Patricia Anderson",
    title: "VP Activities",
    email: "activities@sbnewcomers.org",
    termEnds: "2026-06-30",
  },
  {
    id: "6",
    name: "Michael Thompson",
    title: "VP Membership",
    email: "membership@sbnewcomers.org",
    termEnds: "2026-06-30",
  },
  {
    id: "7",
    name: "Susan Williams",
    title: "Parliamentarian",
    email: "parliamentarian@sbnewcomers.org",
    termEnds: "2025-06-30",
  },
];

const upcomingMeetings: Meeting[] = [
  {
    id: "1",
    title: "Board Meeting - January",
    date: "2025-01-15",
    time: "10:00 AM",
    location: "Community Room A",
  },
  {
    id: "2",
    title: "Board Meeting - February",
    date: "2025-02-19",
    time: "10:00 AM",
    location: "Community Room A",
  },
  {
    id: "3",
    title: "Annual Meeting",
    date: "2025-06-21",
    time: "11:00 AM",
    location: "Main Ballroom",
  },
];

const recentMeetings: Meeting[] = [
  {
    id: "10",
    title: "Board Meeting - December",
    date: "2024-12-18",
    time: "10:00 AM",
    location: "Community Room A",
    minutesUrl: "/documents/minutes-2024-12.pdf",
  },
  {
    id: "11",
    title: "Board Meeting - November",
    date: "2024-11-20",
    time: "10:00 AM",
    location: "Community Room A",
    minutesUrl: "/documents/minutes-2024-11.pdf",
  },
  {
    id: "12",
    title: "Board Meeting - October",
    date: "2024-10-16",
    time: "10:00 AM",
    location: "Community Room A",
    minutesUrl: "/documents/minutes-2024-10.pdf",
  },
];

const activeMotions: Motion[] = [
  {
    id: "1",
    title: "Increase Annual Dues by $10",
    proposedBy: "Finance Committee",
    proposedDate: "2024-12-18",
    status: "discussion",
    summary:
      "Proposal to increase annual membership dues from $50 to $60 to cover rising venue costs.",
  },
  {
    id: "2",
    title: "Add Youth Membership Category",
    proposedBy: "Membership Committee",
    proposedDate: "2024-12-18",
    status: "pending",
    summary:
      "Create a new membership category for members aged 18-30 with reduced dues.",
  },
  {
    id: "3",
    title: "Amend Standing Rules - Event Cancellation Policy",
    proposedBy: "Activities Committee",
    proposedDate: "2024-11-20",
    status: "vote_scheduled",
    summary:
      "Clarify the refund policy when events are cancelled less than 48 hours before start.",
  },
];

const policyDocuments: PolicyDocument[] = [
  {
    id: "1",
    name: "Club Bylaws",
    category: "Governance",
    lastUpdated: "2024-06-15",
    url: "/documents/bylaws.pdf",
  },
  {
    id: "2",
    name: "Standing Rules",
    category: "Governance",
    lastUpdated: "2024-09-20",
    url: "/documents/standing-rules.pdf",
  },
  {
    id: "3",
    name: "Privacy Policy",
    category: "Policies",
    lastUpdated: "2024-01-10",
    url: "/documents/privacy-policy.pdf",
  },
  {
    id: "4",
    name: "Code of Conduct",
    category: "Policies",
    lastUpdated: "2024-03-05",
    url: "/documents/code-of-conduct.pdf",
  },
  {
    id: "5",
    name: "Financial Policies",
    category: "Policies",
    lastUpdated: "2024-07-12",
    url: "/documents/financial-policies.pdf",
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getStatusBadge(status: Motion["status"]) {
  const styles: Record<Motion["status"], { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Pending Review" },
    discussion: { bg: "bg-blue-100", text: "text-blue-700", label: "Under Discussion" },
    vote_scheduled: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Vote Scheduled" },
    passed: { bg: "bg-green-100", text: "text-green-700", label: "Passed" },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
  };
  const style = styles[status];
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Board Members Section
// -----------------------------------------------------------------------------

function BoardMembersSection() {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Board of Directors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boardMembers.map((member) => (
          <div
            key={member.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-blue-600">{member.title}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <a href={`mailto:${member.email}`} className="hover:underline">
                {member.email}
              </a>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Term ends: {formatClubDate(new Date(member.termEnds))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Meetings Section
// -----------------------------------------------------------------------------

function MeetingsSection() {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Board Meetings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Upcoming</h3>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">{meeting.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {formatClubDate(new Date(meeting.date))} at {meeting.time}
                </div>
                <div className="text-sm text-gray-500">{meeting.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Minutes */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Minutes</h3>
          <div className="space-y-3">
            {recentMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-gray-900">{meeting.title}</div>
                  <div className="text-sm text-gray-500">
                    {formatClubDate(new Date(meeting.date))}
                  </div>
                </div>
                {meeting.minutesUrl && (
                  <Link
                    href={meeting.minutesUrl}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
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
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Motions Section
// -----------------------------------------------------------------------------

function MotionsSection() {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Active Motions & Proposals</h2>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
          Propose a Motion
        </button>
      </div>

      {activeMotions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No active motions at this time.</p>
      ) : (
        <div className="space-y-4">
          {activeMotions.map((motion) => (
            <div
              key={motion.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{motion.title}</h3>
                {getStatusBadge(motion.status)}
              </div>
              <p className="text-sm text-gray-600 mb-3">{motion.summary}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  Proposed by {motion.proposedBy} on{" "}
                  {formatClubDate(new Date(motion.proposedDate))}
                </span>
                <Link href={`/governance/motions/${motion.id}`} className="text-blue-600 hover:underline">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Policies Section
// -----------------------------------------------------------------------------

function PoliciesSection() {
  const groupedPolicies = policyDocuments.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<string, PolicyDocument[]>
  );

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Bylaws & Policies</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedPolicies).map(([category, docs]) => (
          <div key={category}>
            <h3 className="text-lg font-medium text-gray-800 mb-3">{category}</h3>
            <div className="space-y-2">
              {docs.map((doc) => (
                <Link
                  key={doc.id}
                  href={doc.url}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-900">{doc.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Updated {formatClubDate(new Date(doc.lastUpdated))}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function GovernancePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
          <p className="mt-1 text-gray-600">
            Board information, meeting schedules, and club policies
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <BoardMembersSection />
        <MeetingsSection />
        <MotionsSection />
        <PoliciesSection />
      </div>
    </main>
  );
}
