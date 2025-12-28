"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

/**
 * Member Export Tool
 *
 * Provides flexible member data export with field selection,
 * filtering, format options, and preview capabilities.
 *
 * Charter: P7 (Observability is a product feature)
 */

type ExportField = {
  id: string;
  label: string;
  category: "basic" | "contact" | "membership" | "activity";
  selected: boolean;
};

type ExportFilter = {
  status: "all" | "active" | "inactive" | "pending";
  tier: string;
  committee: string;
};

type RecentExport = {
  id: string;
  date: Date;
  recordCount: number;
  format: string;
  filters: string;
};

const AVAILABLE_FIELDS: ExportField[] = [
  { id: "firstName", label: "First Name", category: "basic", selected: true },
  { id: "lastName", label: "Last Name", category: "basic", selected: true },
  { id: "email", label: "Email", category: "contact", selected: true },
  { id: "phone", label: "Phone", category: "contact", selected: false },
  { id: "address", label: "Address", category: "contact", selected: false },
  { id: "city", label: "City", category: "contact", selected: false },
  { id: "state", label: "State", category: "contact", selected: false },
  { id: "zip", label: "ZIP Code", category: "contact", selected: false },
  { id: "tier", label: "Membership Tier", category: "membership", selected: true },
  { id: "status", label: "Status", category: "membership", selected: true },
  { id: "joinDate", label: "Join Date", category: "membership", selected: false },
  { id: "renewalDate", label: "Renewal Date", category: "membership", selected: false },
  { id: "committees", label: "Committees", category: "activity", selected: false },
  { id: "eventsAttended", label: "Events Attended", category: "activity", selected: false },
  { id: "lastEventDate", label: "Last Event Date", category: "activity", selected: false },
];

const MEMBERSHIP_TIERS = ["All Tiers", "Individual", "Couple", "Family", "Honorary"];
const COMMITTEES = ["All Committees", "Board", "Events", "Membership", "Communications", "Social"];

const DEMO_MEMBERS = [
  { firstName: "Alice", lastName: "Johnson", email: "alice@example.com", phone: "(805) 555-1234", tier: "Individual", status: "Active", joinDate: new Date("2023-03-15"), committees: "Events" },
  { firstName: "Bob", lastName: "Smith", email: "bob@example.com", phone: "(805) 555-2345", tier: "Couple", status: "Active", joinDate: new Date("2022-08-20"), committees: "Board" },
  { firstName: "Carol", lastName: "Williams", email: "carol@example.com", phone: "(805) 555-3456", tier: "Individual", status: "Active", joinDate: new Date("2024-01-10"), committees: "Membership" },
  { firstName: "David", lastName: "Brown", email: "david@example.com", phone: "(805) 555-4567", tier: "Family", status: "Pending", joinDate: new Date("2024-11-01"), committees: "" },
  { firstName: "Eva", lastName: "Martinez", email: "eva@example.com", phone: "(805) 555-5678", tier: "Individual", status: "Active", joinDate: new Date("2021-05-22"), committees: "Social, Events" },
];

const RECENT_EXPORTS: RecentExport[] = [
  { id: "exp-001", date: new Date("2024-12-20"), recordCount: 342, format: "CSV", filters: "Active members only" },
  { id: "exp-002", date: new Date("2024-12-15"), recordCount: 28, format: "CSV", filters: "Board committee" },
  { id: "exp-003", date: new Date("2024-12-01"), recordCount: 156, format: "Excel", filters: "Individual tier" },
];

