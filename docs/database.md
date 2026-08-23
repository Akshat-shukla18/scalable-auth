# Database Architecture & Schema

The database model is built with PostgreSQL and managed via Prisma ORM.

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ VERIFICATION_CODE : "owns"
    USER ||--o{ SESSION : "has"

    USER {
        uuid id PK
        string name
        string email UK "indexed"
        string passwordHash
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }

    VERIFICATION_CODE {
        uuid id PK
        uuid userId FK "cascade delete"
        string codeHash "SHA-256"
        enum type "EMAIL_VERIFICATION | PASSWORD_RESET"
        datetime expiresAt "indexed"
        int attempts
        int maxAttempts
        datetime usedAt
        datetime createdAt
    }

    SESSION {
        uuid id PK
        uuid userId FK "cascade delete"
        string refreshTokenHash UK "SHA-256"
        string userAgent
        string ipAddress
        datetime expiresAt "indexed"
        datetime revokedAt "indexed"
        datetime createdAt
        datetime lastUsedAt
    }
```

## 2. Index Strategy
- `User(email)`: Unique B-tree index for O(1) login and registration lookups.
- `Session(refreshTokenHash)`: Unique index for fast refresh token validation.
- `Session(userId, revokedAt)`: Compound index for efficient session listing and bulk revocation.
- `VerificationCode(userId, type, usedAt)`: Compound index to fetch active unexpired verification records.
