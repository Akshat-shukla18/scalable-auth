import pino from "pino";
import { env } from "./env.js";
const isDev = env.NODE_ENV === "development";
export const logger = pino({
    level: env.NODE_ENV === "test" ? "silent" : (isDev ? "debug" : "info"),
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.newPassword",
            "req.body.code",
            "req.body.token",
            "password",
            "passwordHash",
            "refreshToken",
            "codeHash"
        ],
        censor: "[REDACTED]"
    },
    transport: isDev
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname"
            }
        }
        : undefined,
    base: {
        instanceId: env.INSTANCE_ID
    }
});
//# sourceMappingURL=logger.js.map