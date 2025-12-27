/**
 * Secretary Demo Dashboard
 *
 * Interactive walkthrough showing the secretary workflow:
 * 1. Pending minutes for approval
 * 2. Recent board motions
 * 3. Document archive (bylaws, policies)
 * 4. Upcoming board meeting agenda
 * 5. Attendance tracking
 *
 * Charter: P3 (state machine), P7 (observability)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState } from "react";
import { formatClubDateTime, formatClubDate } from "@/lib/timezone";

// ============================================================================
// TYPES
// ============================================================================

type MinutesStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "PUBLISHED";

type Minutes = {
  id: string;
  meetingType: "BOARD" | "EXECUTIVE" | "ANNUAL";
  meetingDate: Date;
  status: MinutesStatus;
  submittedBy: string;
  submittedAt: Date | null;
};

type Motion = {
  id: string;
  motionNumber: string;
  motionText: string;
  result: "PASSED" | "FAILED" | "TABLED" | "WITHDRAWN";
  meetingDate: Date;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
};

type Document = {
  id: string;
  title: string;
  category: "BYLAWS" | "POLICY" | "PROCEDURE" | "FORM";
  lastUpdated: Date;
  version: string;
};

type AgendaItem = {
  id: string;
  order: number;
  title: string;
  presenter: string;
  duration: number; // minutes
  type: "REPORT" | "DISCUSSION" | "ACTION" | "INFORMATION";
};

type AttendanceRecord = {
  id: string;
  memberName: string;
  role: string;
  meetingsAttended: number;
  meetingsTotal: number;
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_MINUTES: Minutes[] = [
  {
    id: "min-1",
    meetingType: "BOARD",
    meetingDate: new Date("2025-01-15T10:00:00"),
    status: "SUBMITTED",
    submittedBy: "Jane Smith",
    submittedAt: new Date("2025-01-16T14:30:00"),
  },
  {
    id: "min-2",
    meetingType: "EXECUTIVE",
    meetingDate: new Date("2025-01-08T09:00:00"),
    status: "APPROVED",
    submittedBy: "Jane Smith",
    submittedAt: new Date("2025-01-09T11:00:00"),
  },
  {
    id: "min-3",
    meetingType: "BOARD",
    meetingDate: new Date("2024-12-18T10:00:00"),
    status: "PUBLISHED",
    submittedBy: "Jane Smith",
    submittedAt: new Date("2024-12-19T10:00:00"),
  },
  {
    id: "min-4",
    meetingType: "ANNUAL",
    meetingDate: new Date("2024-11-15T13:00:00"),
    status: "PUBLISHED",
    submittedBy: "Jane Smith",
    submittedAt: new Date("2024-11-16T15:00:00"),
  },
];

const MOCK_MOTIONS: Motion[] = [
  {
    id: "mot-1",
    motionNumber: "2025-001",
    motionText: "Approve 2025 operating budget of $45,000",
    result: "PASSED",
    meetingDate: new Date("2025-01-15T10:00:00"),
    votesFor: 8,
    votesAgainst: 1,
    abstentions: 0,
  },
  {
    id: "mot-2",
    motionNumber: "2025-002",
    motionText: "Increase guest fee from $5 to $10 effective March 1",
    result: "PASSED",
    meetingDate: new Date("2025-01-15T10:00:00"),
    votesFor: 7,
    votesAgainst: 2,
    abstentions: 0,
  },
  {
    id: "mot-3",
    motionNumber: "2024-042",
    motionText: "Table discussion on bylaws amendment until February meeting",
    result: "TABLED",
    meetingDate: new Date("2024-12-18T10:00:00"),
    votesFor: 6,
    votesAgainst: 3,
    abstentions: 0,
  },
];

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc-1",
    title: "SBNC Bylaws",
    category: "BYLAWS",
    lastUpdated: new Date("2024-06-15"),
    version: "2024.2",
  },
  {
    id: "doc-2",
    title: "Financial Policy",
    category: "POLICY",
    lastUpdated: new Date("2024-09-01"),
    version: "3.1",
  },
  {
    id: "doc-3",
    title: "Event Chair Guidelines",
    category: "PROCEDURE",
    lastUpdated: new Date("2024-11-15"),
    version: "2.0",
  },
  {
    id: "doc-4",
    title: "Membership Application",
    category: "FORM",
    lastUpdated: new Date("2025-01-01"),
    version: "2025.1",
  },
  {
    id: "doc-5",
    title: "Privacy Policy",
    category: "POLICY",
    lastUpdated: new Date("2024-03-01"),
    version: "1.2",
  },
];

const MOCK_AGENDA: AgendaItem[] = [
  { id: "ag-1", order: 1, title: "Call to Order", presenter: "President", duration: 2, type: "INFORMATION" },
  { id: "ag-2", order: 2, title: "Approval of Minutes", presenter: "Secretary", duration: 5, type: "ACTION" },
  { id: "ag-3", order: 3, title: "Treasurer's Report", presenter: "Treasurer", duration: 10, type: "REPORT" },
  { id: "ag-4", order: 4, title: "Membership Update", presenter: "VP Membership", duration: 10, type: "REPORT" },
  { id: "ag-5", order: 5, title: "Upcoming Events Review", presenter: "VP Activities", duration: 15, type: "DISCUSSION" },
  { id: "ag-6", order: 6, title: "Bylaws Amendment Vote", presenter: "President", duration: 20, type: "ACTION" },
  { id: "ag-7", order: 7, title: "New Business", presenter: "All", duration: 15, type: "DISCUSSION" },
  { id: "ag-8", order: 8, title: "Adjournment", presenter: "President", duration: 2, type: "ACTION" },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: "att-1", memberName: "Mary Johnson", role: "President", meetingsAttended: 12, meetingsTotal: 12 },
  { id: "att-2", memberName: "Robert Smith", role: "VP Activities", meetingsAttended: 11, meetingsTotal: 12 },
  { id: "att-3", memberName: "Jane Doe", role: "Treasurer", meetingsAttended: 12, meetingsTotal: 12 },
  { id: "att-4", memberName: "Michael Brown", role: "Secretary", meetingsAttended: 10, meetingsTotal: 12 },
  { id: "att-5", memberName: "Susan Wilson", role: "VP Membership", meetingsAttended: 9, meetingsTotal: 12 },
  { id: "att-6", memberName: "David Lee", role: "Director", meetingsAttended: 8, meetingsTotal: 12 },
  { id: "att-7", memberName: "Patricia Garcia", role: "Director", meetingsAttended: 11, meetingsTotal: 12 },
  { id: "att-8", memberName: "James Martinez", role: "Director", meetingsAttended: 7, meetingsTotal: 12 },
];

// ============================================================================
// UTILITIES
// ============================================================================

function getMinutesStatusColor(status: MinutesStatus): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "SUBMITTED":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-blue-100 text-blue-800";
    case "PUBLISHED":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getMotionResultColor(result: Motion["result"]): string {
  switch (result) {
    case "PASSED":
      return "bg-green-100 text-green-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "TABLED":
      return "bg-yellow-100 text-yellow-800";
    case "WITHDRAWN":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getDocumentCategoryColor(category: Document["category"]): string {
  switch (category) {
    case "BYLAWS":
      return "bg-purple-100 text-purple-800";
    case "POLICY":
      return "bg-blue-100 text-blue-800";
    case "PROCEDURE":
      return "bg-teal-100 text-teal-800";
    case "FORM":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getAgendaTypeColor(type: AgendaItem["type"]): string {
  switch (type) {
    case "ACTION":
      return "bg-red-100 text-red-800";
    case "DISCUSSION":
      return "bg-blue-100 text-blue-800";
    case "REPORT":
      return "bg-green-100 text-green-800";
    case "INFORMATION":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getAttendanceColor(rate: number): string {
  if (rate >= 0.9) return "text-green-600";
  if (rate >= 0.75) return "text-yellow-600";
  return "text-red-600";
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SecretaryDemoDashboard() {
  const [activeTab, setActiveTab] = useState<"minutes" | "motions" | "documents" | "agenda" | "attendance">("minutes");
  const [actionLog, setActionLog] = useState<string[]>([]);

  const logAction = (action: string) => {
    const timestamp = formatClubDateTime(new Date());
    setActionLog((prev) => [`[${timestamp}] ${action}`, ...prev.slice(0, 9)]);
  };

  const handleApproveMinutes = (minutes: Minutes) => {
    logAction(`Approved ${minutes.meetingType} meeting minutes from ${formatClubDate(minutes.meetingDate)}`);
  };

  const handlePublishMinutes = (minutes: Minutes) => {
    logAction(`Published ${minutes.meetingType} meeting minutes to member portal`);
  };

  const handleDownloadDocument = (doc: Document) => {
    logAction(`Downloaded "${doc.title}" v${doc.version}`);
  };

  const pendingMinutes = MOCK_MINUTES.filter((m) => m.status === "SUBMITTED");
  const totalAgendaDuration = MOCK_AGENDA.reduce((sum, item) => sum + item.duration, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold">Secretary Dashboard</h2>
        <p className="mt-1 text-indigo-100">
          Manage minutes, motions, documents, and board meeting records
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingMinutes.length}</p>
          <p className="text-sm text-gray-500">Pending Approval</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{MOCK_MOTIONS.length}</p>
          <p className="text-sm text-gray-500">Recent Motions</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{MOCK_DOCUMENTS.length}</p>
          <p className="text-sm text-gray-500">Documents</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalAgendaDuration}m</p>
          <p className="text-sm text-gray-500">Next Meeting</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-4">
          {(["minutes", "motions", "documents", "agenda", "attendance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "minutes" && pendingMinutes.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {pendingMinutes.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border p-6">
        {/* Minutes Tab */}
        {activeTab === "minutes" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Meeting Minutes</h3>
            {MOCK_MINUTES.map((minutes) => (
              <div
                key={minutes.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{minutes.meetingType} Meeting</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getMinutesStatusColor(minutes.status)}`}>
                      {minutes.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatClubDate(minutes.meetingDate)} • Submitted by {minutes.submittedBy}
                  </p>
                </div>
                <div className="flex gap-2">
                  {minutes.status === "SUBMITTED" && (
                    <button
                      onClick={() => handleApproveMinutes(minutes)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Approve
                    </button>
                  )}
                  {minutes.status === "APPROVED" && (
                    <button
                      onClick={() => handlePublishMinutes(minutes)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                  <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Motions Tab */}
        {activeTab === "motions" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Board Motions</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">Motion #</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Vote</th>
                  <th className="pb-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_MOTIONS.map((motion) => (
                  <tr key={motion.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-sm">{motion.motionNumber}</td>
                    <td className="py-3 text-sm">{motion.motionText}</td>
                    <td className="py-3 text-sm text-gray-500">{formatClubDate(motion.meetingDate)}</td>
                    <td className="py-3 text-sm">
                      <span className="text-green-600">{motion.votesFor}</span>
                      {" / "}
                      <span className="text-red-600">{motion.votesAgainst}</span>
                      {motion.abstentions > 0 && (
                        <span className="text-gray-400"> ({motion.abstentions})</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getMotionResultColor(motion.result)}`}>
                        {motion.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Archive</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.title}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getDocumentCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      v{doc.version} • Updated {formatClubDate(doc.lastUpdated)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agenda Tab */}
        {activeTab === "agenda" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Next Board Meeting Agenda</h3>
              <span className="text-sm text-gray-500">
                February 19, 2025 at 10:00 AM • Total: {totalAgendaDuration} minutes
              </span>
            </div>
            <div className="space-y-2">
              {MOCK_AGENDA.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium">
                    {item.order}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getAgendaTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.presenter} • {item.duration} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Board Attendance (2024)</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Attended</th>
                  <th className="pb-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ATTENDANCE.map((record) => {
                  const rate = record.meetingsAttended / record.meetingsTotal;
                  return (
                    <tr key={record.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{record.memberName}</td>
                      <td className="py-3 text-sm text-gray-500">{record.role}</td>
                      <td className="py-3 text-sm">
                        {record.meetingsAttended} / {record.meetingsTotal}
                      </td>
                      <td className={`py-3 text-sm font-medium ${getAttendanceColor(rate)}`}>
                        {Math.round(rate * 100)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Log */}
      {actionLog.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Action Log</h3>
          <div className="space-y-1 font-mono text-xs">
            {actionLog.map((log, i) => (
              <p key={i} className="text-green-400">{log}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
