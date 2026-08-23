import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { MockEmailProvider } from "../../src/services/email/mock.provider.js";
import { AUTH_COOKIE_NAME } from "../../src/config/constants.js";

const app = createApp();

describe("Auth Lifecycle Integration Tests", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "SuperPassword123!#";
  let accessToken: string;
  let sessionCookie: string;

  it("1. POST /api/auth/register should create user and send OTP", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Integration Test User",
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.emailVerified).toBe(false);
  });

  it("2. POST /api/auth/login should be rejected before email verification", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("3. POST /api/auth/verify-email should verify email with code from mock mailbox", async () => {
    const code = MockEmailProvider.getLatestCodeForEmail(testEmail);
    expect(code).toBeDefined();

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({
        email: testEmail,
        code: code!
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("4. POST /api/auth/login should succeed and return access token & set refresh cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    accessToken = res.body.data.tokens.accessToken;

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const refreshCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))
      : cookies;
    expect(refreshCookie).toBeDefined();
    sessionCookie = refreshCookie!;
  });

  it("5. GET /api/auth/me should return authenticated user profile", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it("6. POST /api/auth/refresh should rotate refresh token and issue new access token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.expiresIn).toBe(900);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const newRefreshCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))
      : cookies;
    expect(newRefreshCookie).toBeDefined();
    expect(newRefreshCookie).not.toBe(sessionCookie);

    // Update tokens for subsequent requests
    accessToken = res.body.data.tokens.accessToken;
    sessionCookie = newRefreshCookie!;
  });

  it("7. GET /api/sessions should list active sessions", async () => {
    const res = await request(app)
      .get("/api/sessions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("8. POST /api/auth/logout should revoke session and clear cookie", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
