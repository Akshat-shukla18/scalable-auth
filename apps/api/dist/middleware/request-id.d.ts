import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=request-id.d.ts.map