import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
});

export const verifyEmailSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  code: z
    .string({ required_error: "Verification code is required" })
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain digits only")
});

export const resendCodeSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim()
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim()
});

export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  code: z
    .string({ required_error: "Reset code is required" })
    .length(6, "Reset code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Reset code must contain digits only"),
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;
