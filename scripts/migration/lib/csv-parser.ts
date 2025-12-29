/**
 * Murmurant Migration Pipeline - CSV Parser
 * Parses Wild Apricot CSV exports and maps to Murmurant records
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  MigrationConfig,
  MemberImport,
  EventImport,
  RegistrationImport,
  FieldTransform,
} from './types';

/**
 * Parse CSV content handling quoted fields and embedded newlines
 */
export function parseCSV(content: string): Array<Record<string, string>> {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const n = content[i + 1];

    if (c === '"') {
      if (inQuotes && n === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === '\n' || (c === '\r' && n === '\n')) && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
      if (c === '\r') i++;
    } else if (c !== '\r') {
      current += c;
    }
  }

  if (current.trim()) lines.push(current);
  if (!lines.length) return [];

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseLine(line);
    const rec: Record<string, string> = {};
    headers.forEach((h, j) => (rec[h] = vals[j] || ''));
    return rec;
  });
}

function parseLine(line: string): string[] {
  const vals: string[] = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const n = line[i + 1];

    if (c === '"') {
      if (inQ && n === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (c === ',' && !inQ) {
      vals.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }

  vals.push(cur.trim());
  return vals;
}

/**
 * Load and parse a CSV file
 */
export function loadCSVFile(filePath: string): Array<Record<string, string>> {
  const p = path.resolve(filePath);
  if (!fs.existsSync(p)) {
    throw new Error(`CSV not found: ${p}`);
  }
  return parseCSV(fs.readFileSync(p, 'utf-8'));
}

/**
 * Map a WA member CSV row to MemberImport
 */
export function mapMemberRecord(
  row: Record<string, string>,
  rowIndex: number,
  config: MigrationConfig
): MemberImport {
  const r: MemberImport = {
    _sourceRow: rowIndex,
    firstName: '',
    lastName: '',
    email: '',
    joinedAt: new Date(),
    membershipStatusCode: 'PROSPECT',
  };
  const errs: string[] = [];

  for (const [tf, ss] of Object.entries(config.member_fields)) {
    if (tf.startsWith('_')) {
      if (tf === '_wa_contact_id') r._waId = row[ss as string];
      continue;
    }
    const v = extractValue(row, ss, config);
    if (tf === 'joinedAt') {
      r.joinedAt = parseDate(v as string) || new Date();
    } else if (tf === 'membershipStatusId') {
      r.membershipStatusCode = v as string;
      // Capture raw WA membership level for tier mapping (Issue #276)
      const spec = ss;
      if (typeof spec === 'object' && 'source' in spec) {
        r.waMembershipLevel = row[(spec as FieldTransform).source] || undefined;
      }
    } else {
      (r as Record<string, unknown>)[tf] = v;
    }
  }

  if (!r.email) errs.push('Missing email');
  if (!r.firstName) errs.push('Missing firstName');
  if (!r.lastName) errs.push('Missing lastName');
  r._errors = errs.length ? errs : undefined;

  return r;
}

/**
 * Map a WA event CSV row to EventImport
 */
export function mapEventRecord(
  row: Record<string, string>,
  rowIndex: number,
  config: MigrationConfig
): EventImport {
  const r: EventImport = {
    _sourceRow: rowIndex,
    title: '',
    startTime: new Date(),
    isPublished: true,
  };
  const errs: string[] = [];

  for (const [tf, ss] of Object.entries(config.event_fields)) {
    if (tf.startsWith('_')) {
      if (tf === '_wa_event_id') r._waId = row[ss as string];
      continue;
    }
    const v = extractValue(row, ss, config);

    if (tf === 'startTime' || tf === 'endTime') {
      const d = parseDate(v as string);
      if (d) (r as Record<string, unknown>)[tf] = d;
    } else if (tf === 'capacity') {
      const n = parseInt(v as string, 10);
      if (!isNaN(n) && n > 0) r.capacity = n;
    } else if (tf === 'category') {
      r.category =
        config.event_category_mapping[v as string] ||
        config.event_category_mapping._default ||
        (v as string);
    } else if (typeof v === 'boolean') {
      (r as Record<string, unknown>)[tf] = v;
    } else {
      (r as Record<string, unknown>)[tf] = v;
    }
  }

  if (!r.title) errs.push('Missing title');
  if (!r.startTime) errs.push('Missing startTime');
  r._errors = errs.length ? errs : undefined;

  return r;
}

/**
 * Map a WA registration CSV row to RegistrationImport
 */
export function mapRegistrationRecord(
  row: Record<string, string>,
  rowIndex: number,
  config: MigrationConfig
): RegistrationImport {
  const r: RegistrationImport = {
    _sourceRow: rowIndex,
    memberId: '',
    eventId: '',
    status: 'CONFIRMED',
    registeredAt: new Date(),
  };

  for (const [tf, ss] of Object.entries(config.registration_fields)) {
    if (tf.startsWith('_')) {
      if (tf === '_wa_registration_id') r._waId = row[ss as string];
      continue;
    }
    const v = extractValue(row, ss, config);

    if (tf === 'registeredAt' || tf === 'cancelledAt') {
      const d = parseDate(v as string);
      if (d) (r as Record<string, unknown>)[tf] = d;
    } else {
      (r as Record<string, unknown>)[tf] = v;
    }
  }

  return r;
}

function extractValue(
  row: Record<string, string>,
  spec: string | boolean | FieldTransform,
  config: MigrationConfig
): string | boolean {
  if (typeof spec === 'boolean') return spec;
  if (typeof spec === 'string') return row[spec] || '';

  const t = spec as FieldTransform;
  const raw = row[t.source] || '';

  if (t.transform === 'membership_status_lookup') {
    return (
      config.membership_status_mapping[raw] ||
      config.membership_status_mapping._default ||
      'PROSPECT'
    );
  }
  if (t.transform === 'registration_status_lookup') {
    return (
      config.registration_status_mapping[raw] ||
      config.registration_status_mapping._default ||
      'CONFIRMED'
    );
  }

  return raw;
}

function parseDate(v: string): Date | null {
  if (!v?.trim()) return null;
  const c = v.trim();

  // ISO format
  if (c.includes('T') || c.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(c);
    if (!isNaN(d.getTime())) return d;
  }

  // MM/DD/YYYY format (WA default)
  const m = c.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const d = new Date(
      +m[3],
      +m[1] - 1,
      +m[2],
      m[4] ? +m[4] : 0,
      m[5] ? +m[5] : 0
    );
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
