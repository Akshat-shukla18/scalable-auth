import { RegisterInput, LoginInput, VerifyEmailInput, ResendCodeInput, ForgotPasswordInput, ResetPasswordInput, UserDto, AuthResponseData } from "@scalable-auth/shared";
import { AuthRepository } from "./auth.repository.js";
export declare class AuthService {
    private repo;
    constructor(repo?: AuthRepository);
    private mapUserToDto;
    register(input: RegisterInput): Promise<{
        user: UserDto;
        message: string;
    }>;
    verifyEmail(input: VerifyEmailInput): Promise<{
        success: boolean;
        message: string;
    }>;
    resendVerificationCode(input: ResendCodeInput): Promise<{
        message: string;
    }>;
    login(input: LoginInput, meta: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<{
        authData: AuthResponseData;
        rawRefreshToken: string;
    }>;
    refreshTokens(rawRefreshToken: string, meta: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<{
        authData: AuthResponseData;
        newRawRefreshToken: string;
    }>;
    logout(rawRefreshToken?: string, sessionId?: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    forgotPassword(input: ForgotPasswordInput): Promise<{
        message: string;
    }>;
    resetPassword(input: ResetPasswordInput): Promise<{
        message: string;
    }>;
    getMe(userId: string): Promise<UserDto>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map