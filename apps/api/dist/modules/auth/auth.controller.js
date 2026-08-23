import { authService } from "./auth.service.js";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "../../utils/cookies.js";
import { AUTH_COOKIE_NAME } from "../../config/constants.js";
export class AuthController {
    service;
    constructor(service = authService) {
        this.service = service;
    }
    register = async (req, res, next) => {
        try {
            const result = await this.service.register(req.body);
            const response = {
                success: true,
                data: result,
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(201).json(response);
        }
        catch (err) {
            next(err);
        }
    };
    verifyEmail = async (req, res, next) => {
        try {
            const result = await this.service.verifyEmail(req.body);
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
    resendCode = async (req, res, next) => {
        try {
            const result = await this.service.resendVerificationCode(req.body);
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
    login = async (req, res, next) => {
        try {
            const meta = {
                userAgent: req.get("user-agent"),
                ipAddress: req.ip
            };
            const { authData, rawRefreshToken } = await this.service.login(req.body, meta);
            setRefreshTokenCookie(res, rawRefreshToken);
            const response = {
                success: true,
                data: authData,
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        }
        catch (err) {
            next(err);
        }
    };
    refresh = async (req, res, next) => {
        try {
            const rawRefreshToken = req.cookies[AUTH_COOKIE_NAME] || req.body?.refreshToken;
            const meta = {
                userAgent: req.get("user-agent"),
                ipAddress: req.ip
            };
            const { authData, newRawRefreshToken } = await this.service.refreshTokens(rawRefreshToken, meta);
            setRefreshTokenCookie(res, newRawRefreshToken);
            const response = {
                success: true,
                data: authData,
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        }
        catch (err) {
            clearRefreshTokenCookie(res);
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            const rawRefreshToken = req.cookies[AUTH_COOKIE_NAME];
            const sessionId = req.user?.sessionId;
            await this.service.logout(rawRefreshToken, sessionId);
            clearRefreshTokenCookie(res);
            const response = {
                success: true,
                data: { message: "Successfully logged out" },
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        }
        catch (err) {
            next(err);
        }
    };
    logoutAll = async (req, res, next) => {
        try {
            if (!req.user?.id)
                return next(new Error("Unauthorized"));
            await this.service.logoutAll(req.user.id);
            clearRefreshTokenCookie(res);
            const response = {
                success: true,
                data: { message: "Successfully revoked all sessions across devices" },
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        }
        catch (err) {
            next(err);
        }
    };
    forgotPassword = async (req, res, next) => {
        try {
            const result = await this.service.forgotPassword(req.body);
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
    resetPassword = async (req, res, next) => {
        try {
            const result = await this.service.resetPassword(req.body);
            clearRefreshTokenCookie(res);
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
    me = async (req, res, next) => {
        try {
            if (!req.user?.id)
                return next(new Error("Unauthorized"));
            const user = await this.service.getMe(req.user.id);
            const response = {
                success: true,
                data: { user, sessionId: req.user.sessionId },
                meta: { requestId: req.id, timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        }
        catch (err) {
            next(err);
        }
    };
}
export const authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map