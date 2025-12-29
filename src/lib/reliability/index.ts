// Copyright (c) Murmurant, Inc.
// Reliability Module - Central exports for reliability mechanisms
// R3: All mechanisms are STUBBED (inert by default)

/**
 * Reliability Module Exports
 *
 * This module provides centralized reliability mechanisms for:
 * - Write/Publish guards (rate limiting, freeze modes)
 * - Kill switches (server-side feature flags for emergencies)
 * - Dependency isolation (timeouts, circuit breakers)
 * - Backpressure (rate limiting, load shedding)
 * - Backup/Restore (data protection)
 * - Failure injection (chaos testing, TEST ONLY)
 *
 * R3 STATUS: All mechanisms are STUBBED
 * - Guards always return { allowed: true }
 * - Kill switches always return false
 * - Isolation wrappers pass through directly
 * - Backpressure always allows requests
 * - Backup/restore are dry-run only
 * - Failure injection is disabled by default
 *
 * See: docs/reliability/MECHANISM_STUBS_AND_OWNERSHIP.md
 * See: docs/reliability/R3_STUB_MECHANISMS_AND_CI_WIRING.md
 */

// Guards (write protection)
export {
  canWrite,
  requireWrite,
  canPublish,
  requirePublish,
  getGuardStatus,
  type GuardResult,
  type GuardContext,
} from "./guards";

// Kill switches (emergency controls)
export {
  KillSwitch,
  isKillSwitchEnabled,
  getKillSwitchState,
  getAllKillSwitchStates,
  setKillSwitch,
  isReadOnlyMode,
  isPublishFrozen,
  isAdminDisabled,
  type KillSwitchKey,
  type KillSwitchState,
} from "./killSwitch";

// Dependency isolation (external service protection)
export {
  ExternalDependency,
  withIsolation,
  withIsolationSync,
  getCircuitStatus,
  getAllCircuitStatuses,
  resetCircuit,
  type DependencyName,
  type IsolationOptions,
  type IsolationResult,
  type CircuitState,
} from "./isolation";

// Backpressure (load management)
export {
  TrafficClass,
  enforceBackpressure,
  requireBackpressure,
  canEnqueue,
  getQueueStatus,
  getAllQueueStatuses,
  getLoadMetrics,
  getLoadMetricsByClass,
  type TrafficClassification,
  type BackpressureResult,
  type BackpressureOptions,
  type QueueStatus,
  type LoadMetrics,
} from "./backpressure";

// Backup/Restore (data protection)
export {
  AuthoritativeDatasets,
  planBackup,
  executeBackup,
  verifyDataIntegrity,
  verifyBackup,
  getBackupStatus,
  type AuthoritativeDataset,
  type BackupPlan,
  type BackupResult,
  type InvariantCheck,
  type VerificationResult,
  type BackupStatus,
} from "./backup";

// Failure injection (chaos testing - TEST ONLY)
export {
  InjectionPoint,
  FailureMode,
  registerInjection,
  clearInjection,
  clearAllInjections,
  getActiveInjections,
  maybeInjectFailure,
  maybeInjectFailureSync,
  getInjectionStatus,
  type InjectionPointKey,
  type FailureModeKey,
  type InjectionConfig,
} from "./failureInjection";
