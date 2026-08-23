import { redis } from "../redis/redis.js";
import { AppError } from "./error-handler.js";
import { AuthErrorCode } from "@scalable-auth/shared";
import { logger } from "../config/logger.js";
// Lua Script for Atomic Sliding Window Rate Limiting in Redis
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

local clearBefore = now - window
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local currentCount = redis.call('ZCARD', key)

if currentCount < limit then
  redis.call('ZADD', key, now, now)
  redis.call('PEXPIRE', key, window + 1000)
  return {1, currentCount + 1, math.ceil(window / 1000)}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = tonumber(oldest[2] or now)
  local ttl = math.max(0, math.ceil((oldestScore + window - now) / 1000))
  return {0, currentCount, ttl}
end
`;
export function rateLimiter(options) {
    const { windowSec, max, keyPrefix, keyGenerator } = options;
    const windowMs = windowSec * 1000;
    return async (req, res, next) => {
        try {
            const identifier = keyGenerator ? keyGenerator(req) : (req.ip || "unknown-ip");
            const key = `ratelimit:${keyPrefix}:${identifier}`;
            const now = Date.now();
            let allowed = 1;
            let count = 0;
            let retryAfter = 0;
            try {
                const result = (await redis.eval(SLIDING_WINDOW_LUA, 1, key, now, windowMs, max));
                allowed = Number(result[0]);
                count = Number(result[1]);
                retryAfter = Number(result[2]);
            }
            catch (err) {
                logger.warn({ err: err.message }, "Rate limiter redis execution failed; allowing request gracefully");
                return next();
            }
            res.setHeader("X-RateLimit-Limit", max);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));
            res.setHeader("X-RateLimit-Reset", Math.ceil(now / 1000) + (retryAfter || windowSec));
            if (allowed === 0) {
                res.setHeader("Retry-After", retryAfter);
                return next(new AppError(429, AuthErrorCode.RATE_LIMIT_EXCEEDED, `Too many requests. Please try again in ${retryAfter} seconds.`));
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=rate-limiter.js.map