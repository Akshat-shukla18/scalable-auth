import { SessionDto } from "@scalable-auth/shared";
import { sessionRepository, SessionRepository } from "./session.repository.js";
import { AppError } from "../../middleware/error-handler.js";
import { AuthErrorCode } from "@scalable-auth/shared";

export class SessionService {
  constructor(private repo: SessionRepository = sessionRepository) {}

  async listSessions(userId: string, currentSessionId?: string): Promise<SessionDto[]> {
    const sessions = await this.repo.getUserSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt.toISOString(),
      isCurrent: s.id === currentSessionId
    }));
  }

  async revokeSession(sessionId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const revoked = await this.repo.revokeSession(sessionId, userId);
    if (!revoked) {
      throw new AppError(404, AuthErrorCode.UNAUTHORIZED, "Session not found or already revoked");
    }
    return { success: true, message: "Session revoked successfully" };
  }
}

export const sessionService = new SessionService();
