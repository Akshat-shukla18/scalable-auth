import { SessionDto } from "@scalable-auth/shared";
import { SessionRepository } from "./session.repository.js";
export declare class SessionService {
    private repo;
    constructor(repo?: SessionRepository);
    listSessions(userId: string, currentSessionId?: string): Promise<SessionDto[]>;
    revokeSession(sessionId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=session.service.d.ts.map