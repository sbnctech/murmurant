/**
 * ClubOS Migration Pipeline - Type Definitions
 * Wild Apricot → ClubOS data migration
 */

export interface MigrationConfig {
  version: string;
  source: string;
  target: string;
  membership_status_mapping: Record<string, string>;
  member_fields: Record<string, string | FieldTransform>;
  event_fields: Record<string, string | boolean | FieldTransform>;
  event_category_mapping: Record<string, string>;
  registration_fields: Record<string, string | FieldTransform>;
  registration_status_mapping: Record<string, string>;
  id_reconciliation: {
    members: ReconciliationRule;
    events: ReconciliationRule;
    registrations: ReconciliationRule;
  };
  import_options: ImportOptions;
}

export interface FieldTransform {
  source: string;
  transform: string;
}

export interface ReconciliationRule {
  primary_key?: string;
  composite_key?: string[];
  time_tolerance_minutes?: number;
  on_conflict: 'update' | 'skip';
}

export interface ImportOptions {
  batch_size: number;
  continue_on_error: boolean;
  date_format: string;
  datetime_format: string;
  source_timezone: string;
  skip_incomplete: boolean;
  required_fields: {
    members: string[];
    events: string[];
    registrations: string[];
  };
}

export interface MigrationRecord {
  _sourceRow: number;
  _waId?: string;
  _clubosId?: string;
  _action?: 'create' | 'update' | 'skip';
  _errors?: string[];
  [key: string]: unknown;
}

export interface MemberImport extends MigrationRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  joinedAt: Date;
  membershipStatusCode: string;
  /** Raw WA membership level for tier mapping (Issue #276) */
  waMembershipLevel?: string;
  /** Resolved ClubOS MembershipTier ID (Issue #276) */
  membershipTierId?: string;
}

export interface EventImport extends MigrationRecord {
  title: string;
  description?: string;
  category?: string;
  location?: string;
  startTime: Date;
  endTime?: Date;
  capacity?: number;
  isPublished: boolean;
}

export interface RegistrationImport extends MigrationRecord {
  memberId: string;
  eventId: string;
  status: string;
  registeredAt: Date;
  cancelledAt?: Date;
}

export interface MigrationReport {
  runId: string;
  startedAt: Date;
  completedAt?: Date;
  dryRun: boolean;
  config: {
    source: string;
    target: string;
    version: string;
  };
  summary: {
    totalRecords: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    duration_ms: number;
  };
  members: EntityReport;
  events: EntityReport;
  registrations: EntityReport;
  errors: {
    entity: string;
    sourceRow: number;
    message: string;
    waId?: string;
  }[];
  idMapping: {
    members: { waId: string; clubosId: string; email?: string }[];
    events: { waId: string; clubosId: string; title?: string }[];
  };
}

export interface EntityReport {
  file?: string;
  totalRows: number;
  parsed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  records: MigrationRecord[];
}

export interface MigrationRunOptions {
  dryRun: boolean;
  configPath: string;
  dataDir: string;
  membersFile?: string;
  eventsFile?: string;
  registrationsFile?: string;
  outputDir: string;
  verbose: boolean;
}
