import { sessionService } from "./session.service.js";
export class SessionController {
    service;
    constructor(service = sessionService) {
        this.service = service;
    }
    list = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const currentSessionId = req.user?.sessionId;
            const sessions = await this.service.listSessions(userId, currentSessionId);
            const response = {
                success: true,
                data: sessions,
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        }
        catch (err) {
            next(err);
        }
    };
    revoke = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await this.service.revokeSession(sessionId, userId);
            const response = {
                success: true,
                data: result,
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        }
        catch (err) {
            next(err);
        }
    };
}
export const sessionController = new SessionController();
//# sourceMappingURL=session.controller.js.map