import { VerificationCodeType, User, Session, VerificationCode } from "@prisma/client";
declare class InMemoryAuthStore {
    users: Map<string, User>;
    codes: Map<string, VerificationCode>;
    sessions: Map<string, Session>;
    clear(): void;
}
export declare const inMemoryAuthStore: InMemoryAuthStore;
export declare class AuthRepository {
    private useInMemory;
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: string): Promise<User | null>;
    createUser(data: {
        name: string;
        email: string;
        passwordHash: string;
    }): Promise<User>;
    updateEmailVerified(userId: string, isVerified: boolean): Promise<User>;
    updateUserPassword(userId: string, newPasswordHash: string): Promise<User>;
    createVerificationCode(data: {
        userId: string;
        codeHash: string;
        type: VerificationCodeType;
        expiresAt: Date;
        maxAttempts: number;
    }): Promise<VerificationCode>;
    findLatestActiveVerificationCode(userId: string, type: VerificationCodeType): Promise<VerificationCode | null>;
    incrementVerificationAttempts(id: string): Promise<VerificationCode>;
    markVerificationCodeUsed(id: string): Promise<VerificationCode>;
    invalidateExistingCodes(userId: string, type: VerificationCodeType): Promise<void>;
    createSession(data: {
        userId: string;
        refreshTokenHash: string;
        expiresAt: Date;
        userAgent?: string | null;
        ipAddress?: string | null;
    }): Promise<Session>;
    findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null>;
    findSessionById(sessionId: string): Promise<Session | null>;
    updateSessionToken(sessionId: string, newRefreshTokenHash: string, newExpiresAt: Date): Promise<Session>;
    revokeSession(sessionId: string): Promise<Session>;
    revokeAllUserSessions(userId: string): Promise<void>;
    findUserSessions(userId: string): Promise<Session[]>;
}
export declare const authRepository: AuthRepository;
export {};
//# sourceMappingURL=auth.repository.d.ts.map