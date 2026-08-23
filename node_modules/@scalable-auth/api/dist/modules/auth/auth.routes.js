import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { rateLimiter } from "../../middleware/rate-limiter.js";
import { env } from "../../config/env.js";
import { registerSchema, loginSchema, verifyEmailSchema, resendCodeSchema, forgotPasswordSchema, resetPasswordSchema } from "@scalable-auth/shared";
const router = Router();
// Rate limiters configured via environment variables
const registerLimiter = rateLimiter({
    keyPrefix: "register",
    max: env.RATE_LIMIT_REGISTER_MAX,
    windowSec: env.RATE_LIMIT_REGISTER_WINDOW_SEC
});
const loginLimiter = rateLimiter({
    keyPrefix: "login",
    max: env.RATE_LIMIT_LOGIN_MAX,
    windowSec: env.RATE_LIMIT_LOGIN_WINDOW_SEC,
    keyGenerator: (req) => `${req.ip}:${req.body?.email || "anonymous"}`
});
const verifyLimiter = rateLimiter({
    keyPrefix: "verify",
    max: env.RATE_LIMIT_VERIFY_MAX,
    windowSec: env.RATE_LIMIT_VERIFY_WINDOW_SEC,
    keyGenerator: (req) => `${req.ip}:${req.body?.email || "anonymous"}`
});
const resendLimiter = rateLimiter({
    keyPrefix: "resend",
    max: env.RATE_LIMIT_RESEND_MAX,
    windowSec: env.RATE_LIMIT_RESEND_WINDOW_SEC,
    keyGenerator: (req) => `${req.ip}:${req.body?.email || "anonymous"}`
});
const refreshLimiter = rateLimiter({
    keyPrefix: "refresh",
    max: env.RATE_LIMIT_REFRESH_MAX,
    windowSec: env.RATE_LIMIT_REFRESH_WINDOW_SEC
});
// Authentication endpoints
router.post("/register", registerLimiter, validate({ body: registerSchema }), authController.register);
router.post("/verify-email", verifyLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post("/resend-code", resendLimiter, validate({ body: resendCodeSchema }), authController.resendCode);
router.post("/login", loginLimiter, validate({ body: loginSchema }), authController.login);
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);
router.post("/forgot-password", resendLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post("/reset-password", verifyLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
router.get("/me", authenticate, authController.me);
export const authRoutes = router;
//# sourceMappingURL=auth.routes.js.map