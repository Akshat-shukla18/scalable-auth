import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken } from "../../src/utils/jwt.js";

describe("JWT Access Token Utilities", () => {
  it("should sign and verify access token payload correctly", () => {
    const payload = {
      sub: "user-123",
      sessionId: "session-456",
      email: "user@example.com",
      emailVerified: true
    };

    const { token, expiresInSeconds } = signAccessToken(payload);

    expect(token).toBeDefined();
    expect(expiresInSeconds).toBeGreaterThan(0);

    const verified = verifyAccessToken(token);
    expect(verified.sub).toBe("user-123");
    expect(verified.sessionId).toBe("session-456");
    expect(verified.email).toBe("user@example.com");
    expect(verified.emailVerified).toBe(true);
    expect(verified.iss).toBe("scalable-auth-api");
  });

  it("should throw error when verifying invalid or tampered tokens", () => {
    expect(() => verifyAccessToken("invalid.tampered.token")).toThrow();
  });
});
