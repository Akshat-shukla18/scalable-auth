import { Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { QUEUE_NAMES } from "../config/constants.js";
import { getEmailProvider } from "../services/email/email.factory.js";
import { SendEmailParams } from "../services/email/email.interface.js";

export class EmailWorkerService {
  private worker: Worker | null = null;
  private isShuttingDown = false;

  start() {
    if (this.worker) return;

    const emailProvider = getEmailProvider();
    const redisUrl = new URL(env.REDIS_URL);

    try {
      this.worker = new Worker<SendEmailParams>(
        QUEUE_NAMES.EMAIL,
        async (job: Job<SendEmailParams>) => {
          logger.info(
            { jobId: job.id, attempt: job.attemptsMade + 1, to: job.data.to, subject: job.data.subject },
            "⚡ Processing email job from BullMQ queue"
          );

          const result = await emailProvider.sendEmail(job.data);
          if (!result.success) {
            logger.error({ jobId: job.id, error: result.error }, "Email delivery failed via provider");
            throw new Error(`Email provider error: ${result.error || "Unknown delivery failure"}`);
          }

          logger.info({ jobId: job.id, messageId: result.messageId }, "✅ Email job completed successfully");
          return result;
        },
        {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port) || 6379,
            password: redisUrl.password || undefined,
            maxRetriesPerRequest: null
          },
          concurrency: 10,
          limiter: {
            max: 50,
            duration: 1000
          }
        }
      );

      this.worker.on("completed", (job) => {
        logger.debug({ jobId: job.id }, "Job completed successfully");
      });

      this.worker.on("failed", (job, err) => {
        const attemptsLeft = (job?.opts.attempts || 3) - (job?.attemptsMade || 0);
        logger.error(
          {
            jobId: job?.id,
            err: err.message,
            attemptsMade: job?.attemptsMade,
            attemptsLeft
          },
          attemptsLeft > 0 ? "⚠️ Job failed, will retry with backoff" : "❌ Job dead-lettered / failed all retries"
        );
      });

      this.worker.on("error", (err) => {
        if (!this.isShuttingDown) {
          logger.warn({ err: err.message }, "BullMQ Worker connection event");
        }
      });

      logger.info({ provider: emailProvider.name }, "🚀 Email Worker initialized and listening for jobs");
    } catch (err) {
      logger.warn({ err }, "Could not start BullMQ Worker (Redis might be in mock mode)");
    }
  }

  async stop() {
    this.isShuttingDown = true;
    if (this.worker) {
      logger.info("Closing Email Worker gracefully...");
      await this.worker.close();
      this.worker = null;
    }
  }
}

export const emailWorkerService = new EmailWorkerService();
