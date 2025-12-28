import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from "./types";

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(sessionId: string): Promise<void>;
  register(data: RegisterData): Promise<AuthUser>;
  verifySession(token: string): Promise<AuthSession | null>;
  refreshSession(token: string): Promise<AuthSession>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  getUserById(userId: string): Promise<AuthUser | null>;
}
