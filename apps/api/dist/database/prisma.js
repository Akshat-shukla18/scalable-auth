import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger.js";
export const prisma = globalThis.__prisma ||
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
export async function checkDbHealth() {
    const start = Date.now();
    try {
        await prisma.$queryRaw `SELECT 1`;
        return {
            healthy: true,
            latencyMs: Date.now() - start
        };
    }
    catch (err) {
        const error = err instanceof Error ? err.message : "Database connection failed";
        logger.error({ err }, "Database health check failed");
        return {
            healthy: false,
            latencyMs: Date.now() - start,
            error
        };
    }
}
//# sourceMappingURL=prisma.js.map