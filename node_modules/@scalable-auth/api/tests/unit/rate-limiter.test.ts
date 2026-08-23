import { describe, it, expect } from "vitest";
import { redis } from "../../src/redis/redis.js";

describe("Redis Sliding Window Rate Limiting Logic", () => {
  it("should enforce sliding window limits and calculate retry after", async () => {
    const key = `ratelimit:test:${Date.now()}`;
    const windowMs = 5000;
    const limit = 3;
    const now = Date.now();

    // Call 1
    const res1 = await redis.eval("", 1, key, now, windowMs, limit);
    expect(res1[0]).toBe(1); // allowed

    // Call 2
    const res2 = await redis.eval("", 1, key, now + 100, windowMs, limit);
    expect(res2[0]).toBe(1); // allowed

    // Call 3
    const res3 = await redis.eval("", 1, key, now + 200, windowMs, limit);
    expect(res3[0]).toBe(1); // allowed

    // Call 4 (should exceed limit)
    const res4 = await redis.eval("", 1, key, now + 300, windowMs, limit);
    expect(res4[0]).toBe(0); // blocked
    expect(res4[2]).toBeGreaterThan(0); // retryAfter > 0
  });
});
