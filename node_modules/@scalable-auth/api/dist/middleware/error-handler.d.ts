import { Request, Response, NextFunction } from "express";
import { AuthErrorCode } from "@scalable-auth/shared";
export declare class AppError extends Error {
    statusCode: number;
    code: AuthErrorCode | string;
    details?: unknown | undefined;
    constructor(statusCode: number, code: AuthErrorCode | string, message: string, details?: unknown | undefined);
}
export declare function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=error-handler.d.ts.map