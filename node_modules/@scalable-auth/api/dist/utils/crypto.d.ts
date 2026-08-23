/**
 * Hashes a plaintext password using Argon2id with cryptographically sound parameters.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verifies a password against an Argon2id hash using timing-safe comparison.
 */
export declare function verifyPassword(passwordHash: string, candidate: string): Promise<boolean>;
/**
 * Generates a cryptographically secure 6-digit numeric verification code.
 */
export declare function generateVerificationCode(): string;
/**
 * Deterministically hashes a token or code using SHA-256 for secure database storage.
 */
export declare function hashToken(token: string): string;
/**
 * Generates an opaque cryptographically random string for refresh tokens.
 */
export declare function generateSecureToken(byteLength?: number): string;
//# sourceMappingURL=crypto.d.ts.map