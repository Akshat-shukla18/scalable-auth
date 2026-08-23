export declare enum AuthErrorCode {
    INVALID_INPUT = "INVALID_INPUT",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
    INVALID_VERIFICATION_CODE = "INVALID_VERIFICATION_CODE",
    VERIFICATION_CODE_EXPIRED = "VERIFICATION_CODE_EXPIRED",
    MAX_ATTEMPTS_EXCEEDED = "MAX_ATTEMPTS_EXCEEDED",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    SESSION_REVOKED = "SESSION_REVOKED",
    TOKEN_REUSE_DETECTED = "TOKEN_REUSE_DETECTED",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
}
export interface ApiErrorResponse {
    success: false;
    error: {
        code: AuthErrorCode | string;
        message: string;
        details?: unknown;
    };
    meta?: {
        requestId?: string;
        timestamp: string;
    };
}
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    meta?: {
        requestId?: string;
        timestamp: string;
    };
}
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
//# sourceMappingURL=errors.d.ts.map