export interface UserDto {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface SessionDto {
    id: string;
    userId: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: string;
    revokedAt: string | null;
    createdAt: string;
    lastUsedAt: string;
    isCurrent?: boolean;
}
export interface AuthTokens {
    accessToken: string;
    expiresIn: number;
}
export interface AuthResponseData {
    user: UserDto;
    tokens: AuthTokens;
    sessionId?: string;
}
export interface AccessTokenPayload {
    sub: string;
    sessionId: string;
    email: string;
    emailVerified: boolean;
    iat?: number;
    exp?: number;
    iss?: string;
}
export interface EmailVerificationStatusDto {
    email: string;
    isVerified: boolean;
    expiresInSeconds?: number;
    maxAttempts?: number;
    remainingAttempts?: number;
}
export interface SystemMetricsDto {
    instanceId: string;
    hostname: string;
    uptimeSeconds: number;
    memoryUsageMb: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
    };
    activeRequests: number;
    queueMetrics: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    };
    redisConnected: boolean;
    dbConnected: boolean;
    timestamp: string;
}
//# sourceMappingURL=auth.d.ts.map