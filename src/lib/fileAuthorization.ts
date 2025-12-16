/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest } from "next/server";
import type { GlobalRole } from "@/lib/auth";

export const FileObjectType = {
  EVENT: "EVENT",
  MEMBER: "MEMBER",
  COMMITTEE: "COMMITTEE",
  BOARD_RECORD: "BOARD_RECORD",
  GENERAL: "GENERAL",
} as const;
export type FileObjectType = (typeof FileObjectType)[keyof typeof FileObjectType];

export type FileVisibility = "PUBLIC" | "MEMBERS_ONLY" | "COMMITTEE_ONLY" | "BOARD_ONLY" | "PRIVATE";

export type FileAuthResult =
  | { authorized: true; context: { globalRole: GlobalRole; memberId: string } }
  | { authorized: false; reason: string; status: 401 | 403 };

export async function authorizeFileAccess(_req: NextRequest, _fileId: string): Promise<FileAuthResult> {
  throw new Error("Not implemented");
}

export async function authorizeFileList(_req: NextRequest): Promise<FileAuthResult> {
  throw new Error("Not implemented");
}

export function getVisibilityFilter(_role: GlobalRole): any {
  throw new Error("Not implemented");
}
