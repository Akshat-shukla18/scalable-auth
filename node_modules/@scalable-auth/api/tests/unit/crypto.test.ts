import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateVerificationCode,
  hashToken,
  generateSecureToken
} from "../../src/utils/crypto.js";

describe("Cryptography & Hashing Utilities", () => {
  it("should hash passwords using Argon2id and verify correctly", async () => {
    const password = "StrongPassword123!@#";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$argon2id$")).toBe(true);

    const isMatch = await verifyPassword(hash, password);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword(hash, "WrongPassword123!");
    expect(isWrongMatch).toBe(false);
  });

  it("should generate cryptographically secure 6-digit numeric codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const code = generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code, 10)).toBeLessThan(1000000);
      codes.add(code);
    }
    // High entropy check: across 50 generations, there should be high uniqueness
    expect(codes.size).toBeGreaterThan(45);
  });

  it("should deterministically hash tokens with SHA-256", () => {
    const token = "my-secret-random-token-string";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toHaveLength(64); // 256 bits = 64 hex chars
    expect(hash1).toBe(hash2);

    const diffHash = hashToken("different-token");
    expect(hash1).not.toBe(diffHash);
  });

  it("should generate secure random hex tokens", () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);

    expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });
});
