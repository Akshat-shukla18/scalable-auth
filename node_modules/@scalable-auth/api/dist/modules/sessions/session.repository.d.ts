import { Session } from "@prisma/client";
export declare class SessionRepository {
    private useInMemory;
    getUserSessions(userId: string): Promise<Session[]>;
    revokeSession(sessionId: string, userId: string): Promise<Session | null>;
}
export declare const sessionRepository: SessionRepository;
//# sourceMappingURL=session.repository.d.ts.map