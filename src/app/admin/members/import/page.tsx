"use client";

/**
 * Member Import Tool - CSV upload and member import
 *
 * Provides administrators with tools to bulk import members via CSV:
 * - CSV file upload with drag-and-drop
 * - Column mapping preview
 * - Validation and error display
 * - Preview of members to import
 * - Duplicate detection
 * - Import progress and results
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import React, { useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
  isDuplicate: boolean;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: Array<{ row: number; status: "imported" | "skipped" | "error"; message: string }>;
}

const TARGET_FIELDS = [
  { value: "", label: "-- Skip this column --" },
  { value: "firstName", label: "First Name", required: true },
  { value: "lastName", label: "Last Name", required: true },
  { value: "email", label: "Email", required: true },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zipCode", label: "Zip Code" },
  { value: "joinedAt", label: "Join Date" },
  { value: "membershipType", label: "Membership Type" },
];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);

  return { headers, rows };
}

function validateRow(
  data: Record<string, string>,
  mappings: ColumnMapping[]
): string[] {
  const errors: string[] = [];
  const mappedFields = mappings.reduce(
    (acc, m) => {
      if (m.targetField) acc[m.targetField] = data[m.csvColumn] || "";
      return acc;
    },
    {} as Record<string, string>
  );

  if (!mappedFields.firstName?.trim()) {
    errors.push("First name is required");
  }
  if (!mappedFields.lastName?.trim()) {
    errors.push("Last name is required");
  }
  if (!mappedFields.email?.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedFields.email)) {
    errors.push("Invalid email format");
  }

  return errors;
}

function DropZone({
  onFileSelect,
  isDragging,
  setIsDragging,
}: {
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        onFileSelect(file);
      }
    },
    [onFileSelect, setIsDragging]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragging ? "#2563eb" : "#d1d5db"}`,
        borderRadius: "12px",
        padding: "48px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: isDragging ? "#eff6ff" : "#f9fafb",
        transition: "all 0.2s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
        style={{ display: "none" }}
      />
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
      <div style={{ fontSize: "16px", fontWeight: "500", color: "#1f2937", marginBottom: "8px" }}>
        {isDragging ? "Drop your CSV file here" : "Drag and drop a CSV file here"}
      </div>
      <div style={{ fontSize: "14px", color: "#6b7280" }}>or click to browse</div>
    </div>
  );
}

function ColumnMappingTable({
  headers,
  mappings,
  onMappingChange,
}: {
  headers: string[];
  mappings: ColumnMapping[];
  onMappingChange: (index: number, targetField: string) => void;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontWeight: "600",
          fontSize: "14px",
          color: "#374151",
        }}
      >
        Map CSV Columns to Member Fields
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f9fafb" }}>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              CSV Column
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Maps To
            </th>
          </tr>
        </thead>
        <tbody>
          {headers.map((header, index) => (
            <tr key={index}>
              <td
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "14px",
                  color: "#1f2937",
                }}
              >
                {header}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <select
                  value={mappings[index]?.targetField || ""}
                  onChange={(e) => onMappingChange(index, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {TARGET_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                      {field.required ? " *" : ""}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewTable({ rows }: { rows: ParsedRow[] }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontWeight: "600",
          fontSize: "14px",
          color: "#374151",
        }}
      >
        Preview (First 10 Rows)
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Row</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Name</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Email</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Issues</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.rowNumber}
                style={{
                  backgroundColor: row.errors.length > 0 ? "#fef2f2" : row.isDuplicate ? "#fffbeb" : "#ffffff",
                }}
              >
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", color: "#6b7280" }}>{row.rowNumber}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                  {row.errors.length > 0 ? (
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "#dc2626", backgroundColor: "#fee2e2", padding: "2px 8px", borderRadius: "4px" }}>Error</span>
                  ) : row.isDuplicate ? (
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "#d97706", backgroundColor: "#fef3c7", padding: "2px 8px", borderRadius: "4px" }}>Duplicate</span>
                  ) : (
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "#059669", backgroundColor: "#d1fae5", padding: "2px 8px", borderRadius: "4px" }}>Ready</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", color: "#1f2937" }}>{row.data.firstName} {row.data.lastName}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", color: "#1f2937" }}>{row.data.email}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "12px", color: "#dc2626" }}>
                  {row.errors.length > 0 ? row.errors.join(", ") : row.isDuplicate ? "Email already exists" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{ width: "100%", height: "8px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "#2563eb", transition: "width 0.3s ease" }} />
    </div>
  );
}

function ResultsSummary({ result }: { result: ImportResult }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#d1fae5", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#059669" }}>{result.imported}</div>
          <div style={{ fontSize: "14px", color: "#047857" }}>Imported</div>
        </div>
        <div style={{ backgroundColor: "#fef3c7", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#d97706" }}>{result.skipped}</div>
          <div style={{ fontSize: "14px", color: "#b45309" }}>Skipped</div>
        </div>
        <div style={{ backgroundColor: "#fee2e2", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#dc2626" }}>{result.errors}</div>
          <div style={{ fontSize: "14px", color: "#b91c1c" }}>Errors</div>
        </div>
      </div>

      {result.details.length > 0 && (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", maxHeight: "300px", overflowY: "auto" }}>
          <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: "600", fontSize: "14px", color: "#374151", position: "sticky", top: 0 }}>
            Import Details
          </div>
          {result.details.map((detail, index) => (
            <div key={index} style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: detail.status === "imported" ? "#059669" : detail.status === "skipped" ? "#d97706" : "#dc2626",
                  backgroundColor: detail.status === "imported" ? "#d1fae5" : detail.status === "skipped" ? "#fef3c7" : "#fee2e2",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "capitalize",
                }}
              >
                {detail.status}
              </span>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Row {detail.row}</span>
              <span style={{ fontSize: "14px", color: "#1f2937" }}>{detail.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemberImportPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const existingEmails = useMemo(
    () => new Set(["john.doe@example.com", "jane.smith@example.com", "bob.wilson@example.com"]),
    []
  );

  const handleFileSelect = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRawRows(r);

      const autoMappings = h.map((header) => {
        const normalized = header.toLowerCase().replace(/[^a-z]/g, "");
        let targetField = "";
        if (normalized.includes("first") && normalized.includes("name")) targetField = "firstName";
        else if (normalized.includes("last") && normalized.includes("name")) targetField = "lastName";
        else if (normalized.includes("email")) targetField = "email";
        else if (normalized.includes("phone")) targetField = "phone";
        else if (normalized.includes("address") && !normalized.includes("email")) targetField = "address";
        else if (normalized.includes("city")) targetField = "city";
        else if (normalized.includes("state")) targetField = "state";
        else if (normalized.includes("zip")) targetField = "zipCode";
        else if (normalized.includes("join") || normalized.includes("date")) targetField = "joinedAt";
        else if (normalized.includes("type") || normalized.includes("membership")) targetField = "membershipType";
        return { csvColumn: header, targetField };
      });
      setMappings(autoMappings);
      setStep("mapping");
    };
    reader.readAsText(file);
  }, []);

  const handleMappingChange = useCallback((index: number, targetField: string) => {
    setMappings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], targetField };
      return updated;
    });
  }, []);

  const handleProceedToPreview = useCallback(() => {
    const parsed: ParsedRow[] = rawRows.slice(0, 10).map((row, index) => {
      const data: Record<string, string> = {};
      mappings.forEach((mapping, colIndex) => {
        if (mapping.targetField) data[mapping.targetField] = row[colIndex] || "";
        data[mapping.csvColumn] = row[colIndex] || "";
      });
      const errors = validateRow(data, mappings);
      const isDuplicate = existingEmails.has(data.email?.toLowerCase() || "");
      return { rowNumber: index + 2, data, errors, isDuplicate };
    });
    setParsedRows(parsed);
    setStep("preview");
  }, [rawRows, mappings, existingEmails]);

  const handleStartImport = useCallback(() => {
    setStep("importing");
    setProgress(0);
    const totalRows = rawRows.length;
    let currentRow = 0;
    const details: ImportResult["details"] = [];
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const interval = setInterval(() => {
      currentRow++;
      setProgress(Math.round((currentRow / totalRows) * 100));
      const row = rawRows[currentRow - 1];
      const data: Record<string, string> = {};
      mappings.forEach((mapping, colIndex) => {
        if (mapping.targetField) data[mapping.targetField] = row?.[colIndex] || "";
      });
      const rowErrors = validateRow(data, mappings);
      const isDuplicate = existingEmails.has(data.email?.toLowerCase() || "");

      if (rowErrors.length > 0) {
        errors++;
        details.push({ row: currentRow + 1, status: "error", message: rowErrors[0] });
      } else if (isDuplicate) {
        skipped++;
        details.push({ row: currentRow + 1, status: "skipped", message: `${data.firstName} ${data.lastName} (duplicate email)` });
      } else {
        imported++;
        details.push({ row: currentRow + 1, status: "imported", message: `${data.firstName} ${data.lastName}` });
      }

      if (currentRow >= totalRows) {
        clearInterval(interval);
        setResult({ imported, skipped, errors, details });
        setStep("complete");
      }
    }, 100);
  }, [rawRows, mappings, existingEmails]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setFileName(null);
    setHeaders([]);
    setRawRows([]);
    setMappings([]);
    setParsedRows([]);
    setProgress(0);
    setResult(null);
  }, []);

  const requiredFieldsMapped = ["firstName", "lastName", "email"].every((field) =>
    mappings.some((m) => m.targetField === field)
  );

  const validCount = parsedRows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length;
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: "0 0 8px 0" }}>Import Members</h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Upload a CSV file to bulk import new members</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        {["Upload", "Map Columns", "Preview", "Import"].map((label, index) => {
          const stepIndex = step === "upload" ? 0 : step === "mapping" ? 1 : step === "preview" ? 2 : 3;
          const isActive = index === stepIndex;
          const isComplete = index < stepIndex;
          return (
            <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: isComplete ? "#059669" : isActive ? "#2563eb" : "#e5e7eb", color: isComplete || isActive ? "#ffffff" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600" }}>
                  {isComplete ? "✓" : index + 1}
                </div>
                <span style={{ fontSize: "14px", fontWeight: isActive ? "600" : "400", color: isActive ? "#1f2937" : "#6b7280" }}>{label}</span>
              </div>
              {index < 3 && <div style={{ flex: 1, height: "2px", backgroundColor: isComplete ? "#059669" : "#e5e7eb" }} />}
            </React.Fragment>
          );
        })}
      </div>

      {step === "upload" && <DropZone onFileSelect={handleFileSelect} isDragging={isDragging} setIsDragging={setIsDragging} />}

      {step === "mapping" && (
        <div>
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>📄</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "500", color: "#1e40af" }}>{fileName}</div>
              <div style={{ fontSize: "12px", color: "#3b82f6" }}>{rawRows.length} rows found</div>
            </div>
          </div>
          <ColumnMappingTable headers={headers} mappings={mappings} onMappingChange={handleMappingChange} />
          {!requiredFieldsMapped && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginTop: "16px", fontSize: "14px", color: "#dc2626" }}>
              Please map all required fields: First Name, Last Name, and Email
            </div>
          )}
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button onClick={handleReset} style={{ padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#ffffff", color: "#374151", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>Back</button>
            <button onClick={handleProceedToPreview} disabled={!requiredFieldsMapped} style={{ padding: "10px 20px", border: "none", borderRadius: "6px", backgroundColor: requiredFieldsMapped ? "#2563eb" : "#9ca3af", color: "#ffffff", fontSize: "14px", fontWeight: "500", cursor: requiredFieldsMapped ? "pointer" : "not-allowed" }}>Continue to Preview</button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ backgroundColor: "#d1fae5", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#059669" }}>{validCount}</div>
              <div style={{ fontSize: "12px", color: "#047857" }}>Ready to Import</div>
            </div>
            <div style={{ backgroundColor: "#fef3c7", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#d97706" }}>{duplicateCount}</div>
              <div style={{ fontSize: "12px", color: "#b45309" }}>Duplicates</div>
            </div>
            <div style={{ backgroundColor: "#fee2e2", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#dc2626" }}>{errorCount}</div>
              <div style={{ fontSize: "12px", color: "#b91c1c" }}>Errors</div>
            </div>
          </div>
          {duplicateCount > 0 && (
            <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", fontSize: "14px", color: "#92400e" }}>
              <strong>Duplicate Warning:</strong> {duplicateCount} member(s) already exist with the same email address and will be skipped during import.
            </div>
          )}
          <PreviewTable rows={parsedRows} />
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px", marginBottom: "24px" }}>Showing first 10 of {rawRows.length} rows</div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setStep("mapping")} style={{ padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#ffffff", color: "#374151", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>Back</button>
            <button onClick={handleStartImport} style={{ padding: "10px 20px", border: "none", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>Import {rawRows.length} Members</button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>⏳</div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginBottom: "8px" }}>Importing Members...</div>
          <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>{progress}% complete</div>
          <div style={{ maxWidth: "400px", margin: "0 auto" }}><ProgressBar progress={progress} /></div>
        </div>
      )}

      {step === "complete" && result && (
        <div>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>Import Complete</div>
          </div>
          <ResultsSummary result={result} />
          <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
            <button onClick={handleReset} style={{ padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#ffffff", color: "#374151", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>Import More</button>
            <Link href="/admin/members" style={{ padding: "10px 20px", border: "none", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", fontSize: "14px", fontWeight: "500", textDecoration: "none", display: "inline-block" }}>View Members</Link>
          </div>
        </div>
      )}
    </div>
  );
}
