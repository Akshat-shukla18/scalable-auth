import { AUTH_COOKIE_NAME } from "../config/constants.js";
import { env } from "../config/env.js";
export function setRefreshTokenCookie(res, refreshToken, maxAgeDays = env.REFRESH_TOKEN_EXPIRES_IN_DAYS) {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const isProd = env.NODE_ENV === "production";
    res.cookie(AUTH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "strict" : "lax",
        path: "/api/auth",
        maxAge: maxAgeMs
    });
}
export function clearRefreshTokenCookie(res) {
    const isProd = env.NODE_ENV === "production";
    res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "strict" : "lax",
        path: "/api/auth"
    });
}
//# sourceMappingURL=cookies.js.map