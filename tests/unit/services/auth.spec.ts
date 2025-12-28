import { describe, it, expect, beforeEach } from "vitest";
import { MockAuthService } from "@/services/auth/MockAuthService";
import { NativeAuthService } from "@/services/auth/NativeAuthService";

describe("MockAuthService", () => {
  let auth: MockAuthService;

  beforeEach(() => {
    auth = new MockAuthService();
  });

  describe("registration", () => {
    it("creates new user with valid data", async () => {
      const user = await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      expect(user.email).toBe("test@example.com");
      expect(user.id).toBeDefined();
      expect(user.emailVerified).toBe(false);
    });

    it("rejects duplicate email", async () => {
      await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      await expect(
        auth.register({ email: "test@example.com", password: "password456" })
      ).rejects.toThrow("Email already registered");
    });

    it("generates user IDs starting with user_", async () => {
      const user = await auth.register({
        email: "user1@example.com",
        password: "pass1",
      });
      expect(user.id).toMatch(/^user_\d+$/);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await auth.register({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("returns session for valid credentials", async () => {
      const session = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      expect(session.token).toBeDefined();
      expect(session.userId).toBeDefined();
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it("rejects invalid password", async () => {
      await expect(
        auth.login({ email: "test@example.com", password: "wrongpassword" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("rejects non-existent user", async () => {
      await expect(
        auth.login({ email: "nobody@example.com", password: "password123" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("generates unique session tokens", async () => {
      const session1 = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      const session2 = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      expect(session1.token).not.toBe(session2.token);
    });
  });

  describe("session verification", () => {
    let token: string;

    beforeEach(async () => {
      await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      const session = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      token = session.token;
    });

    it("verifies valid session", async () => {
      const session = await auth.verifySession(token);
      expect(session).not.toBeNull();
      expect(session?.token).toBe(token);
    });

    it("returns null for invalid token", async () => {
      const session = await auth.verifySession("invalid_token");
      expect(session).toBeNull();
    });

    it("returns null for logged out session", async () => {
      const session = await auth.verifySession(token);
      await auth.logout(session!.id);
      const verifiedSession = await auth.verifySession(token);
      expect(verifiedSession).toBeNull();
    });
  });

  describe("session refresh", () => {
    let token: string;

    beforeEach(async () => {
      await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      const session = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      token = session.token;
    });

    it("returns new session with new token", async () => {
      const newSession = await auth.refreshSession(token);
      expect(newSession.token).not.toBe(token);
      expect(newSession.userId).toBeDefined();
    });

    it("invalidates old token after refresh", async () => {
      await auth.refreshSession(token);
      const oldSession = await auth.verifySession(token);
      expect(oldSession).toBeNull();
    });

    it("throws for invalid token", async () => {
      await expect(auth.refreshSession("invalid_token")).rejects.toThrow(
        "Session not found"
      );
    });
  });

  describe("getUserById", () => {
    it("returns user for valid ID", async () => {
      const registered = await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      const user = await auth.getUserById(registered.id);
      expect(user).not.toBeNull();
      expect(user?.email).toBe("test@example.com");
    });

    it("returns null for invalid ID", async () => {
      const user = await auth.getUserById("nonexistent_id");
      expect(user).toBeNull();
    });

    it("does not expose password hash", async () => {
      const registered = await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      const user = await auth.getUserById(registered.id);
      expect((user as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });
});

describe("NativeAuthService", () => {
  let auth: NativeAuthService;

  beforeEach(() => {
    auth = new NativeAuthService();
  });

  describe("interface compliance", () => {
    it("implements AuthService interface", () => {
      expect(typeof auth.login).toBe("function");
      expect(typeof auth.logout).toBe("function");
      expect(typeof auth.register).toBe("function");
      expect(typeof auth.verifySession).toBe("function");
      expect(typeof auth.refreshSession).toBe("function");
      expect(typeof auth.requestPasswordReset).toBe("function");
      expect(typeof auth.resetPassword).toBe("function");
      expect(typeof auth.getUserById).toBe("function");
    });

    it("login throws not implemented", async () => {
      await expect(
        auth.login({ email: "test@example.com", password: "password" })
      ).rejects.toThrow("Not implemented");
    });

    it("register throws not implemented", async () => {
      await expect(
        auth.register({ email: "test@example.com", password: "password" })
      ).rejects.toThrow("Not implemented");
    });
  });
});
