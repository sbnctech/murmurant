'use client';

import React from 'react';

interface StatusItemProps {
  label: string;
  current: number;
  total: number;
  complete?: boolean;
}

function StatusItem({ label, current, total, complete }: StatusItemProps) {
  const isComplete = complete ?? current >= total;
  const icon = isComplete ? '✅' : '🔄';
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-700">{label}</span>
      <span className="font-mono">
        {icon} {current}/{total} imported
      </span>
    </div>
  );
}

interface CheckItemProps {
  label: string;
  checked: boolean;
}

function CheckItem({ label, checked }: CheckItemProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span>{checked ? '✅' : '⬜'}</span>
      <span className={checked ? 'text-gray-700' : 'text-gray-500'}>{label}</span>
    </div>
  );
}

function VerificationItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span>✅</span>
      <span className="text-gray-700">{label}</span>
    </div>
  );
}

function SafetyItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span>🛡️</span>
      <span className="text-gray-600">{text}</span>
    </div>
  );
}

function ImprovementItem({ label, description }: { label: string; description: string }) {
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span>⬆️</span>
        <span className="font-medium text-gray-800">{label}</span>
      </div>
      <div className="ml-6 text-sm text-gray-600">{description}</div>
    </div>
  );
}

export function TransitionDashboard() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Transition Status Dashboard
        </h1>
        <p className="text-gray-600">
          Here&apos;s where you are in the transition from Wild Apricot to ClubOS
        </p>
      </div>

      {/* Data Migration Status */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> Data Migration Status
        </h2>
        <div className="space-y-1">
          <StatusItem label="Members" current={342} total={342} />
          <StatusItem label="Events" current={156} total={156} />
          <StatusItem label="Registrations" current={2847} total={2847} />
          <StatusItem label="Files" current={89} total={120} />
        </div>
      </section>

      {/* Parity Verification */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Parity Verification
        </h2>
        <div className="space-y-1">
          <VerificationItem label="Member counts match" />
          <VerificationItem label="Event counts match" />
          <VerificationItem label="Financial totals match" />
        </div>
      </section>

      {/* Rollback Safety */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔒</span> Rollback Safety
        </h2>
        <div className="space-y-1">
          <SafetyItem text="Nothing deleted from Wild Apricot" />
          <SafetyItem text="Can run both systems in parallel" />
          <SafetyItem text="One-click rollback available" />
        </div>
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>Zero risk:</strong> Your Wild Apricot data remains untouched.
            You can switch back at any time.
          </p>
        </div>
      </section>

      {/* What's Different (Better) */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>✨</span> What&apos;s Different (Better)
        </h2>
        <div className="space-y-1">
          <ImprovementItem
            label="Approval workflow"
            description="Simplified - fewer clicks, clearer status"
          />
          <ImprovementItem
            label="Email clarity"
            description="Enhanced - members know exactly what action to take"
          />
          <ImprovementItem
            label="Audit trail"
            description="Complete - full history of every approval decision"
          />
        </div>
      </section>

      {/* Go-Live Checklist */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🚀</span> Go-Live Checklist
        </h2>
        <div className="space-y-1">
          <CheckItem label="Officer training complete" checked={false} />
          <CheckItem label="DNS cutover scheduled" checked={false} />
          <CheckItem label="Email forwarding configured" checked={false} />
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Complete these items before the scheduled go-live date.
          </p>
        </div>
      </section>
    </div>
  );
}
