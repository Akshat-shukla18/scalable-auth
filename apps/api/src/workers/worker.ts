import { emailWorkerService } from "./email.worker.js";
import { logger } from "../config/logger.js";

logger.info("Starting standalone BullMQ Email Worker process...");
emailWorkerService.start();

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down email worker...`);
  await emailWorkerService.stop();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
