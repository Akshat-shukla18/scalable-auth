import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { AuthErrorCode } from "@scalable-auth/shared";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
const { JsonWebTokenError, TokenExpiredError } = jwt;
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = "AppError";
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorHandler(err, req, res, next) {
    let statusCode = 500;
    let code = AuthErrorCode.INTERNAL_SERVER_ERROR;
    let message = "An unexpected internal server error occurred.";
    let details = undefined;
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        details = err.details;
    }
    else if (err instanceof ZodError) {
        statusCode = 400;
        code = AuthErrorCode.INVALID_INPUT;
        message = "Request validation failed.";
        details = err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message
        }));
    }
    else if (TokenExpiredError && err instanceof TokenExpiredError) {
        statusCode = 401;
        code = AuthErrorCode.UNAUTHORIZED;
        message = "Authentication access token has expired.";
    }
    else if (JsonWebTokenError && err instanceof JsonWebTokenError) {
        statusCode = 401;
        code = AuthErrorCode.UNAUTHORIZED;
        message = "Invalid authentication access token.";
    }
    else if (err instanceof Error) {
        message = env.NODE_ENV === "production" ? "Internal server error." : err.message;
        logger.error({ err, requestId: req.id }, "Unhandled Exception in Express pipeline");
    }
    const response = {
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {})
        },
        meta: {
            requestId: req.id,
            timestamp: new Date().toISOString()
        }
    };
    res.status(statusCode).json(response);
}
//# sourceMappingURL=error-handler.js.map