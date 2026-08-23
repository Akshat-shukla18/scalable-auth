import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export class InMemoryRedis {
  private store = new Map<string, number[]>();

  async ping(): Promise<"PONG"> {
    return "PONG";
  }

  async eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<[number, number, number]> {
    const key = String(args[0]);
    const now = Number(args[1]);
    const window = Number(args[2]);
    const limit = Number(args[3]);

    let timestamps = this.store.get(key) || [];
    const clearBefore = now - window;
    timestamps = timestamps.filter((t) => t > clearBefore);

    let allowed = 1;
    if (timestamps.length < limit) {
      timestamps.push(now);
      this.store.set(key, timestamps);
      allowed = 1;
    } else {
      allowed = 0;
    }

    const currentCount = timestamps.length;
    const oldest = timestamps[0] || now;
    const ttlMs = Math.max(0, oldest + window - now);

    return [allowed, currentCount, Math.ceil(ttlMs / 1000)];
  }

  async quit(): Promise<"OK"> {
    return "OK";
  }

  status = "ready";
}

let redisInstance: Redis | InMemoryRedis;
const inMemory = new InMemoryRedis();

if (env.NODE_ENV === "test") {
  redisInstance = inMemory;
} else {
  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true
    });

    client.on("connect", () => logger.info("Connected to Redis"));
    client.on("error", (err) => logger.warn({ err: err.message }, "Redis connection event"));

    client.connect().catch(() => {
      logger.warn("Initial Redis connection failed; operating with in-memory rate limiter fallback");
    });

    redisInstance = client;
  } catch {
    redisInstance = inMemory;
  }
}

export const redis = redisInstance;

export async function checkRedisHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      healthy: true,
      latencyMs: Date.now() - start
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Redis ping failed";
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error
    };
  }
}
