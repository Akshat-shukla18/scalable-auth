import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                emailVerified: boolean;
                sessionId: string;
            };
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authenticate.d.ts.map