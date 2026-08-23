import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./database/prisma.js";
import { redis } from "./redis/redis.js";
import { emailWorkerService } from "./workers/email.worker.js";

const app = createApp();
const server = http.createServer(app);

// In monolithic / local dev mode, start the email worker alongside the server
if (process.env.RUN_INLINE_WORKER !== "false") {
  emailWorkerService.start();
}

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      instanceId: env.INSTANCE_ID
    },
    `🚀 API Server running on port ${env.PORT}`
  );
  logger.info(`📚 Swagger UI available at http://localhost:${env.PORT}/api/docs`);
});

// Graceful Shutdown
let isShuttingDown = false;

async function handleGracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}, initiating graceful shutdown...`);

  // Stop accepting new HTTP connections
  server.close(async () => {
    logger.info("HTTP server closed.");

    try {
      // Stop email worker
      await emailWorkerService.stop();

      // Disconnect Redis
      if ("quit" in redis && typeof redis.quit === "function") {
        await redis.quit();
        logger.info("Redis connection closed.");
      }

      // Disconnect Prisma
      await prisma.$disconnect();
      logger.info("Database connection closed.");

      logger.info("Graceful shutdown completed successfully.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    logger.error("Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

export { app, server };
