import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendCodeInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UserDto,
  AuthResponseData,
  AuthErrorCode
} from "@scalable-auth/shared";
import { authRepository, AuthRepository } from "./auth.repository.js";
import { hashPassword, verifyPassword, generateVerificationCode, hashToken, generateSecureToken } from "../../utils/crypto.js";
import { signAccessToken } from "../../utils/jwt.js";
import { AppError } from "../../middleware/error-handler.js";
import { queueVerificationEmail, queuePasswordResetEmail } from "../../queues/email.queue.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { VerificationCodeType, User } from "@prisma/client";

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  async register(input: RegisterInput): Promise<{ user: UserDto; message: string }> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      throw new AppError(409, AuthErrorCode.EMAIL_ALREADY_EXISTS, "An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.repo.createUser({
      name: input.name,
      email: input.email,
      passwordHash
    });

    // Invalidate any older codes for this user
    await this.repo.invalidateExistingCodes(user.id, VerificationCodeType.EMAIL_VERIFICATION);

    // Generate 6-digit code
    const code = generateVerificationCode();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + env.VERIFICATION_CODE_EXPIRES_MINUTES * 60 * 1000);

    await this.repo.createVerificationCode({
      userId: user.id,
      codeHash,
      type: VerificationCodeType.EMAIL_VERIFICATION,
      expiresAt,
      maxAttempts: env.VERIFICATION_MAX_ATTEMPTS
    });

    // Asynchronously push to BullMQ queue without blocking HTTP response
    queueVerificationEmail({
      to: user.email,
      name: user.name,
      code,
      expiresInMinutes: env.VERIFICATION_CODE_EXPIRES_MINUTES
    }).catch((err) => {
      logger.error({ err, userId: user.id }, "Failed to queue verification email");
    });

    return {
      user: this.mapUserToDto(user),
      message: "Registration successful. Please verify your email with the 6-digit code sent to you."
    };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<{ success: boolean; message: string }> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(400, AuthErrorCode.INVALID_VERIFICATION_CODE, "Invalid verification code or email.");
    }

    if (user.emailVerified) {
      return { success: true, message: "Email is already verified." };
    }

    const verificationRecord = await this.repo.findLatestActiveVerificationCode(
      user.id,
      VerificationCodeType.EMAIL_VERIFICATION
    );

    if (!verificationRecord) {
      throw new AppError(400, AuthErrorCode.INVALID_VERIFICATION_CODE, "No active verification code found. Please request a new code.");
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw new AppError(400, AuthErrorCode.VERIFICATION_CODE_EXPIRED, "Verification code has expired. Please request a new one.");
    }

    if (verificationRecord.attempts >= verificationRecord.maxAttempts) {
      throw new AppError(429, AuthErrorCode.MAX_ATTEMPTS_EXCEEDED, "Maximum verification attempts exceeded. Please request a new code.");
    }

    const providedHash = hashToken(input.code);
    if (providedHash !== verificationRecord.codeHash) {
      await this.repo.incrementVerificationAttempts(verificationRecord.id);
      const remainingAttempts = verificationRecord.maxAttempts - (verificationRecord.attempts + 1);
      throw new AppError(
        400,
        AuthErrorCode.INVALID_VERIFICATION_CODE,
        `Invalid verification code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : "No attempts remaining."}`
      );
    }

    // Code is valid: Mark used and verify user
    await this.repo.markVerificationCodeUsed(verificationRecord.id);
    await this.repo.updateEmailVerified(user.id, true);

    return { success: true, message: "Email verified successfully! You can now log in." };
  }

  async resendVerificationCode(input: ResendCodeInput): Promise<{ message: string }> {
    const user = await this.repo.findUserByEmail(input.email);
    
    // Account enumeration resistance: Always return identical successful message
    if (!user || user.emailVerified) {
      return { message: "If an unverified account exists with this email, a new verification code has been dispatched." };
    }

    await this.repo.invalidateExistingCodes(user.id, VerificationCodeType.EMAIL_VERIFICATION);

    const code = generateVerificationCode();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + env.VERIFICATION_CODE_EXPIRES_MINUTES * 60 * 1000);

    await this.repo.createVerificationCode({
      userId: user.id,
      codeHash,
      type: VerificationCodeType.EMAIL_VERIFICATION,
      expiresAt,
      maxAttempts: env.VERIFICATION_MAX_ATTEMPTS
    });

    queueVerificationEmail({
      to: user.email,
      name: user.name,
      code,
      expiresInMinutes: env.VERIFICATION_CODE_EXPIRES_MINUTES
    }).catch((err) => {
      logger.error({ err, userId: user.id }, "Failed to enqueue resend verification email");
    });

    return { message: "If an unverified account exists with this email, a new verification code has been dispatched." };
  }

  async login(
    input: LoginInput,
    meta: { userAgent?: string; ipAddress?: string }
  ): Promise<{ authData: AuthResponseData; rawRefreshToken: string }> {
    const user = await this.repo.findUserByEmail(input.email);

    // Constant-time dummy verification if user does not exist to prevent timing attacks
    if (!user) {
      await hashPassword("dummy-password-for-timing-resistance");
      throw new AppError(401, AuthErrorCode.INVALID_CREDENTIALS, "Invalid email or password.");
    }

    const isValidPassword = await verifyPassword(user.passwordHash, input.password);
    if (!isValidPassword) {
      throw new AppError(401, AuthErrorCode.INVALID_CREDENTIALS, "Invalid email or password.");
    }

    if (!user.emailVerified) {
      throw new AppError(403, AuthErrorCode.EMAIL_NOT_VERIFIED, "Please verify your email before logging in.");
    }

    // Generate secure opaque refresh token
    const rawRefreshToken = generateSecureToken(32);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    // Create session in database
    const session = await this.repo.createSession({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress
    });

    // Issue short-lived JWT access token
    const { token: accessToken, expiresInSeconds } = signAccessToken({
      sub: user.id,
      sessionId: session.id,
      email: user.email,
      emailVerified: user.emailVerified
    });

    return {
      authData: {
        user: this.mapUserToDto(user),
        tokens: {
          accessToken,
          expiresIn: expiresInSeconds
        },
        sessionId: session.id
      },
      rawRefreshToken
    };
  }

  async refreshTokens(
    rawRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string }
  ): Promise<{ authData: AuthResponseData; newRawRefreshToken: string }> {
    if (!rawRefreshToken) {
      throw new AppError(401, AuthErrorCode.UNAUTHORIZED, "Missing refresh token");
    }

    const incomingHash = hashToken(rawRefreshToken);
    const session = await this.repo.findSessionByRefreshTokenHash(incomingHash);

    // Reuse detection: If token was not found or session was already revoked
    if (!session || session.revokedAt) {
      if (session) {
        // TOKEN REUSE DETECTED: Revoke ALL sessions for this user immediately!
        logger.warn({ userId: session.userId, sessionId: session.id }, "⚠️ TOKEN REUSE DETECTED! Revoking all sessions");
        await this.repo.revokeAllUserSessions(session.userId);
      }
      throw new AppError(401, AuthErrorCode.TOKEN_REUSE_DETECTED, "Invalid or revoked refresh token");
    }

    if (new Date() > session.expiresAt) {
      await this.repo.revokeSession(session.id);
      throw new AppError(401, AuthErrorCode.SESSION_EXPIRED, "Session expired, please log in again");
    }

    const user = await this.repo.findUserById(session.userId);
    if (!user) {
      throw new AppError(401, AuthErrorCode.USER_NOT_FOUND, "User no longer exists");
    }

    // Refresh Token Rotation: Generate new token and replace old hash
    const newRawRefreshToken = generateSecureToken(32);
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    await this.repo.updateSessionToken(session.id, newRefreshTokenHash, newExpiresAt);

    // Issue new JWT access token
    const { token: accessToken, expiresInSeconds } = signAccessToken({
      sub: user.id,
      sessionId: session.id,
      email: user.email,
      emailVerified: user.emailVerified
    });

    return {
      authData: {
        user: this.mapUserToDto(user),
        tokens: {
          accessToken,
          expiresIn: expiresInSeconds
        },
        sessionId: session.id
      },
      newRawRefreshToken
    };
  }

  async logout(rawRefreshToken?: string, sessionId?: string): Promise<void> {
    if (rawRefreshToken) {
      const hash = hashToken(rawRefreshToken);
      const session = await this.repo.findSessionByRefreshTokenHash(hash);
      if (session) {
        await this.repo.revokeSession(session.id);
        return;
      }
    }

    if (sessionId) {
      await this.repo.revokeSession(sessionId);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.repo.revokeAllUserSessions(userId);
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await this.repo.findUserByEmail(input.email);

    // Enumeration resistant response
    if (!user) {
      return { message: "If an account exists with this email, a password reset code has been sent." };
    }

    await this.repo.invalidateExistingCodes(user.id, VerificationCodeType.PASSWORD_RESET);

    const code = generateVerificationCode();
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + env.VERIFICATION_CODE_EXPIRES_MINUTES * 60 * 1000);

    await this.repo.createVerificationCode({
      userId: user.id,
      codeHash,
      type: VerificationCodeType.PASSWORD_RESET,
      expiresAt,
      maxAttempts: env.VERIFICATION_MAX_ATTEMPTS
    });

    queuePasswordResetEmail({
      to: user.email,
      name: user.name,
      code,
      expiresInMinutes: env.VERIFICATION_CODE_EXPIRES_MINUTES
    }).catch((err) => {
      logger.error({ err, userId: user.id }, "Failed to queue password reset email");
    });

    return { message: "If an account exists with this email, a password reset code has been sent." };
  }

  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(400, AuthErrorCode.INVALID_VERIFICATION_CODE, "Invalid reset code or email.");
    }

    const verificationRecord = await this.repo.findLatestActiveVerificationCode(
      user.id,
      VerificationCodeType.PASSWORD_RESET
    );

    if (!verificationRecord) {
      throw new AppError(400, AuthErrorCode.INVALID_VERIFICATION_CODE, "No active password reset request found.");
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw new AppError(400, AuthErrorCode.VERIFICATION_CODE_EXPIRED, "Password reset code has expired. Please request a new one.");
    }

    if (verificationRecord.attempts >= verificationRecord.maxAttempts) {
      throw new AppError(429, AuthErrorCode.MAX_ATTEMPTS_EXCEEDED, "Maximum attempts exceeded. Please request a new code.");
    }

    const providedHash = hashToken(input.code);
    if (providedHash !== verificationRecord.codeHash) {
      await this.repo.incrementVerificationAttempts(verificationRecord.id);
      throw new AppError(400, AuthErrorCode.INVALID_VERIFICATION_CODE, "Invalid password reset code.");
    }

    // Code is valid
    const newPasswordHash = await hashPassword(input.newPassword);
    await this.repo.updateUserPassword(user.id, newPasswordHash);
    await this.repo.markVerificationCodeUsed(verificationRecord.id);

    // Invalidate all existing sessions on password change
    await this.repo.revokeAllUserSessions(user.id);

    return { message: "Password has been successfully reset. Please log in with your new password." };
  }

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError(404, AuthErrorCode.USER_NOT_FOUND, "User not found");
    }
    return this.mapUserToDto(user);
  }
}

export const authService = new AuthService();
