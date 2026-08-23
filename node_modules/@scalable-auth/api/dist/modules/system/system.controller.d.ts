import { Request, Response } from "express";
export declare function trackActiveRequests(req: Request, res: Response, next: () => void): void;
export declare class SystemController {
    health: (req: Request, res: Response) => void;
    ready: (req: Request, res: Response) => Promise<void>;
    metrics: (req: Request, res: Response) => Promise<void>;
}
export declare const systemController: SystemController;
//# sourceMappingURL=system.controller.d.ts.map