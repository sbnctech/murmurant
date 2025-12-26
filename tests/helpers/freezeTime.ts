// Copyright (c) Santa Barbara Newcomers Club
// Shared helper for freezing time in unit tests

import { vi } from "vitest";

/**
 * Freeze time at a specific instant for deterministic testing.
 * Uses Vitest's fake timers under the hood.
 *
 * @param time - ISO string, Date, or timestamp in milliseconds
 * @returns The timestamp that was set
 *
 * @example
 * freezeTime("2025-01-15T12:00:00Z");
 * expect(Date.now()).toBe(new Date("2025-01-15T12:00:00Z").getTime());
 */
export function freezeTime(time: string | Date | number): number {
  const timestamp = typeof time === "number" ? time : new Date(time).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid time value: ${time}`);
  }
  vi.useFakeTimers();
  vi.setSystemTime(timestamp);
  return timestamp;
}

/**
 * Restore real timers. Call this in afterEach to clean up.
 */
export function restoreTime(): void {
  vi.useRealTimers();
}

/**
 * Advance frozen time by a given number of milliseconds.
 * Only works when time is frozen.
 *
 * @param ms - Milliseconds to advance
 * @returns The new timestamp
 */
export function advanceTime(ms: number): number {
  vi.advanceTimersByTime(ms);
  return Date.now();
}

/**
 * Set frozen time to a new value without re-initializing fake timers.
 * Useful for testing multiple time points in sequence.
 *
 * @param time - ISO string, Date, or timestamp in milliseconds
 * @returns The timestamp that was set
 */
export function setFrozenTime(time: string | Date | number): number {
  const timestamp = typeof time === "number" ? time : new Date(time).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid time value: ${time}`);
  }
  vi.setSystemTime(timestamp);
  return timestamp;
}

/**
 * Common time durations in milliseconds for convenience.
 */
export const Duration = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;
