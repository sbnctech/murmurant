import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import type { MigrationConfig, MigrationRunOptions, MigrationReport, MemberImport, EventImport, RegistrationImport, EntityReport } from './types';
import { loadConfig, getDefaultConfigPath } from './config';
import { loadCSVFile, mapMemberRecord, mapEventRecord, mapRegistrationRecord } from './csv-parser';
import { generateIdMappingReport, writeIdMappingReport, formatTimestamp } from './id-mapping';
import { loadTierMappings, resolveTierId, validateTierMapper, type TierMapperResult } from './tier-mapper';

export class MigrationEngine {
  private prisma: PrismaClient;
  private config: MigrationConfig;
  private options: MigrationRunOptions;
  private report: MigrationReport;
  private membershipStatuses: Record<string, string> = {};
  private memberLookup = new Map<string, string>();
  private eventLookup = new Map<string, string>();
  private memberIdMap = new Map<string, string>();
  private eventIdMap = new Map<string, string>();
  private tierMapper: TierMapperResult | null = null;

  constructor(options: MigrationRunOptions) {
    this.options = options;
    this.prisma = new PrismaClient();
    this.config = loadConfig(options.configPath || getDefaultConfigPath());
    this.report = { runId: randomUUID(), startedAt: new Date(), dryRun: options.dryRun, config: { source: this.config.source, target: this.config.target, version: this.config.version }, summary: { totalRecords: 0, created: 0, updated: 0, skipped: 0, errors: 0, duration_ms: 0 }, members: this.initEntity(), events: this.initEntity(), registrations: this.initEntity(), errors: [], idMapping: { members: [], events: [] } };
  }

  private initEntity(): EntityReport { return { totalRows: 0, parsed: 0, created: 0, updated: 0, skipped: 0, errors: 0, records: [] }; }

  async run(): Promise<MigrationReport> {
    const start = Date.now();
    this.log(`\n${'='.repeat(60)}\nClubOS Migration - ${this.report.runId}\nMode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}\n${'='.repeat(60)}\n`);
    try {
      await this.loadLookups();
      if (this.options.membersFile) await this.processMembers();
      if (this.options.eventsFile) await this.processEvents();
      if (this.options.registrationsFile) await this.processRegistrations();
      this.report.summary = { totalRecords: this.report.members.parsed + this.report.events.parsed + this.report.registrations.parsed, created: this.report.members.created + this.report.events.created + this.report.registrations.created, updated: this.report.members.updated + this.report.events.updated + this.report.registrations.updated, skipped: this.report.members.skipped + this.report.events.skipped + this.report.registrations.skipped, errors: this.report.members.errors + this.report.events.errors + this.report.registrations.errors, duration_ms: Date.now() - start };
    } catch (e) { this.log(`FATAL: ${(e as Error).message}`, 'error'); this.report.errors.push({ entity: 'system', sourceRow: 0, message: (e as Error).message }); }
    finally { await this.prisma.$disconnect(); }
    this.report.completedAt = new Date();
    this.writeReport();
    this.printSummary();
    return this.report;
  }

  private async loadLookups() {
    this.log('Loading lookups...');
    for (const s of await this.prisma.membershipStatus.findMany()) this.membershipStatuses[s.code] = s.id;
    this.log(`  ${Object.keys(this.membershipStatuses).length} statuses`);
    for (const m of await this.prisma.member.findMany({ select: { id: true, email: true } })) this.memberLookup.set(m.email.toLowerCase(), m.id);
    this.log(`  ${this.memberLookup.size} members`);
    for (const e of await this.prisma.event.findMany({ select: { id: true, title: true, startTime: true } })) this.eventLookup.set(this.eventKey(e.title, e.startTime), e.id);
    this.log(`  ${this.eventLookup.size} events`);
    // Load tier mappings if feature flag is enabled
    this.tierMapper = await loadTierMappings(this.prisma);
    if (this.tierMapper.enabled) {
      const validation = validateTierMapper(this.tierMapper);
      if (!validation.valid) {
        this.log(`  WARN: Tier mapping issues: ${validation.errors.join(', ')}`, 'error');
      } else {
        this.log(`  ${this.tierMapper.mappings.size} tier mappings`);
      }
    } else {
      this.log(`  tier mapping disabled`);
    }
    this.log('');
  }

  private eventKey(title: string, time: Date): string { const t = new Date(time); t.setMinutes(0, 0, 0); return `${title.toLowerCase().trim()}|${t.toISOString()}`; }

