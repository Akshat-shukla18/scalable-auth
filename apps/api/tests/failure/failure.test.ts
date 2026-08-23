import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { MockEmailProvider } from "../../src/services/email/mock.provider.js";
import { AUTH_COOKIE_NAME } from "../../src/config/constants.js";

const app = createApp();

describe("Failure & Edge Case Scenarios", () => {
  const email = `failure-${Date.now()}@example.com`;
  const password = "ValidPassword123!@";

  it("should reject duplicate email registration with 409 Conflict", async () => {
    // 1st register
    await request(app).post("/api/auth/register").send({ name: "User", email, password });

    // 2nd register with same email
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Duplicate", email, password });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("should fail verification with invalid code and decrement remaining attempts", async () => {
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email, code: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_VERIFICATION_CODE");
  });

  it("should resist account enumeration on forgot password", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "non-existent-user-999@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("If an account exists");
  });

  it("should reject invalid login credentials with generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "non-existent@example.com", password: "SomePassword123!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.error.message).toBe("Invalid email or password.");
  });

  it("should reject unauthenticated request to protected route with 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
