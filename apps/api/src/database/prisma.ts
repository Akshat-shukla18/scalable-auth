import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger.js";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" }
    ]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// Health check method
export async function checkDbHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      healthy: true,
      latencyMs: Date.now() - start
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Database connection failed";
    logger.error({ err }, "Database health check failed");
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error
    };
  }
}
