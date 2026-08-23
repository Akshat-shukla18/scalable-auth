import { logger } from "../config/logger.js";
export function requestLoggerMiddleware(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
        logger[logLevel]({
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.get("user-agent")
        }, "HTTP Request Completed");
    });
    next();
}
//# sourceMappingURL=request-logger.js.map