  private async processMembers() {
    const file = path.resolve(this.options.dataDir, this.options.membersFile!);
    this.log(`Members: ${file}`);
    const rows = loadCSVFile(file);
    this.report.members.file = file;
    this.report.members.totalRows = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const r = mapMemberRecord(rows[i], i + 2, this.config);
      this.report.members.parsed++;
      if (r._errors?.length) { this.report.members.errors++; for (const e of r._errors) this.report.errors.push({ entity: 'member', sourceRow: r._sourceRow, message: e, waId: r._waId }); }
      await this.processMember(r);
      this.report.members.records.push(r);
    }
    this.log(`  Done: ${this.report.members.created} created, ${this.report.members.updated} updated, ${this.report.members.skipped} skipped\n`);
  }

  private async processMember(r: MemberImport) {
    if (r._errors?.length) { r._action = 'skip'; return; }
    try {
      const email = r.email.toLowerCase(), existing = this.memberLookup.get(email), statusId = this.membershipStatuses[r.membershipStatusCode];
      if (!statusId) throw new Error(`Unknown status: ${r.membershipStatusCode}`);
      // Resolve tier ID if tier mapping is enabled
      let tierIdToAssign: string | undefined;
      if (this.tierMapper?.enabled && r.waMembershipLevel) {
        const tierResult = resolveTierId(r.waMembershipLevel, this.tierMapper);
        if (tierResult.tierId) { tierIdToAssign = tierResult.tierId; r.membershipTierId = tierResult.tierId; }
        else if (tierResult.error) { this.log(`  WARN: ${tierResult.error}`, 'error'); }
      }
      if (existing) {
        if (this.config.id_reconciliation.members.on_conflict === 'skip') { r._action = 'skip'; r._clubosId = existing; this.report.members.skipped++; }
        else { r._action = 'update'; r._clubosId = existing; if (!this.options.dryRun) await this.prisma.member.update({ where: { id: existing }, data: { firstName: r.firstName, lastName: r.lastName, phone: r.phone || null, joinedAt: r.joinedAt, membershipStatusId: statusId, ...(tierIdToAssign && { membershipTierId: tierIdToAssign }) } }); this.report.members.updated++; }
      } else {
        r._action = 'create';
        if (!this.options.dryRun) { const c = await this.prisma.member.create({ data: { firstName: r.firstName, lastName: r.lastName, email: r.email, phone: r.phone || null, joinedAt: r.joinedAt, membershipStatusId: statusId, ...(tierIdToAssign && { membershipTierId: tierIdToAssign }) } }); r._clubosId = c.id; this.memberLookup.set(email, c.id); }
        else r._clubosId = `dry-${randomUUID()}`;
        this.report.members.created++;
      }
      if (r._waId && r._clubosId) { this.memberIdMap.set(r._waId, r._clubosId); this.report.idMapping.members.push({ waId: r._waId, clubosId: r._clubosId, email: r.email }); }
    } catch (e) { r._action = 'skip'; r._errors = [...(r._errors || []), (e as Error).message]; this.report.members.errors++; this.report.errors.push({ entity: 'member', sourceRow: r._sourceRow, message: (e as Error).message, waId: r._waId }); }
  }

  private async processEvents() {
    const file = path.resolve(this.options.dataDir, this.options.eventsFile!);
    this.log(`Events: ${file}`);
    const rows = loadCSVFile(file);
    this.report.events.file = file;
    this.report.events.totalRows = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const r = mapEventRecord(rows[i], i + 2, this.config);
      this.report.events.parsed++;
      if (r._errors?.length) { this.report.events.errors++; for (const e of r._errors) this.report.errors.push({ entity: 'event', sourceRow: r._sourceRow, message: e, waId: r._waId }); }
      await this.processEvent(r);
      this.report.events.records.push(r);
    }
    this.log(`  Done: ${this.report.events.created} created, ${this.report.events.updated} updated, ${this.report.events.skipped} skipped\n`);
  }

  private async processEvent(r: EventImport) {
    if (r._errors?.length) { r._action = 'skip'; return; }
    try {
      const key = this.eventKey(r.title, r.startTime), existing = this.eventLookup.get(key);
      if (existing) { r._action = 'skip'; r._clubosId = existing; this.report.events.skipped++; }
      else {
        r._action = 'create';
        if (!this.options.dryRun) { const c = await this.prisma.event.create({ data: { title: r.title, description: r.description || null, category: r.category || null, location: r.location || null, startTime: r.startTime, endTime: r.endTime || null, capacity: r.capacity || null, isPublished: r.isPublished } }); r._clubosId = c.id; this.eventLookup.set(key, c.id); }
        else r._clubosId = `dry-${randomUUID()}`;
        this.report.events.created++;
      }
      if (r._waId && r._clubosId) { this.eventIdMap.set(r._waId, r._clubosId); this.report.idMapping.events.push({ waId: r._waId, clubosId: r._clubosId, title: r.title }); }
    } catch (e) { r._action = 'skip'; r._errors = [...(r._errors || []), (e as Error).message]; this.report.events.errors++; this.report.errors.push({ entity: 'event', sourceRow: r._sourceRow, message: (e as Error).message, waId: r._waId }); }
  }

  private async processRegistrations() {
    const file = path.resolve(this.options.dataDir, this.options.registrationsFile!);
    this.log(`Registrations: ${file}`);
    const rows = loadCSVFile(file);
    this.report.registrations.file = file;
    this.report.registrations.totalRows = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const r = mapRegistrationRecord(rows[i], i + 2, this.config);
      const waMember = r.memberId, waEvent = r.eventId;
      r.memberId = this.memberIdMap.get(waMember) || '';
      r.eventId = this.eventIdMap.get(waEvent) || '';
      if (!r.memberId) { r._errors = [...(r._errors || []), `Member not found: ${waMember}`]; }
      if (!r.eventId) { r._errors = [...(r._errors || []), `Event not found: ${waEvent}`]; }
      this.report.registrations.parsed++;
      if (r._errors?.length) { this.report.registrations.errors++; for (const e of r._errors) this.report.errors.push({ entity: 'registration', sourceRow: r._sourceRow, message: e, waId: r._waId }); }
      await this.processRegistration(r);
      this.report.registrations.records.push(r);
    }
    this.log(`  Done: ${this.report.registrations.created} created, ${this.report.registrations.updated} updated, ${this.report.registrations.skipped} skipped\n`);
  }

  private async processRegistration(r: RegistrationImport) {
    if (r._errors?.length) { r._action = 'skip'; return; }
    try {
      const existing = this.options.dryRun ? null : await this.prisma.eventRegistration.findUnique({ where: { eventId_memberId: { eventId: r.eventId, memberId: r.memberId } } });
      const status = r.status as 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED' | 'PENDING' | 'NO_SHOW';
      if (existing) {
        if (this.config.id_reconciliation.registrations.on_conflict === 'skip') { r._action = 'skip'; r._clubosId = existing.id; this.report.registrations.skipped++; }
        else { r._action = 'update'; r._clubosId = existing.id; if (!this.options.dryRun) await this.prisma.eventRegistration.update({ where: { id: existing.id }, data: { status, registeredAt: r.registeredAt, cancelledAt: r.cancelledAt || null } }); this.report.registrations.updated++; }
      } else {
        r._action = 'create';
        if (!this.options.dryRun) { const c = await this.prisma.eventRegistration.create({ data: { eventId: r.eventId, memberId: r.memberId, status, registeredAt: r.registeredAt, cancelledAt: r.cancelledAt || null } }); r._clubosId = c.id; }
        else r._clubosId = `dry-${randomUUID()}`;
        this.report.registrations.created++;
      }
    } catch (e) { r._action = 'skip'; r._errors = [...(r._errors || []), (e as Error).message]; this.report.registrations.errors++; this.report.errors.push({ entity: 'registration', sourceRow: r._sourceRow, message: (e as Error).message, waId: r._waId }); }
  }

  private log(msg: string, level: 'info' | 'error' = 'info') { if (this.options.verbose || level === 'error') console.log(level === 'error' ? `[ERROR] ${msg}` : msg); }

  private writeReport() {
    const dir = path.resolve(this.options.outputDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const ts = formatTimestamp(), mode = this.options.dryRun ? 'dry-run' : 'live';
    const summary = { ...this.report, members: { ...this.report.members, records: `[${this.report.members.records.length}]` }, events: { ...this.report.events, records: `[${this.report.events.records.length}]` }, registrations: { ...this.report.registrations, records: `[${this.report.registrations.records.length}]` } };
    fs.writeFileSync(path.join(dir, `migration-${mode}-${ts}.json`), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(dir, `migration-${mode}-${ts}-full.json`), JSON.stringify(this.report, null, 2));
    // Write dedicated ID mapping report
    const idMapReport = generateIdMappingReport(this.report);
    writeIdMappingReport(idMapReport, dir, ts);
    this.log(`Reports written to ${dir}`);
  }

  private printSummary() {
    const s = this.report.summary;
    console.log(`\n${'='.repeat(60)}\nSUMMARY: ${s.totalRecords} total | ${s.created} created | ${s.updated} updated | ${s.skipped} skipped | ${s.errors} errors | ${s.duration_ms}ms\n${'='.repeat(60)}\n`);
  }
}
