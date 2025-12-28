import type { AuthService } from "./AuthService";
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from "./types";

/**
 * Mock authentication service for testing.
 */
export class MockAuthService implements AuthService {
  private users: Map<string, AuthUser & { passwordHash: string }> = new Map();
  private sessions: Map<string, AuthSession> = new Map();

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const user = Array.from(this.users.values()).find(
      (u) => u.email === credentials.email
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }
    // In mock, just check password equals hash (no real hashing)
    if (user.passwordHash !== credentials.password) {
      throw new Error("Invalid credentials");
    }

    const session: AuthSession = {
      id: `session_${Date.now()}`,
      userId: user.id,
      token: `token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async logout(sessionId: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.id === sessionId) {
        this.sessions.delete(token);
        return;
      }
    }
  }

  async register(data: RegisterData): Promise<AuthUser> {
    if (Array.from(this.users.values()).some((u) => u.email === data.email)) {
      throw new Error("Email already registered");
    }

    const user: AuthUser & { passwordHash: string } = {
      id: `user_${Date.now()}`,
      email: data.email,
      emailVerified: false,
      passwordHash: data.password, // Mock: store plain password
    };
    this.users.set(user.id, user);

    const { passwordHash: _, ...authUser } = user;
    return authUser;
  }

  async verifySession(token: string): Promise<AuthSession | null> {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  async refreshSession(token: string): Promise<AuthSession> {
    const session = this.sessions.get(token);
    if (!session) {
      throw new Error("Session not found");
    }

    const newSession: AuthSession = {
      ...session,
      token: `token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    this.sessions.delete(token);
    this.sessions.set(newSession.token, newSession);
    return newSession;
  }

  async requestPasswordReset(_email: string): Promise<void> {
    // Mock: no-op
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    // Mock: no-op
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    const { passwordHash: _, ...authUser } = user;
    return authUser;
  }
}
