import { Request, Response, NextFunction } from "express";
import { SessionService } from "./session.service.js";
export declare class SessionController {
    private service;
    constructor(service?: SessionService);
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    revoke: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const sessionController: SessionController;
//# sourceMappingURL=session.controller.d.ts.map