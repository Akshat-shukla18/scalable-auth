import { Request, Response } from "express";
import os from "node:os";
import { env } from "../../config/env.js";
import { checkDbHealth } from "../../database/prisma.js";
import { checkRedisHealth } from "../../redis/redis.js";
import { getQueueMetrics } from "../../queues/email.queue.js";
import { SystemMetricsDto } from "@scalable-auth/shared";

let activeRequestsCount = 0;

export function trackActiveRequests(req: Request, res: Response, next: () => void) {
  activeRequestsCount++;
  res.on("finish", () => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  });
  next();
}

export class SystemController {
  health = (req: Request, res: Response): void => {
    res.status(200).json({
      status: "healthy",
      instanceId: env.INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  };

  ready = async (req: Request, res: Response): Promise<void> => {
    const [dbHealth, redisHealth] = await Promise.all([
      checkDbHealth(),
      checkRedisHealth()
    ]);

    const isReady = dbHealth.healthy && redisHealth.healthy;
    const status = isReady ? 200 : 503;

    res.status(status).json({
      status: isReady ? "ready" : "not_ready",
      instanceId: env.INSTANCE_ID,
      timestamp: new Date().toISOString(),
      components: {
        database: dbHealth,
        redis: redisHealth
      }
    });
  };

  metrics = async (req: Request, res: Response): Promise<void> => {
    const [dbHealth, redisHealth, queueMetrics] = await Promise.all([
      checkDbHealth(),
      checkRedisHealth(),
      getQueueMetrics()
    ]);

    const memory = process.memoryUsage();
    const metrics: SystemMetricsDto = {
      instanceId: env.INSTANCE_ID,
      hostname: os.hostname(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: {
        rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100
      },
      activeRequests: activeRequestsCount,
      queueMetrics,
      redisConnected: redisHealth.healthy,
      dbConnected: dbHealth.healthy,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: metrics
    });
  };
}

export const systemController = new SystemController();
