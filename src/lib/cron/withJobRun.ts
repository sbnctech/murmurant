/**
 * withJobRun - Idempotent job execution wrapper
 *
 * Charter Principles:
 * - P7: Observability is a product feature (tracks job executions)
 * - P9: Security must fail closed (handles errors gracefully)
 *
 * Uses the UNIQUE(jobName, scheduledFor) constraint to ensure
 * a job only runs once per scheduled date.
 */

import { prisma } from "@/lib/prisma";
import { JobRunStatus, Prisma } from "@prisma/client";

export interface JobRunOptions {
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export interface JobRunResult<T> {
  runId: string;
  executed: boolean;
  status: JobRunStatus;
  result?: T;
  error?: string;
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req-${timestamp}-${random}`;
}

/**
 * Wrap a job function with idempotency guarantee.
 *
 * If a job with the same name has already been executed for the given date,
 * it will be skipped and return the existing run's status.
 *
 * @param jobName - Unique identifier for the job (e.g., "transitions")
 * @param scheduledFor - The date the job is scheduled for (truncated to date)
 * @param fn - The async function to execute
 * @param options - Optional request ID and metadata
 * @returns JobRunResult with execution status and optional result
 */
export async function withJobRun<T>(
  jobName: string,
  scheduledFor: Date,
  fn: () => Promise<T>,
  options: JobRunOptions = {}
): Promise<JobRunResult<T>> {
  const { requestId, metadata } = options;

  // Normalize to date only (midnight UTC)
  const normalizedDate = new Date(
    Date.UTC(
      scheduledFor.getFullYear(),
      scheduledFor.getMonth(),
      scheduledFor.getDate()
    )
  );

  // Try to create a new job run (idempotency check via UNIQUE constraint)
  let jobRun;
  try {
    jobRun = await prisma.jobRun.create({
      data: {
        jobName,
        scheduledFor: normalizedDate,
        requestId,
        status: "PENDING",
        metadata: metadata as Prisma.JsonObject,
      },
    });
  } catch (error) {
    // Check if this is a unique constraint violation (job already exists)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Job already ran for this date - return SKIPPED
      const existingRun = await prisma.jobRun.findUnique({
        where: {
          jobName_scheduledFor: {
            jobName,
            scheduledFor: normalizedDate,
          },
        },
      });

      if (existingRun) {
        console.log(`[${jobName}] Job already executed for ${normalizedDate.toISOString().split("T")[0]}`, {
          runId: existingRun.id,
          status: existingRun.status,
          requestId,
        });

        return {
          runId: existingRun.id,
          executed: false,
          status: existingRun.status,
        };
      }
    }
    throw error;
  }

  // Mark as running
  await prisma.jobRun.update({
    where: { id: jobRun.id },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  console.log(`[${jobName}] Starting job execution`, {
    runId: jobRun.id,
    scheduledFor: normalizedDate.toISOString().split("T")[0],
    requestId,
  });

  try {
    // Execute the job function
    const result = await fn();

    // Mark as successful
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
      },
    });

    console.log(`[${jobName}] Job completed successfully`, {
      runId: jobRun.id,
      requestId,
    });

    return {
      runId: jobRun.id,
      executed: true,
      status: "SUCCESS",
      result,
    };
  } catch (error) {
    // Mark as failed
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorSummary: errorMessage.substring(0, 1000), // Truncate long errors
      },
    });

    console.error(`[${jobName}] Job execution failed`, {
      runId: jobRun.id,
      error: errorMessage,
      requestId,
    });

    return {
      runId: jobRun.id,
      executed: true,
      status: "FAILED",
      error: errorMessage,
    };
  }
}

/**
 * Get the most recent job run for a given job name
 */
export async function getLatestJobRun(jobName: string) {
  return prisma.jobRun.findFirst({
    where: { jobName },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get job run history for a given job name
 */
export async function getJobRunHistory(
  jobName: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 10, offset = 0 } = options;

  return prisma.jobRun.findMany({
    where: { jobName },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
