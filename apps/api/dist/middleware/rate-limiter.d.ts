import { Request, Response, NextFunction } from "express";
export interface RateLimitOptions {
    windowSec: number;
    max: number;
    keyPrefix: string;
    keyGenerator?: (req: Request) => string;
}
export declare function rateLimiter(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rate-limiter.d.ts.map