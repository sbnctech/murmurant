import type { AuthService } from "./AuthService";
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from "./types";

/**
 * Native authentication service implementation.
 * Uses database-backed user accounts and sessions.
 */
export class NativeAuthService implements AuthService {
  async login(_credentials: LoginCredentials): Promise<AuthSession> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }

  async logout(_sessionId: string): Promise<void> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }

  async register(_data: RegisterData): Promise<AuthUser> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }

  async verifySession(_token: string): Promise<AuthSession | null> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }

  async refreshSession(_token: string): Promise<AuthSession> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }

  async requestPasswordReset(_email: string): Promise<void> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }

  async getUserById(_userId: string): Promise<AuthUser | null> {
    // TODO: Implement with Prisma
    throw new Error("Not implemented");
  }
}
