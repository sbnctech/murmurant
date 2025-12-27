"use client";

import React from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface WorkflowStep {
  step: number;
  description: string;
  timeMinutes?: number;
}

interface WorkflowComparison {
  id: string;
  title: string;
  waSteps: WorkflowStep[];
  clubosSteps: WorkflowStep[];
  notes?: string;
}

// -----------------------------------------------------------------------------
// Workflow Data
// -----------------------------------------------------------------------------

const workflows: WorkflowComparison[] = [
  {
    id: "event-creation",
    title: "Create and Publish an Event",
    waSteps: [
      { step: 1, description: "Log into Wild Apricot admin", timeMinutes: 1 },
      { step: 2, description: "Navigate to Events module", timeMinutes: 1 },
      { step: 3, description: "Click 'Add event'", timeMinutes: 0.5 },
      { step: 4, description: "Fill in basic event details", timeMinutes: 5 },
      { step: 5, description: "Configure registration types", timeMinutes: 3 },
      { step: 6, description: "Set up member/non-member pricing", timeMinutes: 2 },
      { step: 7, description: "Configure registration limits", timeMinutes: 2 },
      { step: 8, description: "Add event description HTML", timeMinutes: 5 },
      { step: 9, description: "Upload event image", timeMinutes: 2 },
      { step: 10, description: "Save as draft", timeMinutes: 0.5 },
      { step: 11, description: "Email VP Activities for approval", timeMinutes: 3 },
      { step: 12, description: "Wait for email response", timeMinutes: 60 },
      { step: 13, description: "Return to WA to publish", timeMinutes: 2 },
    ],
    clubosSteps: [
      { step: 1, description: "Open event creation form", timeMinutes: 0.5 },
      { step: 2, description: "Fill in event details", timeMinutes: 5 },
      { step: 3, description: "Configure registration and pricing", timeMinutes: 3 },
      { step: 4, description: "Submit for approval", timeMinutes: 0.5 },
      { step: 5, description: "VP notified automatically, approves in-app", timeMinutes: 5 },
      { step: 6, description: "Event publishes automatically", timeMinutes: 0 },
    ],
    notes: "ClubOS eliminates email-based approval workflow and manual publishing",
  },
  {
    id: "member-application",
    title: "Process New Member Application",
    waSteps: [
      { step: 1, description: "Receive email notification of application", timeMinutes: 1 },
      { step: 2, description: "Log into Wild Apricot", timeMinutes: 1 },
      { step: 3, description: "Navigate to pending members", timeMinutes: 1 },
      { step: 4, description: "Review application details", timeMinutes: 2 },
      { step: 5, description: "Check payment status separately", timeMinutes: 2 },
      { step: 6, description: "Approve membership manually", timeMinutes: 1 },
      { step: 7, description: "Send welcome email manually", timeMinutes: 3 },
      { step: 8, description: "Add to interest groups manually", timeMinutes: 5 },
    ],
    clubosSteps: [
      { step: 1, description: "View pending application in dashboard", timeMinutes: 0.5 },
      { step: 2, description: "Review details (payment status visible)", timeMinutes: 1 },
      { step: 3, description: "Approve with one click", timeMinutes: 0.5 },
      { step: 4, description: "Welcome email sent automatically", timeMinutes: 0 },
    ],
    notes: "Payment verification integrated, welcome emails automated",
  },
  {
    id: "event-registration",
    title: "Register Member for Event",
    waSteps: [
      { step: 1, description: "Member navigates to event page", timeMinutes: 1 },
      { step: 2, description: "Click register button", timeMinutes: 0.5 },
      { step: 3, description: "Log in if session expired", timeMinutes: 1 },
      { step: 4, description: "Select registration type", timeMinutes: 0.5 },
      { step: 5, description: "Fill in guest details if applicable", timeMinutes: 2 },
      { step: 6, description: "Enter payment information", timeMinutes: 2 },
      { step: 7, description: "Submit and wait for confirmation", timeMinutes: 1 },
      { step: 8, description: "Receive confirmation email", timeMinutes: 1 },
    ],
    clubosSteps: [
      { step: 1, description: "View event in calendar", timeMinutes: 0.5 },
      { step: 2, description: "Click 'Register' (already logged in)", timeMinutes: 0.5 },
      { step: 3, description: "Add guests if needed", timeMinutes: 1 },
      { step: 4, description: "Confirm (payment on file)", timeMinutes: 0.5 },
    ],
    notes: "Passkey auth eliminates re-login, saved payment methods",
  },
  {
    id: "postmortem-report",
    title: "Submit Event Postmortem",
    waSteps: [
      { step: 1, description: "Open spreadsheet template", timeMinutes: 1 },
      { step: 2, description: "Manually count attendees from WA", timeMinutes: 5 },
      { step: 3, description: "Calculate revenue from reports", timeMinutes: 5 },
      { step: 4, description: "Fill in postmortem details", timeMinutes: 10 },
      { step: 5, description: "Export to PDF", timeMinutes: 2 },
      { step: 6, description: "Email to VP Activities", timeMinutes: 2 },
      { step: 7, description: "VP reviews and responds via email", timeMinutes: 30 },
      { step: 8, description: "File in shared drive", timeMinutes: 2 },
    ],
    clubosSteps: [
      { step: 1, description: "Open postmortem form (pre-filled stats)", timeMinutes: 0.5 },
      { step: 2, description: "Add notes and learnings", timeMinutes: 5 },
      { step: 3, description: "Submit for review", timeMinutes: 0.5 },
      { step: 4, description: "VP approves in-app", timeMinutes: 2 },
    ],
    notes: "Attendance and revenue auto-calculated from registration data",
  },
  {
    id: "renewal-reminder",
    title: "Send Membership Renewal Reminders",
    waSteps: [
      { step: 1, description: "Run expiring members report", timeMinutes: 3 },
      { step: 2, description: "Export to spreadsheet", timeMinutes: 2 },
      { step: 3, description: "Filter by expiration date range", timeMinutes: 2 },
      { step: 4, description: "Compose reminder email", timeMinutes: 5 },
      { step: 5, description: "Send to filtered list", timeMinutes: 3 },
      { step: 6, description: "Track who renewed manually", timeMinutes: 10 },
      { step: 7, description: "Send follow-up to non-renewers", timeMinutes: 5 },
    ],
    clubosSteps: [
      { step: 1, description: "View expiring members dashboard", timeMinutes: 0.5 },
      { step: 2, description: "Automated reminders already sent", timeMinutes: 0 },
      { step: 3, description: "Review renewal status in real-time", timeMinutes: 1 },
    ],
    notes: "Automated renewal reminders with configurable schedule",
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function calculateTotalTime(steps: WorkflowStep[]): number {
  return steps.reduce((sum, step) => sum + (step.timeMinutes ?? 0), 0);
}

function calculateTimeSavings(waMinutes: number, clubosMinutes: number): number {
  if (waMinutes === 0) return 0;
  return Math.round(((waMinutes - clubosMinutes) / waMinutes) * 100);
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

// -----------------------------------------------------------------------------
// Step Badge Component
// -----------------------------------------------------------------------------

function StepBadge({ count, variant }: { count: number; variant: "wa" | "clubos" }) {
  const colors =
    variant === "wa"
      ? "bg-orange-100 text-orange-800 border-orange-200"
      : "bg-green-100 text-green-800 border-green-200";

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors}`}>
      {count} step{count !== 1 ? "s" : ""}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Time Savings Badge
// -----------------------------------------------------------------------------

function TimeSavingsBadge({ percentage }: { percentage: number }) {
  let colors = "bg-gray-100 text-gray-800";
  if (percentage >= 80) {
    colors = "bg-green-100 text-green-800";
  } else if (percentage >= 50) {
    colors = "bg-blue-100 text-blue-800";
  } else if (percentage >= 25) {
    colors = "bg-yellow-100 text-yellow-800";
  }

  return (
    <span className={`px-2 py-1 text-xs font-bold rounded ${colors}`}>{percentage}% faster</span>
  );
}

// -----------------------------------------------------------------------------
// Workflow Card Component
// -----------------------------------------------------------------------------

function WorkflowCard({ workflow }: { workflow: WorkflowComparison }) {
  const waTime = calculateTotalTime(workflow.waSteps);
  const clubosTime = calculateTotalTime(workflow.clubosSteps);
  const savings = calculateTimeSavings(waTime, clubosTime);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{workflow.title}</h3>
          <TimeSavingsBadge percentage={savings} />
        </div>
        {workflow.notes && <p className="text-sm text-gray-500 mt-1">{workflow.notes}</p>}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Wild Apricot Column */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-orange-700">Wild Apricot</span>
            <div className="flex items-center gap-2">
              <StepBadge count={workflow.waSteps.length} variant="wa" />
              <span className="text-xs text-gray-500">{formatTime(waTime)}</span>
            </div>
          </div>
          <ol className="space-y-2">
            {workflow.waSteps.map((step) => (
              <li key={step.step} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 w-5 h-5 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center justify-center font-medium">
                  {step.step}
                </span>
                <span className="text-gray-600">{step.description}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ClubOS Column */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-green-700">ClubOS</span>
            <div className="flex items-center gap-2">
              <StepBadge count={workflow.clubosSteps.length} variant="clubos" />
              <span className="text-xs text-gray-500">{formatTime(clubosTime)}</span>
            </div>
          </div>
          <ol className="space-y-2">
            {workflow.clubosSteps.map((step) => (
              <li key={step.step} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-medium">
                  {step.step}
                </span>
                <span className="text-gray-600">{step.description}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Summary Stats
// -----------------------------------------------------------------------------

function SummaryStats() {
  const totalWaSteps = workflows.reduce((sum, w) => sum + w.waSteps.length, 0);
  const totalClubosSteps = workflows.reduce((sum, w) => sum + w.clubosSteps.length, 0);
  const totalWaTime = workflows.reduce((sum, w) => sum + calculateTotalTime(w.waSteps), 0);
  const totalClubosTime = workflows.reduce((sum, w) => sum + calculateTotalTime(w.clubosSteps), 0);
  const avgSavings = calculateTimeSavings(totalWaTime, totalClubosTime);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Total WA Steps</div>
        <div className="text-2xl font-bold text-orange-600">{totalWaSteps}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Total ClubOS Steps</div>
        <div className="text-2xl font-bold text-green-600">{totalClubosSteps}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Steps Eliminated</div>
        <div className="text-2xl font-bold text-blue-600">{totalWaSteps - totalClubosSteps}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Avg Time Savings</div>
        <div className="text-2xl font-bold text-green-600">{avgSavings}%</div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function WorkflowComparisonSection() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Workflow Comparison</h2>
        <p className="text-gray-500 mt-1">
          Side-by-side comparison of Wild Apricot vs ClubOS workflows
        </p>
      </div>

      <SummaryStats />

      <div className="space-y-6">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>
    </div>
  );
}
