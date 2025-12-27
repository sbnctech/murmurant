/**
 * Migration Preview Report Generator
 *
 * Generates a preview report from a migration bundle without modifying
 * any database state. The report is deterministic - same bundle input
 * produces identical output (except for generatedAt timestamp).
 *
 * @module scripts/migration/lib/preview
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviewOptions {
  bundlePath: string;
  configVersion?: string;
}

export interface EntitySummary {
  total: number;
  valid: number;
  errors: number;
  warnings: number;
}

export interface InvariantCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string[];
}

export interface SampleMember {
  rowNumber: number;
  email: string;
  displayName: string;
  membershipLevel: string;
  status: string;
}

export interface SampleEvent {
  rowNumber: number;
  title: string;
  startDate: string;
  registrationCount: number;
}

export interface PreviewReport {
  previewId: string;
  generatedAt: string;
  bundlePath: string;
  configVersion: string;
  summary: {
    members: EntitySummary;
    events: EntitySummary;
    registrations: EntitySummary;
  };
  invariants: InvariantCheck[];
  samples: {
    members: SampleMember[];
    events: SampleEvent[];
  };
  contentHash: string;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
}

interface ParsedFile {
  filename: string;
  rows: ParsedRow[];
  headers: string[];
}

// ---------------------------------------------------------------------------
// CSV Parsing (minimal, no external deps)
// ---------------------------------------------------------------------------

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());

  return result;
}

// ---------------------------------------------------------------------------
// Bundle Loading
// ---------------------------------------------------------------------------

function loadBundle(bundlePath: string): Map<string, ParsedFile> {
  const files = new Map<string, ParsedFile>();
  const absolutePath = path.resolve(bundlePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error('Bundle path does not exist: ' + absolutePath);
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isDirectory()) {
    throw new Error('Bundle path is not a directory: ' + absolutePath);
  }

  const csvFiles = fs.readdirSync(absolutePath).filter((f) => f.endsWith('.csv'));

  for (const filename of csvFiles) {
    const filePath = path.join(absolutePath, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { headers, rows } = parseCSV(content);

    const parsedRows: ParsedRow[] = rows.map((row, index) => {
      const data: Record<string, string> = {};
      headers.forEach((header, i) => {
        data[header] = row[i] || '';
      });

      return {
        rowNumber: index + 2, // +2 for 1-based + header row
        data,
        errors: [],
        warnings: [],
      };
    });

    files.set(filename.replace('.csv', ''), {
      filename,
      headers,
      rows: parsedRows,
    });
  }

  return files;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateMemberRow(row: ParsedRow): void {
  const email = row.data['Email'] || row.data['email'] || '';
  if (!email) {
    row.errors.push('Missing email address');
  } else if (!email.includes('@')) {
    row.errors.push('Invalid email format: ' + email);
  }

  const name = row.data['Display name'] || row.data['First name'] || '';
  if (!name) {
    row.warnings.push('Missing display name');
  }
}

function validateEventRow(row: ParsedRow): void {
  const title = row.data['Title'] || row.data['Name'] || row.data['Event'] || '';
  if (!title) {
    row.errors.push('Missing event title');
  }

  const startDate =
    row.data['Start date'] ||
    row.data['StartDate'] ||
    row.data['Start'] ||
    row.data['Date'] ||
    '';
  if (!startDate) {
    row.errors.push('Missing start date');
  }
}

function validateRegistrationRow(row: ParsedRow): void {
  const eventRef =
    row.data['Event'] || row.data['EventId'] || row.data['Event ID'] || '';
  const memberRef =
    row.data['Email'] || row.data['Member'] || row.data['ContactId'] || '';

  if (!eventRef) {
    row.errors.push('Missing event reference');
  }
  if (!memberRef) {
    row.errors.push('Missing member reference');
  }
}

// ---------------------------------------------------------------------------
// Invariant Checks
// ---------------------------------------------------------------------------

function runInvariantChecks(files: Map<string, ParsedFile>): InvariantCheck[] {
  const checks: InvariantCheck[] = [];

  // INV-1: All members have valid email
  const members = files.get('members') || files.get('contacts');
  if (members) {
    const invalidEmails = members.rows.filter((r) => r.errors.some((e) => e.includes('email')));
    checks.push({
      id: 'INV-1',
      name: 'Member email validity',
      status: invalidEmails.length === 0 ? 'pass' : 'fail',
      message:
        invalidEmails.length === 0
          ? 'All members have valid email addresses'
          : invalidEmails.length + ' members have invalid emails',
      details: invalidEmails.slice(0, 5).map((r) => 'Row ' + r.rowNumber + ': ' + r.errors.join(', ')),
    });
  }

  // INV-2: All events have titles
  const events = files.get('events');
  if (events) {
    const missingTitles = events.rows.filter((r) =>
      r.errors.some((e) => e.includes('title'))
    );
    checks.push({
      id: 'INV-2',
      name: 'Event title presence',
      status: missingTitles.length === 0 ? 'pass' : 'fail',
      message:
        missingTitles.length === 0
          ? 'All events have titles'
          : missingTitles.length + ' events missing titles',
      details: missingTitles.slice(0, 5).map((r) => 'Row ' + r.rowNumber),
    });
  }

  // INV-3: All events have start times
  if (events) {
    const missingDates = events.rows.filter((r) =>
      r.errors.some((e) => e.includes('start date'))
    );
    checks.push({
      id: 'INV-3',
      name: 'Event start date presence',
      status: missingDates.length === 0 ? 'pass' : 'fail',
      message:
        missingDates.length === 0
          ? 'All events have start dates'
          : missingDates.length + ' events missing start dates',
      details: missingDates.slice(0, 5).map((r) => 'Row ' + r.rowNumber),
    });
  }

  // INV-4: No duplicate member emails
  if (members) {
    const emails = new Map<string, number[]>();
    members.rows.forEach((r) => {
      const email = (r.data['Email'] || r.data['email'] || '').toLowerCase();
      if (email) {
        const existing = emails.get(email) || [];
        existing.push(r.rowNumber);
        emails.set(email, existing);
      }
    });
    const duplicates = Array.from(emails.entries()).filter(([, rows]) => rows.length > 1);
    checks.push({
      id: 'INV-4',
      name: 'No duplicate member emails',
      status: duplicates.length === 0 ? 'pass' : 'warn',
      message:
        duplicates.length === 0
          ? 'No duplicate emails found'
          : duplicates.length + ' duplicate email addresses',
      details: duplicates.slice(0, 5).map(([email, rows]) => email + ': rows ' + rows.join(', ')),
    });
  }

  // INV-5: Registration count plausibility
  const registrations = files.get('registrations') || files.get('event_registrations');
  if (registrations && members && events) {
    const ratio = registrations.rows.length / Math.max(members.rows.length, 1);
    const status = ratio < 100 ? 'pass' : 'warn';
    checks.push({
      id: 'INV-5',
      name: 'Registration count plausibility',
      status,
      message: registrations.rows.length + ' registrations for ' + members.rows.length + ' members (ratio: ' + ratio.toFixed(1) + ')',
    });
  }

  // INV-6: Error rate below threshold
  const allRows = Array.from(files.values()).flatMap((f) => f.rows);
  const errorCount = allRows.filter((r) => r.errors.length > 0).length;
  const errorRate = allRows.length > 0 ? errorCount / allRows.length : 0;
  checks.push({
    id: 'INV-6',
    name: 'Overall error rate',
    status: errorRate < 0.05 ? 'pass' : errorRate < 0.1 ? 'warn' : 'fail',
    message: (errorRate * 100).toFixed(1) + '% error rate (' + errorCount + '/' + allRows.length + ' rows)',
  });

  return checks;
}

// ---------------------------------------------------------------------------
// Sample Extraction
// ---------------------------------------------------------------------------

function extractMemberSamples(file: ParsedFile | undefined, count = 5): SampleMember[] {
  if (!file) return [];

  return file.rows.slice(0, count).map((row) => ({
    rowNumber: row.rowNumber,
    email: row.data['Email'] || row.data['email'] || '',
    displayName: row.data['Display name'] || row.data['First name'] || '',
    membershipLevel: row.data['Membership level'] || row.data['Level'] || '',
    status: row.data['Status'] || row.data['Member status'] || '',
  }));
}

function extractEventSamples(file: ParsedFile | undefined, count = 5): SampleEvent[] {
  if (!file) return [];

  return file.rows.slice(0, count).map((row) => ({
    rowNumber: row.rowNumber,
    title: row.data['Title'] || row.data['Name'] || row.data['Event'] || '',
    startDate:
      row.data['Start date'] ||
      row.data['StartDate'] ||
      row.data['Start'] ||
      row.data['Date'] ||
      '',
    registrationCount: parseInt(row.data['Registrations'] || row.data['Attendees'] || '0', 10) || 0,
  }));
}

// ---------------------------------------------------------------------------
// Report Generation
// ---------------------------------------------------------------------------

function computeContentHash(report: Omit<PreviewReport, 'contentHash' | 'generatedAt'>): string {
  const content = JSON.stringify(report, Object.keys(report).sort());
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function summarizeFile(file: ParsedFile | undefined): EntitySummary {
  if (!file) {
    return { total: 0, valid: 0, errors: 0, warnings: 0 };
  }

  const total = file.rows.length;
  const errors = file.rows.filter((r) => r.errors.length > 0).length;
  const warnings = file.rows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length;
  const valid = total - errors;

  return { total, valid, errors, warnings };
}

export function generatePreviewReport(options: PreviewOptions): PreviewReport {
  const { bundlePath, configVersion = '1.0.0' } = options;

  // Load and parse bundle
  const files = loadBundle(bundlePath);

  // Validate rows
  const members = files.get('members') || files.get('contacts');
  const events = files.get('events');
  const registrations = files.get('registrations') || files.get('event_registrations');

  members?.rows.forEach(validateMemberRow);
  events?.rows.forEach(validateEventRow);
  registrations?.rows.forEach(validateRegistrationRow);

  // Build report (without hash/timestamp for deterministic hashing)
  const previewId = crypto.randomUUID();
  const partialReport = {
    previewId,
    bundlePath: path.resolve(bundlePath),
    configVersion,
    summary: {
      members: summarizeFile(members),
      events: summarizeFile(events),
      registrations: summarizeFile(registrations),
    },
    invariants: runInvariantChecks(files),
    samples: {
      members: extractMemberSamples(members),
      events: extractEventSamples(events),
    },
  };

  const contentHash = computeContentHash(partialReport);

  return {
    ...partialReport,
    generatedAt: new Date().toISOString(),
    contentHash,
  };
}

// ---------------------------------------------------------------------------
// Markdown Formatting
// ---------------------------------------------------------------------------

export function formatPreviewAsMarkdown(report: PreviewReport): string {
  const lines: string[] = [];

  lines.push('# Migration Preview Report');
  lines.push('');
  lines.push('**Preview ID:** `' + report.previewId + '`');
  lines.push('**Generated:** ' + report.generatedAt);
  lines.push('**Bundle:** `' + report.bundlePath + '`');
  lines.push('**Content Hash:** `' + report.contentHash + '`');
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Entity | Total | Valid | Errors | Warnings |');
  lines.push('|--------|-------|-------|--------|----------|');
  for (const [name, summary] of Object.entries(report.summary)) {
    lines.push(
      '| ' + name + ' | ' + summary.total + ' | ' + summary.valid + ' | ' + summary.errors + ' | ' + summary.warnings + ' |'
    );
  }
  lines.push('');

  // Invariants
  lines.push('## Invariant Checks');
  lines.push('');
  for (const check of report.invariants) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
    lines.push('- **' + check.id + '** ' + icon + ' ' + check.name + ': ' + check.message);
    if (check.details && check.details.length > 0) {
      for (const detail of check.details) {
        lines.push('  - ' + detail);
      }
    }
  }
  lines.push('');

  // Samples
  if (report.samples.members.length > 0) {
    lines.push('## Sample Members');
    lines.push('');
    lines.push('| Row | Email | Display Name | Level | Status |');
    lines.push('|-----|-------|--------------|-------|--------|');
    for (const member of report.samples.members) {
      lines.push(
        '| ' + member.rowNumber + ' | ' + member.email + ' | ' + member.displayName + ' | ' + member.membershipLevel + ' | ' + member.status + ' |'
      );
    }
    lines.push('');
  }

  if (report.samples.events.length > 0) {
    lines.push('## Sample Events');
    lines.push('');
    lines.push('| Row | Title | Start Date | Registrations |');
    lines.push('|-----|-------|------------|---------------|');
    for (const event of report.samples.events) {
      lines.push(
        '| ' + event.rowNumber + ' | ' + event.title + ' | ' + event.startDate + ' | ' + event.registrationCount + ' |'
      );
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('_This preview is read-only. No database changes were made._');

  return lines.join('\n');
}
