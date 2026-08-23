# Security & Cryptography Specification

## 1. Password Hashing (Argon2id)
Passwords are encrypted using **Argon2id** (winner of the Password Hashing Competition), offering optimal protection against both GPU/ASIC brute-force and side-channel cache attacks:
- **Memory Cost**: 65,536 KiB (64 MB)
- **Time Cost**: 3 iterations
- **Parallelism**: 4 lanes
- **Timing-Safe Verification**: Prevents response-timing attacks by executing constant-time verifications even if the requested user is not found.

## 2. Cryptographic Verification Codes
- **Entropy**: Cryptographically secure uniform 6-digit random integers generated using OS entropy sources (`crypto.randomInt`).
- **Hashed Storage**: Plaintext OTPs are **never stored** in the database. Only deterministic `SHA-256(code)` is recorded.
- **Brute-Force Lockout**: Max attempts limit (default: 5). Exceeding this marks the code invalid and locks out the request.
- **Single-Use Invalidation**: Verified codes are immediately marked with `usedAt = NOW()`.
- **Automatic Invalidation on Resend**: Generating a new verification code automatically invalidates all previous unverified codes.

## 3. Refresh Token Rotation & Reuse Detection
- **Token Format**: 32-byte opaque cryptographically random string (`crypto.randomBytes(32)`).
- **Storage**: Stored exclusively as `SHA-256(refreshToken)` in PostgreSQL.
- **Cookie Security**:
  - `HttpOnly = true` (Inaccessible to JavaScript, preventing XSS token theft)
  - `Secure = true` (Transmitted only over HTTPS in production)
  - `SameSite = Strict` (Immune to Cross-Site Request Forgery)
- **Reuse Detection Strategy**: If an already revoked or rotated refresh token is presented, the system flags a **compromised credential attack** and automatically revokes **ALL** active sessions for that user family.

## 4. Account Enumeration Resistance
- Endpoint responses for `/resend-code` and `/forgot-password` return generic, identical success messages regardless of whether the email address exists in the system.
