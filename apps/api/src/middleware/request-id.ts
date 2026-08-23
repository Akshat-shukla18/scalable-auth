import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header("x-request-id");
  const id = incomingId && typeof incomingId === "string" ? incomingId : crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
