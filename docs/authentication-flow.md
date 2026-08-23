# Authentication Flow & Lifecycle

This document describes the end-to-end authentication lifecycles implemented in the platform.

## 1. Registration Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as React Client
    participant API as API Server
    participant Redis as Redis
    participant DB as PostgreSQL
    participant Queue as BullMQ Queue
    participant Worker as Email Worker

    User->>Client: Enters name, email, password
    Client->>API: POST /api/auth/register
    API->>Redis: Check IP rate limit (5 req/min)
    API->>DB: Check if email exists
    API->>API: Hash password with Argon2id (64MB memory, 3 iterations)
    API->>API: Generate crypto-secure 6-digit OTP
    API->>API: Compute SHA-256(OTP)
    API->>DB: INSERT User (emailVerified=false) & VerificationCode
    API->>Queue: emailQueue.add("send-verification-email")
    API-->>Client: 201 Created (immediate response)
    
    par Async Email Delivery
        Queue->>Worker: Dispatch Job
        Worker->>Worker: Send email via provider (Mock / Resend / SMTP)
    end
```

## 2. Email Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as React Client
    participant API as API Server
    participant DB as PostgreSQL

    User->>Client: Enters 6-digit verification code
    Client->>API: POST /api/auth/verify-email
    API->>DB: Query latest active VerificationCode for user
    alt Code Expired or Max Attempts Exceeded
        API-->>Client: 400 / 429 Error
    else Valid Code
        API->>DB: UPDATE VerificationCode (usedAt = NOW)
        API->>DB: UPDATE User (emailVerified = true)
        API-->>Client: 200 OK (Email verified)
    end
```

## 3. Login & Session Issuance Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as React Client
    participant API as API Server
    participant DB as PostgreSQL

    User->>Client: Enters email & password
    Client->>API: POST /api/auth/login
    API->>DB: Fetch user by email
    API->>API: Verify password with Argon2id
    API->>API: Generate random 32-byte Refresh Token
    API->>DB: INSERT Session (refreshTokenHash = SHA256(token))
    API->>API: Sign JWT Access Token (15m expiry)
    API-->>Client: Set HttpOnly Cookie (refresh_token) + JSON { accessToken }
```

## 4. Refresh Token Rotation & Reuse Detection Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as React Client
    participant API as API Server
    participant DB as PostgreSQL

    Client->>API: POST /api/auth/refresh (Cookie: refresh_token)
    API->>DB: Find Session by SHA256(incoming_token)
    
    alt Session Not Found OR revokedAt IS NOT NULL (Token Reuse Attack!)
        API->>DB: Revoke ALL sessions for this user (Family Revocation)
        API-->>Client: 401 Unauthorized (TOKEN_REUSE_DETECTED)
    else Active Valid Session
        API->>API: Generate NEW 32-byte Refresh Token
        API->>DB: UPDATE Session with new refreshTokenHash & extend expiry
        API->>API: Sign NEW JWT Access Token
        API-->>Client: Set NEW HttpOnly Cookie + JSON { accessToken }
    end
```
