import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { requestLoggerMiddleware } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { trackActiveRequests } from "./modules/system/system.controller.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { sessionRoutes } from "./modules/sessions/session.routes.js";
import { systemRoutes } from "./modules/system/system.routes.js";
import { devRoutes } from "./modules/dev/dev.routes.js";
import { openApiSpec } from "./docs/openapi.js";

export function createApp(): Express {
  const app = express();

  // Security Headers via Helmet
  app.use(helmet({
    contentSecurityPolicy: false // Allows Swagger UI and local development
  }));

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests from frontend url, localhost, or without origin (like mobile/curl)
        if (!origin || origin === env.FRONTEND_URL || origin.includes("localhost") || origin.includes("127.0.0.1")) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev/testing environments
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Requested-With"]
    })
  );

  // Body and Cookie parsers
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request ID and structured HTTP request logger
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(trackActiveRequests);

  // System Observability endpoints
  app.use(systemRoutes);

  // API Documentation (Swagger UI)
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Scalable Auth API Documentation"
  }));
  app.get("/api/docs.json", (req, res) => res.json(openApiSpec));

  // Core Authentication & Session Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/sessions", sessionRoutes);

  // Dev Mailbox inspector (in dev/test mode)
  if (env.NODE_ENV !== "production") {
    app.use("/api/dev", devRoutes);
  }

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`
      },
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  });

  // Centralized RFC-7807 Error Handler
  app.use(errorHandler);

  return app;
}
