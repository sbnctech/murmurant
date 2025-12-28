/**
 * Auth Service Interface Types
 */

import type { GlobalRole } from "@/lib/auth";

export interface AuthSession {
  id: string;
  userAccountId: string;
  email: string;
  globalRole: GlobalRole;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

export interface CreateSessionInput {
  userAccountId: string;
  email: string;
  globalRole: GlobalRole;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  globalRole: GlobalRole;
  memberId: string | null;
  isActive: boolean;
}

export interface AuthContext {
  user: AuthUser;
  session: AuthSession;
  impersonation: ImpersonationContext | null;
}

export interface ImpersonationContext {
  memberId: string;
  memberName: string;
  memberEmail: string;
  impersonatedAt: Date;
}

export interface AuthService {
  createSession(params: CreateSessionInput): Promise<string>;
  validateSession(token: string): Promise<AuthSession | null>;
  revokeSession(token: string, revokedById?: string, reason?: string): Promise<boolean>;
  revokeAllSessions(userAccountId: string, revokedById?: string, reason?: string): Promise<number>;
  getCurrentSession(): Promise<AuthSession | null>;
  getAuthContext(): Promise<AuthContext | null>;
}
