import { Queue } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { QUEUE_NAMES, JOB_NAMES } from "../config/constants.js";
import { getEmailProvider } from "../services/email/email.factory.js";

export interface VerificationEmailJobData {
  to: string;
  name: string;
  code: string;
  expiresInMinutes: number;
}

export interface PasswordResetEmailJobData {
  to: string;
  name: string;
  code: string;
  expiresInMinutes: number;
}

let bullQueue: Queue | null = null;
let useDirectFallback = false;

try {
  const redisUrl = new URL(env.REDIS_URL);
  bullQueue = new Queue(QUEUE_NAMES.EMAIL, {
    connection: {
      host: redisUrl.hostname,
      port: Number(redisUrl.port) || 6379,
      password: redisUrl.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      },
      removeOnComplete: { count: 1000, age: 3600 },
      removeOnFail: { count: 5000, age: 86400 }
    }
  });

  bullQueue.on("error", (err) => {
    logger.warn({ err: err.message }, "BullMQ Queue connection warning; fallback available");
    useDirectFallback = true;
  });
} catch (err) {
  logger.warn({ err }, "Could not initialize BullMQ Queue, using direct provider fallback");
  useDirectFallback = true;
}

export async function queueVerificationEmail(data: VerificationEmailJobData): Promise<string> {
  const subject = "Verify your email address";
  const text = `Hello ${data.name},\n\nYour 6-digit verification code is: ${data.code}\n\nThis code will expire in ${data.expiresInMinutes} minutes.\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email Address</h2>
      <p style="color: #475569;">Hello <strong>${data.name}</strong>,</p>
      <p style="color: #475569;">Thank you for registering. Please enter the following 6-digit verification code to complete your signup:</p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${data.code}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">This code will expire in <strong>${data.expiresInMinutes} minutes</strong>. If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;

  if (bullQueue && !useDirectFallback) {
    try {
      const job = await bullQueue.add(
        JOB_NAMES.SEND_VERIFICATION_EMAIL,
        {
          to: data.to,
          subject,
          text,
          html,
          metadata: { userId: data.to, type: "verification" }
        },
        {
          jobId: `verify-${data.to}-${Date.now()}`
        }
      );
      logger.info({ jobId: job.id, to: data.to }, "Verification email job enqueued into BullMQ");
      return job.id || "enqueued";
    } catch (err: any) {
      logger.warn({ err: err.message }, "Failed to add job to BullMQ, executing through fallback provider");
    }
  }

  // Direct asynchronous dispatch fallback
  const provider = getEmailProvider();
  provider.sendEmail({
    to: data.to,
    subject,
    text,
    html,
    metadata: { userId: data.to, type: "verification" }
  }).catch((err) => {
    logger.error({ err }, "Direct email dispatch fallback error");
  });

  return "direct-fallback-dispatched";
}

export async function queuePasswordResetEmail(data: PasswordResetEmailJobData): Promise<string> {
  const subject = "Reset your password";
  const text = `Hello ${data.name},\n\nYour 6-digit password reset code is: ${data.code}\n\nThis code will expire in ${data.expiresInMinutes} minutes.\nIf you did not request this, please secure your account.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
      <p style="color: #475569;">Hello <strong>${data.name}</strong>,</p>
      <p style="color: #475569;">We received a request to reset your password. Use the following code to proceed:</p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #dc2626; font-family: monospace;">${data.code}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">This code will expire in <strong>${data.expiresInMinutes} minutes</strong>. If you did not request a password reset, please change your password immediately.</p>
    </div>
  `;

  if (bullQueue && !useDirectFallback) {
    try {
      const job = await bullQueue.add(
        JOB_NAMES.SEND_PASSWORD_RESET_EMAIL,
        {
          to: data.to,
          subject,
          text,
          html,
          metadata: { userId: data.to, type: "password-reset" }
        },
        {
          jobId: `reset-${data.to}-${Date.now()}`
        }
      );
      return job.id || "enqueued";
    } catch (err: any) {
      logger.warn({ err: err.message }, "Failed to enqueue password reset job, falling back to direct");
    }
  }

  const provider = getEmailProvider();
  provider.sendEmail({
    to: data.to,
    subject,
    text,
    html,
    metadata: { userId: data.to, type: "password-reset" }
  }).catch((err) => {
    logger.error({ err }, "Direct password reset email fallback error");
  });

  return "direct-fallback-dispatched";
}

export async function getQueueMetrics() {
  if (!bullQueue) {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      bullQueue.getWaitingCount(),
      bullQueue.getActiveCount(),
      bullQueue.getCompletedCount(),
      bullQueue.getFailedCount(),
      bullQueue.getDelayedCount()
    ]);
    return { waiting, active, completed, failed, delayed };
  } catch {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }
}
