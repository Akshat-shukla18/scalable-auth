import { Request, Response, NextFunction } from "express";
import { sessionService, SessionService } from "./session.service.js";
import { ApiSuccessResponse } from "@scalable-auth/shared";

export class SessionController {
  constructor(private service: SessionService = sessionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const currentSessionId = req.user?.sessionId;
      const sessions = await this.service.listSessions(userId, currentSessionId);

      const response: ApiSuccessResponse = {
        success: true,
        data: sessions,
        meta: { requestId: req.id, timestamp: new Date().toISOString() }
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  revoke = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await this.service.revokeSession(sessionId, userId);

      const response: ApiSuccessResponse = {
        success: true,
        data: result,
        meta: { requestId: req.id, timestamp: new Date().toISOString() }
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const sessionController = new SessionController();
