import crypto from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { logger } from "../config/logger.js";
const ARGON2_OPTIONS = {
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 threads
    algorithm: 2 /* Algorithm.Argon2id */,
    version: 1 /* Version.V0x13 */
};
/**
 * Hashes a plaintext password using Argon2id with cryptographically sound parameters.
 */
export async function hashPassword(password) {
    try {
        return await hash(password, ARGON2_OPTIONS);
    }
    catch (err) {
        logger.error({ err }, "Error hashing password with Argon2id");
        throw new Error("Password hashing failed");
    }
}
/**
 * Verifies a password against an Argon2id hash using timing-safe comparison.
 */
export async function verifyPassword(passwordHash, candidate) {
    try {
        return await verify(passwordHash, candidate, ARGON2_OPTIONS);
    }
    catch (err) {
        logger.warn({ err }, "Password verification exception");
        return false;
    }
}
/**
 * Generates a cryptographically secure 6-digit numeric verification code.
 */
export function generateVerificationCode() {
    const code = crypto.randomInt(100000, 1000000);
    return code.toString();
}
/**
 * Deterministically hashes a token or code using SHA-256 for secure database storage.
 */
export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
/**
 * Generates an opaque cryptographically random string for refresh tokens.
 */
export function generateSecureToken(byteLength = 32) {
    return crypto.randomBytes(byteLength).toString("hex");
}
//# sourceMappingURL=crypto.js.map