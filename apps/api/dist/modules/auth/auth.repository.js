import { prisma } from "../../database/prisma.js";
import { env } from "../../config/env.js";
// In-memory test store for test execution when DB is offline
class InMemoryAuthStore {
    users = new Map();
    codes = new Map();
    sessions = new Map();
    clear() {
        this.users.clear();
        this.codes.clear();
        this.sessions.clear();
    }
}
export const inMemoryAuthStore = new InMemoryAuthStore();
export class AuthRepository {
    useInMemory = env.NODE_ENV === "test";
    async findUserByEmail(email) {
        if (this.useInMemory) {
            for (const u of inMemoryAuthStore.users.values()) {
                if (u.email.toLowerCase() === email.toLowerCase())
                    return u;
            }
            return null;
        }
        try {
            return await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        }
        catch {
            return null;
        }
    }
    async findUserById(id) {
        if (this.useInMemory) {
            return inMemoryAuthStore.users.get(id) || null;
        }
        try {
            return await prisma.user.findUnique({ where: { id } });
        }
        catch {
            return null;
        }
    }
    async createUser(data) {
        if (this.useInMemory) {
            const user = {
                id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: data.name,
                email: data.email.toLowerCase(),
                passwordHash: data.passwordHash,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            inMemoryAuthStore.users.set(user.id, user);
            return user;
        }
        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email.toLowerCase(),
                passwordHash: data.passwordHash,
                emailVerified: false
            }
        });
    }
    async updateEmailVerified(userId, isVerified) {
        if (this.useInMemory) {
            const user = inMemoryAuthStore.users.get(userId);
            if (!user)
                throw new Error("User not found");
            user.emailVerified = isVerified;
            user.updatedAt = new Date();
            return user;
        }
        return prisma.user.update({
            where: { id: userId },
            data: { emailVerified: isVerified }
        });
    }
    async updateUserPassword(userId, newPasswordHash) {
        if (this.useInMemory) {
            const user = inMemoryAuthStore.users.get(userId);
            if (!user)
                throw new Error("User not found");
            user.passwordHash = newPasswordHash;
            user.updatedAt = new Date();
            return user;
        }
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });
    }
    async createVerificationCode(data) {
        if (this.useInMemory) {
            const code = {
                id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                userId: data.userId,
                codeHash: data.codeHash,
                type: data.type,
                expiresAt: data.expiresAt,
                attempts: 0,
                maxAttempts: data.maxAttempts,
                usedAt: null,
                createdAt: new Date()
            };
            inMemoryAuthStore.codes.set(code.id, code);
            return code;
        }
        return prisma.verificationCode.create({ data });
    }
    async findLatestActiveVerificationCode(userId, type) {
        if (this.useInMemory) {
            const codes = Array.from(inMemoryAuthStore.codes.values())
                .filter((c) => c.userId === userId && c.type === type && c.usedAt === null)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return codes[0] || null;
        }
        return prisma.verificationCode.findFirst({
            where: { userId, type, usedAt: null },
            orderBy: { createdAt: "desc" }
        });
    }
    async incrementVerificationAttempts(id) {
        if (this.useInMemory) {
            const code = inMemoryAuthStore.codes.get(id);
            if (!code)
                throw new Error("Code not found");
            code.attempts += 1;
            return code;
        }
        return prisma.verificationCode.update({
            where: { id },
            data: { attempts: { increment: 1 } }
        });
    }
    async markVerificationCodeUsed(id) {
        if (this.useInMemory) {
            const code = inMemoryAuthStore.codes.get(id);
            if (!code)
                throw new Error("Code not found");
            code.usedAt = new Date();
            return code;
        }
        return prisma.verificationCode.update({
            where: { id },
            data: { usedAt: new Date() }
        });
    }
    async invalidateExistingCodes(userId, type) {
        if (this.useInMemory) {
            for (const c of inMemoryAuthStore.codes.values()) {
                if (c.userId === userId && c.type === type && c.usedAt === null) {
                    c.usedAt = new Date();
                }
            }
            return;
        }
        await prisma.verificationCode.updateMany({
            where: { userId, type, usedAt: null },
            data: { usedAt: new Date() }
        });
    }
    async createSession(data) {
        if (this.useInMemory) {
            const session = {
                id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                userId: data.userId,
                refreshTokenHash: data.refreshTokenHash,
                userAgent: data.userAgent || null,
                ipAddress: data.ipAddress || null,
                expiresAt: data.expiresAt,
                revokedAt: null,
                createdAt: new Date(),
                lastUsedAt: new Date()
            };
            inMemoryAuthStore.sessions.set(session.id, session);
            return session;
        }
        return prisma.session.create({ data });
    }
    async findSessionByRefreshTokenHash(refreshTokenHash) {
        if (this.useInMemory) {
            for (const s of inMemoryAuthStore.sessions.values()) {
                if (s.refreshTokenHash === refreshTokenHash)
                    return s;
            }
            return null;
        }
        return prisma.session.findUnique({
            where: { refreshTokenHash }
        });
    }
    async findSessionById(sessionId) {
        if (this.useInMemory) {
            return inMemoryAuthStore.sessions.get(sessionId) || null;
        }
        return prisma.session.findUnique({ where: { id: sessionId } });
    }
    async updateSessionToken(sessionId, newRefreshTokenHash, newExpiresAt) {
        if (this.useInMemory) {
            const session = inMemoryAuthStore.sessions.get(sessionId);
            if (!session)
                throw new Error("Session not found");
            session.refreshTokenHash = newRefreshTokenHash;
            session.expiresAt = newExpiresAt;
            session.lastUsedAt = new Date();
            return session;
        }
        return prisma.session.update({
            where: { id: sessionId },
            data: {
                refreshTokenHash: newRefreshTokenHash,
                expiresAt: newExpiresAt,
                lastUsedAt: new Date()
            }
        });
    }
    async revokeSession(sessionId) {
        if (this.useInMemory) {
            const session = inMemoryAuthStore.sessions.get(sessionId);
            if (!session)
                throw new Error("Session not found");
            session.revokedAt = new Date();
            return session;
        }
        return prisma.session.update({
            where: { id: sessionId },
            data: { revokedAt: new Date() }
        });
    }
    async revokeAllUserSessions(userId) {
        if (this.useInMemory) {
            for (const s of inMemoryAuthStore.sessions.values()) {
                if (s.userId === userId && !s.revokedAt) {
                    s.revokedAt = new Date();
                }
            }
            return;
        }
        await prisma.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        });
    }
    async findUserSessions(userId) {
        if (this.useInMemory) {
            return Array.from(inMemoryAuthStore.sessions.values())
                .filter((s) => s.userId === userId)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return prisma.session.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
    }
}
export const authRepository = new AuthRepository();
//# sourceMappingURL=auth.repository.js.map