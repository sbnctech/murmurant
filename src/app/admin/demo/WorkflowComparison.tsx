"use client";

/**
 * WorkflowComparison Component
 *
 * Visual side-by-side comparison of Wild Apricot vs ClubOS workflows.
 * Shows the dramatic reduction in steps and time for common tasks.
 *
 * Charter Principles:
 * - P6: Human-first UI language
 * - P4: No hidden rules (behavior explainable in plain English)
 */

import { useState } from "react";

interface WorkflowStep {
  action: string;
  timeSeconds?: number;
}

interface WorkflowComparison {
  id: string;
  title: string;
  description: string;
  waSteps: WorkflowStep[];
  clubosSteps: WorkflowStep[];
  waTimeMinutes: number;
  clubosTimeMinutes: number;
}

const WORKFLOW_COMPARISONS: WorkflowComparison[] = [
  {
    id: "approve-event",
    title: "Approve an Event",
    description: "Review and approve a submitted event for the calendar",
    waSteps: [
      { action: "Login to Wild Apricot", timeSeconds: 15 },
      { action: "Navigate to Events", timeSeconds: 5 },
      { action: "Find the event in list", timeSeconds: 20 },
      { action: "Click to open event", timeSeconds: 3 },
      { action: "Scroll to find status field", timeSeconds: 10 },
      { action: "Edit status dropdown", timeSeconds: 5 },
      { action: "Click Save", timeSeconds: 3 },
      { action: "Open email client", timeSeconds: 10 },
      { action: "Compose email to chair", timeSeconds: 60 },
      { action: "Send notification", timeSeconds: 5 },
    ],
    clubosSteps: [
      { action: "Click 'Approve' button", timeSeconds: 2 },
      { action: "Done (auto-notifies chair)", timeSeconds: 0 },
    ],
    waTimeMinutes: 2.5,
    clubosTimeMinutes: 0.1,
  },
  {
    id: "check-registrations",
    title: "Check Registration List",
    description: "View who's registered for an upcoming event",
    waSteps: [
      { action: "Navigate to Events", timeSeconds: 5 },
      { action: "Find the event", timeSeconds: 20 },
      { action: "Click to open", timeSeconds: 3 },
      { action: "Click Registrations tab", timeSeconds: 5 },
      { action: "Click Export button", timeSeconds: 3 },
      { action: "Wait for download", timeSeconds: 10 },
      { action: "Open Excel file", timeSeconds: 15 },
      { action: "Apply filters", timeSeconds: 30 },
    ],
    clubosSteps: [
      { action: "Click event card", timeSeconds: 2 },
      { action: "View live list with filters", timeSeconds: 3 },
    ],
    waTimeMinutes: 1.5,
    clubosTimeMinutes: 0.1,
  },
  {
    id: "member-history",
    title: "Find Member History",
    description: "See a member's complete activity and participation",
    waSteps: [
      { action: "Navigate to Contacts", timeSeconds: 5 },
      { action: "Search for member", timeSeconds: 15 },
      { action: "Click to open profile", timeSeconds: 3 },
      { action: "Check Profile tab", timeSeconds: 10 },
      { action: "Check Events tab", timeSeconds: 10 },
      { action: "Check Donations tab", timeSeconds: 10 },
      { action: "Check Invoices tab", timeSeconds: 10 },
      { action: "Mentally piece together timeline", timeSeconds: 60 },
    ],
    clubosSteps: [
      { action: "Search member name", timeSeconds: 5 },
      { action: "View unified timeline", timeSeconds: 3 },
    ],
    waTimeMinutes: 2,
    clubosTimeMinutes: 0.15,
  },
  {
    id: "send-event-reminder",
    title: "Send Event Reminder",
    description: "Remind registered members about an upcoming event",
    waSteps: [
      { action: "Navigate to Events", timeSeconds: 5 },
      { action: "Find event", timeSeconds: 20 },
      { action: "Export registrations", timeSeconds: 15 },
      { action: "Open email tool", timeSeconds: 10 },
      { action: "Create new email", timeSeconds: 5 },
      { action: "Import recipient list", timeSeconds: 20 },
      { action: "Compose message", timeSeconds: 120 },
      { action: "Send", timeSeconds: 5 },
    ],
    clubosSteps: [
      { action: "Click event", timeSeconds: 2 },
      { action: "Click 'Send Reminder'", timeSeconds: 2 },
      { action: "Confirm (uses template)", timeSeconds: 3 },
    ],
    waTimeMinutes: 3.5,
    clubosTimeMinutes: 0.15,
  },
  {
    id: "generate-report",
    title: "Generate Activity Report",
    description: "Create a monthly summary of club activities",
    waSteps: [
      { action: "Navigate to Reports", timeSeconds: 5 },
      { action: "Find relevant report type", timeSeconds: 30 },
      { action: "Configure date range", timeSeconds: 15 },
      { action: "Run report", timeSeconds: 20 },
      { action: "Export to Excel", timeSeconds: 10 },
      { action: "Open second report", timeSeconds: 30 },
      { action: "Export second report", timeSeconds: 10 },
      { action: "Manually combine in Excel", timeSeconds: 180 },
    ],
    clubosSteps: [
      { action: "Click 'Reports'", timeSeconds: 2 },
      { action: "Select 'Monthly Summary'", timeSeconds: 3 },
      { action: "View or download", timeSeconds: 5 },
    ],
    waTimeMinutes: 5,
    clubosTimeMinutes: 0.2,
  },
];

