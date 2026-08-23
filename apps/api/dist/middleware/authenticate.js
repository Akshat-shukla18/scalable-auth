import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "./error-handler.js";
import { AuthErrorCode } from "@scalable-auth/shared";
import { authRepository } from "../modules/auth/auth.repository.js";
export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError(401, AuthErrorCode.UNAUTHORIZED, "Missing or invalid Bearer authentication token"));
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = verifyAccessToken(token);
        // Verify session validity via repository
        const session = await authRepository.findSessionById(payload.sessionId);
        if (!session || session.revokedAt || new Date() > session.expiresAt) {
            return next(new AppError(401, AuthErrorCode.SESSION_REVOKED, "Session has been revoked or expired"));
        }
        req.user = {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.emailVerified,
            sessionId: payload.sessionId
        };
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=authenticate.js.map