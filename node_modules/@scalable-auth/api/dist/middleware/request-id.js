import crypto from "node:crypto";
export function requestIdMiddleware(req, res, next) {
    const incomingId = req.header("x-request-id");
    const id = incomingId && typeof incomingId === "string" ? incomingId : crypto.randomUUID();
    req.id = id;
    res.setHeader("X-Request-Id", id);
    next();
}
//# sourceMappingURL=request-id.js.map