function StepBadge({ count, variant }: { count: number; variant: "wa" | "clubos" }) {
  const bgColor = variant === "wa" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {count} step{count !== 1 ? "s" : ""}
    </span>
  );
}

function TimeBadge({ minutes, variant }: { minutes: number; variant: "wa" | "clubos" }) {
  const bgColor = variant === "wa" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700";
  const timeStr = minutes >= 1 ? `${minutes} min` : `${Math.round(minutes * 60)}s`;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${bgColor}`}>
      {timeStr}
    </span>
  );
}

function SavingsBadge({ waTime, clubosTime }: { waTime: number; clubosTime: number }) {
  const savedPercent = Math.round(((waTime - clubosTime) / waTime) * 100);
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
      {savedPercent}% faster
    </span>
  );
}

function WorkflowCard({ comparison }: { comparison: WorkflowComparison }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{comparison.title}</h3>
            <p className="text-sm text-gray-600">{comparison.description}</p>
          </div>
          <SavingsBadge waTime={comparison.waTimeMinutes} clubosTime={comparison.clubosTimeMinutes} />
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 divide-x">
        {/* WA Column */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-orange-700">Wild Apricot</span>
            <div className="flex gap-2">
              <StepBadge count={comparison.waSteps.length} variant="wa" />
              <TimeBadge minutes={comparison.waTimeMinutes} variant="wa" />
            </div>
          </div>
          <ol className="space-y-1 text-sm text-gray-600">
            {comparison.waSteps.slice(0, expanded ? undefined : 4).map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-orange-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                <span>{step.action}</span>
              </li>
            ))}
            {!expanded && comparison.waSteps.length > 4 && (
              <li className="text-orange-500 text-xs">+{comparison.waSteps.length - 4} more steps...</li>
            )}
          </ol>
        </div>

        {/* ClubOS Column */}
        <div className="p-4 bg-green-50/30">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-green-700">ClubOS</span>
            <div className="flex gap-2">
              <StepBadge count={comparison.clubosSteps.length} variant="clubos" />
              <TimeBadge minutes={comparison.clubosTimeMinutes} variant="clubos" />
            </div>
          </div>
          <ol className="space-y-1 text-sm text-gray-700">
            {comparison.clubosSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 font-mono text-xs mt-0.5">{i + 1}.</span>
                <span className="font-medium">{step.action}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Expand/Collapse */}
      {comparison.waSteps.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t"
        >
          {expanded ? "Show less" : "Show all steps"}
        </button>
      )}
    </div>
  );
}

function SummaryStats() {
  const totalWaSteps = WORKFLOW_COMPARISONS.reduce((sum, c) => sum + c.waSteps.length, 0);
  const totalClubosSteps = WORKFLOW_COMPARISONS.reduce((sum, c) => sum + c.clubosSteps.length, 0);
  const totalWaTime = WORKFLOW_COMPARISONS.reduce((sum, c) => sum + c.waTimeMinutes, 0);
  const totalClubosTime = WORKFLOW_COMPARISONS.reduce((sum, c) => sum + c.clubosTimeMinutes, 0);

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg mb-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-700">{WORKFLOW_COMPARISONS.length}</div>
        <div className="text-sm text-blue-600">Common Workflows</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-green-700">
          {Math.round((1 - totalClubosSteps / totalWaSteps) * 100)}%
        </div>
        <div className="text-sm text-green-600">Fewer Steps</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-purple-700">
          {Math.round((1 - totalClubosTime / totalWaTime) * 100)}%
        </div>
        <div className="text-sm text-purple-600">Time Saved</div>
      </div>
    </div>
  );
}

export default function WorkflowComparison() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workflow Comparison</h2>
        <p className="text-gray-600 mt-1">
          See how ClubOS simplifies common tasks compared to Wild Apricot
        </p>
      </div>

      <SummaryStats />

      <div className="grid gap-6">
        {WORKFLOW_COMPARISONS.map((comparison) => (
          <WorkflowCard key={comparison.id} comparison={comparison} />
        ))}
      </div>
    </section>
  );
}
