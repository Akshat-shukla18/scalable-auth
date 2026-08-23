import { prisma } from "../../database/prisma.js";
import { Session } from "@prisma/client";
import { inMemoryAuthStore } from "../auth/auth.repository.js";
import { env } from "../../config/env.js";

export class SessionRepository {
  private useInMemory = env.NODE_ENV === "test";

  async getUserSessions(userId: string): Promise<Session[]> {
    if (this.useInMemory) {
      return Array.from(inMemoryAuthStore.sessions.values())
        .filter((s) => s.userId === userId && !s.revokedAt && s.expiresAt > new Date())
        .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
    }
    return prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastUsedAt: "desc" }
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<Session | null> {
    if (this.useInMemory) {
      const session = inMemoryAuthStore.sessions.get(sessionId);
      if (!session || session.userId !== userId) return null;
      session.revokedAt = new Date();
      return session;
    }
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId }
    });
    if (!session) return null;

    return prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });
  }
}

export const sessionRepository = new SessionRepository();
