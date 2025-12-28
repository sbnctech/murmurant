export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  memberId?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}
