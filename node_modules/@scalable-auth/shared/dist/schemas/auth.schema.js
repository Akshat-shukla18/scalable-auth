"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeSessionSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.resendCodeSchema = exports.verifyEmailSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: "Name is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters")
        .trim(),
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase()
        .trim(),
    password: zod_1.z
        .string({ required_error: "Password is required" })
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password must not exceed 128 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),
    password: zod_1.z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required")
});
exports.verifyEmailSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),
    code: zod_1.z
        .string({ required_error: "Verification code is required" })
        .length(6, "Verification code must be exactly 6 digits")
        .regex(/^\d{6}$/, "Verification code must contain digits only")
});
exports.resendCodeSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim()
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim()
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),
    code: zod_1.z
        .string({ required_error: "Reset code is required" })
        .length(6, "Reset code must be exactly 6 digits")
        .regex(/^\d{6}$/, "Reset code must contain digits only"),
    newPassword: zod_1.z
        .string({ required_error: "New password is required" })
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password must not exceed 128 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});
exports.revokeSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID format")
});
//# sourceMappingURL=auth.schema.js.map