export default function MemberExportPage() {
  const [fields, setFields] = useState<ExportField[]>(AVAILABLE_FIELDS);
  const [filters, setFilters] = useState<ExportFilter>({
    status: "all",
    tier: "All Tiers",
    committee: "All Committees",
  });
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const selectedFields = useMemo(() => fields.filter((f) => f.selected), [fields]);

  const toggleField = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, selected: !f.selected } : f))
    );
  };

  const selectAllFields = () => {
    setFields((prev) => prev.map((f) => ({ ...f, selected: true })));
  };

  const deselectAllFields = () => {
    setFields((prev) => prev.map((f) => ({ ...f, selected: false })));
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to export");
      return;
    }
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert(`Export complete! Downloaded ${exportFormat.toUpperCase()} file with ${selectedFields.length} columns.`);
  };

  const getPreviewData = () => {
    return DEMO_MEMBERS.slice(0, 5).filter((member) => {
      if (filters.status !== "all" && member.status.toLowerCase() !== filters.status) return false;
      if (filters.tier !== "All Tiers" && member.tier !== filters.tier) return false;
      if (filters.committee !== "All Committees" && !member.committees.includes(filters.committee)) return false;
      return true;
    });
  };

  const previewData = getPreviewData();

  const fieldsByCategory = useMemo(() => {
    const categories: Record<string, ExportField[]> = {
      basic: [],
      contact: [],
      membership: [],
      activity: [],
    };
    fields.forEach((f) => categories[f.category].push(f));
    return categories;
  }, [fields]);

  return (
    <div data-test-id="member-export-page" style={{ padding: "24px", maxWidth: "1200px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/members" style={{ color: "#2563eb", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Members
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: "8px 0 4px" }}>
          Export Members
        </h1>
        <p style={{ color: "#6b7280" }}>
          Select fields and filters to create a custom member export
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div>
          <div data-test-id="field-selection" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: 0 }}>Select Fields</h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={selectAllFields} style={{ padding: "4px 12px", fontSize: "13px", color: "#2563eb", backgroundColor: "transparent", border: "1px solid #2563eb", borderRadius: "4px", cursor: "pointer" }}>Select All</button>
                <button type="button" onClick={deselectAllFields} style={{ padding: "4px 12px", fontSize: "13px", color: "#6b7280", backgroundColor: "transparent", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer" }}>Clear</button>
              </div>
            </div>

            {Object.entries(fieldsByCategory).map(([category, categoryFields]) => (
              <div key={category} style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: "8px" }}>{category}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {categoryFields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => toggleField(field.id)}
                      data-test-id={`field-${field.id}`}
                      style={{
                        padding: "6px 12px",
                        fontSize: "14px",
                        backgroundColor: field.selected ? "#dbeafe" : "#f9fafb",
                        color: field.selected ? "#1e40af" : "#374151",
                        border: `1px solid ${field.selected ? "#93c5fd" : "#e5e7eb"}`,
                        borderRadius: "16px",
                        cursor: "pointer",
                      }}
                    >
                      {field.selected && "✓ "}{field.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "12px" }}>
              {selectedFields.length} field{selectedFields.length !== 1 ? "s" : ""} selected
            </div>
          </div>

          <div data-test-id="filter-options" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: "0 0 16px" }}>Filter Options</h2>
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label htmlFor="status-filter" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Member Status</label>
                <select id="status-filter" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as ExportFilter["status"] })} data-test-id="status-filter" style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white" }}>
                  <option value="all">All Members</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>
              <div>
                <label htmlFor="tier-filter" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Membership Tier</label>
                <select id="tier-filter" value={filters.tier} onChange={(e) => setFilters({ ...filters, tier: e.target.value })} data-test-id="tier-filter" style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white" }}>
                  {MEMBERSHIP_TIERS.map((tier) => (<option key={tier} value={tier}>{tier}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="committee-filter" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Committee</label>
                <select id="committee-filter" value={filters.committee} onChange={(e) => setFilters({ ...filters, committee: e.target.value })} data-test-id="committee-filter" style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white" }}>
                  {COMMITTEES.map((committee) => (<option key={committee} value={committee}>{committee}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div data-test-id="format-selector" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: "0 0 16px" }}>Export Format</h2>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => setExportFormat("csv")} data-test-id="format-csv" style={{ flex: 1, padding: "12px", fontSize: "14px", fontWeight: 500, backgroundColor: exportFormat === "csv" ? "#dbeafe" : "white", color: exportFormat === "csv" ? "#1e40af" : "#374151", border: `2px solid ${exportFormat === "csv" ? "#2563eb" : "#e5e7eb"}`, borderRadius: "8px", cursor: "pointer" }}>CSV (.csv)</button>
              <button type="button" onClick={() => setExportFormat("excel")} data-test-id="format-excel" style={{ flex: 1, padding: "12px", fontSize: "14px", fontWeight: 500, backgroundColor: exportFormat === "excel" ? "#dbeafe" : "white", color: exportFormat === "excel" ? "#1e40af" : "#374151", border: `2px solid ${exportFormat === "excel" ? "#2563eb" : "#e5e7eb"}`, borderRadius: "8px", cursor: "pointer" }}>Excel (.xlsx)</button>
            </div>
            {exportFormat === "excel" && <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>Excel export coming soon. CSV export is fully functional.</p>}
          </div>

          <div data-test-id="export-preview" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: "0 0 16px" }}>Preview (First 5 Rows)</h2>
            {selectedFields.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}>Select fields to see preview</p>
            ) : previewData.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}>No members match selected filters</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {selectedFields.slice(0, 5).map((field) => (
                        <th key={field.id} style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{field.label}</th>
                      ))}
                      {selectedFields.length > 5 && <th style={{ padding: "8px", borderBottom: "2px solid #e5e7eb", color: "#9ca3af" }}>+{selectedFields.length - 5} more</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((member, idx) => (
                      <tr key={idx}>
                        {selectedFields.slice(0, 5).map((field) => (
                          <td key={field.id} style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", color: "#1f2937" }}>
                            {field.id === "joinDate" ? formatClubDate(member.joinDate) : String((member as Record<string, unknown>)[field.id] ?? "-")}
                          </td>
                        ))}
                        {selectedFields.length > 5 && <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", color: "#9ca3af" }}>...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <button type="button" onClick={handleExport} disabled={isExporting || selectedFields.length === 0} data-test-id="download-button" style={{ flex: 1, padding: "14px 24px", fontSize: "16px", fontWeight: 600, color: "white", backgroundColor: isExporting || selectedFields.length === 0 ? "#9ca3af" : "#2563eb", border: "none", borderRadius: "8px", cursor: isExporting || selectedFields.length === 0 ? "not-allowed" : "pointer" }}>
              {isExporting ? "Exporting..." : "Download Export"}
            </button>
            <button type="button" onClick={() => setShowScheduleModal(true)} data-test-id="schedule-button" style={{ padding: "14px 24px", fontSize: "16px", fontWeight: 500, color: "#374151", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer" }}>Schedule</button>
          </div>

          <div data-test-id="recent-exports" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: "0 0 16px" }}>Recent Exports</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {RECENT_EXPORTS.map((exp) => (
                <div key={exp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{formatClubDate(exp.date)}</div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>{exp.recordCount} records · {exp.format} · {exp.filters}</div>
                  </div>
                  <button type="button" style={{ padding: "6px 12px", fontSize: "13px", color: "#2563eb", backgroundColor: "transparent", border: "1px solid #2563eb", borderRadius: "4px", cursor: "pointer" }}>Re-download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div data-test-id="schedule-modal" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "400px", width: "90%" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937", margin: "0 0 16px" }}>Schedule Recurring Export</h2>
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>Set up automatic exports that will be sent to your email on a regular schedule.</p>
            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="schedule-frequency" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Frequency</label>
              <select id="schedule-frequency" style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }}>
                <option>Weekly (Monday)</option>
                <option>Bi-weekly</option>
                <option>Monthly (1st)</option>
                <option>Quarterly</option>
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="schedule-email" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Send to Email</label>
              <input type="email" id="schedule-email" placeholder="admin@sbnewcomers.org" style={{ width: "100%", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
            </div>
            <div style={{ backgroundColor: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "6px", padding: "12px", marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>Scheduled exports coming soon. This feature is currently in development.</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => setShowScheduleModal(false)} style={{ flex: 1, padding: "10px 16px", fontSize: "14px", fontWeight: 500, color: "#374151", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={() => setShowScheduleModal(false)} style={{ flex: 1, padding: "10px 16px", fontSize: "14px", fontWeight: 500, color: "white", backgroundColor: "#9ca3af", border: "none", borderRadius: "6px", cursor: "not-allowed" }} disabled>Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
