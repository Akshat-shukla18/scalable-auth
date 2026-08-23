export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Scalable Production Authentication API",
        version: "1.0.0",
        description: "Enterprise-grade, horizontally scalable authentication platform with Argon2id, BullMQ email worker pipeline, rotating refresh token sessions, and Redis sliding-window rate limiting."
    },
    servers: [
        { url: "http://localhost:4000", description: "Direct API Server" },
        { url: "http://localhost:8080", description: "Nginx Load Balanced Gateway" }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Short-lived JWT access token provided in Authorization header"
            },
            CookieAuth: {
                type: "apiKey",
                in: "cookie",
                name: "refresh_token",
                description: "HttpOnly secure rotating refresh token cookie"
            }
        },
        schemas: {
            RegisterInput: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    password: { type: "string", format: "password", example: "SecurePass123!" }
                }
            },
            LoginInput: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    password: { type: "string", format: "password", example: "SecurePass123!" }
                }
            },
            VerifyEmailInput: {
                type: "object",
                required: ["email", "code"],
                properties: {
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    code: { type: "string", example: "123456" }
                }
            },
            ApiResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object" },
                    meta: {
                        type: "object",
                        properties: {
                            requestId: { type: "string", example: "c29b6f12-07a8-4c8d-bf72-fb55fa98b0f1" },
                            timestamp: { type: "string", example: "2026-08-23T10:00:00.000Z" }
                        }
                    }
                }
            },
            ApiErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    error: {
                        type: "object",
                        properties: {
                            code: { type: "string", example: "INVALID_CREDENTIALS" },
                            message: { type: "string", example: "Invalid email or password." },
                            details: { type: "object" }
                        }
                    },
                    meta: {
                        type: "object",
                        properties: {
                            requestId: { type: "string" },
                            timestamp: { type: "string" }
                        }
                    }
                }
            }
        }
    },
    paths: {
        "/api/auth/register": {
            post: {
                summary: "Register new user account",
                tags: ["Authentication"],
                description: "Creates user, hashes password with Argon2id, generates 6-digit OTP, and enqueues verification email into BullMQ without blocking HTTP response.",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } }
                },
                responses: {
                    201: { description: "User registered successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
                    400: { description: "Validation error" },
                    409: { description: "Email already registered" },
                    429: { description: "Rate limit exceeded (5/min/IP)" }
                }
            }
        },
        "/api/auth/verify-email": {
            post: {
                summary: "Verify email with 6-digit OTP",
                tags: ["Authentication"],
                description: "Verifies user email using cryptographically hashed 6-digit verification code.",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyEmailInput" } } }
                },
                responses: {
                    200: { description: "Email verified successfully" },
                    400: { description: "Invalid or expired verification code" },
                    429: { description: "Max attempts exceeded or rate limited" }
                }
            }
        },
        "/api/auth/login": {
            post: {
                summary: "Log in with email & password",
                tags: ["Authentication"],
                description: "Authenticates credentials, creates session, sets HttpOnly refresh token cookie, and returns short-lived JWT access token.",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } }
                },
                responses: {
                    200: { description: "Authenticated successfully" },
                    401: { description: "Invalid credentials" },
                    403: { description: "Email not verified" },
                    429: { description: "Rate limit exceeded" }
                }
            }
        },
        "/api/auth/refresh": {
            post: {
                summary: "Refresh access token (Token Rotation & Reuse Detection)",
                tags: ["Authentication"],
                description: "Rotates refresh token and issues new JWT access token. Revokes entire session family if token reuse is detected.",
                security: [{ CookieAuth: [] }],
                responses: {
                    200: { description: "Token rotated and refreshed successfully" },
                    401: { description: "Invalid, expired, or reused refresh token" }
                }
            }
        },
        "/api/auth/logout": {
            post: {
                summary: "Log out current device session",
                tags: ["Authentication"],
                description: "Revokes current refresh token session in PostgreSQL and clears HttpOnly cookie.",
                responses: {
                    200: { description: "Logged out successfully" }
                }
            }
        },
        "/api/auth/logout-all": {
            post: {
                summary: "Log out from all devices",
                tags: ["Authentication"],
                security: [{ BearerAuth: [] }],
                description: "Revokes all active sessions across all devices for the authenticated user.",
                responses: {
                    200: { description: "All sessions revoked" },
                    401: { description: "Unauthorized" }
                }
            }
        },
        "/api/auth/me": {
            get: {
                summary: "Get authenticated user profile",
                tags: ["Protected APIs"],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Current user profile" },
                    401: { description: "Unauthorized" }
                }
            }
        },
        "/api/sessions": {
            get: {
                summary: "List all active sessions for current user",
                tags: ["Session Management"],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of active sessions" }
                }
            }
        },
        "/api/sessions/{id}": {
            delete: {
                summary: "Revoke a specific session",
                tags: ["Session Management"],
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
                ],
                responses: {
                    200: { description: "Session revoked" },
                    404: { description: "Session not found" }
                }
            }
        },
        "/health": {
            get: {
                summary: "Liveness probe",
                tags: ["Observability"],
                responses: { 200: { description: "Process is alive" } }
            }
        },
        "/ready": {
            get: {
                summary: "Readiness probe",
                tags: ["Observability"],
                description: "Verifies database and Redis connectivity before routing traffic.",
                responses: {
                    200: { description: "System ready" },
                    503: { description: "Subsystem degraded" }
                }
            }
        },
        "/metrics": {
            get: {
                summary: "System metrics",
                tags: ["Observability"],
                description: "Returns instance ID, active requests, memory, Redis/DB health, and BullMQ queue metrics.",
                responses: { 200: { description: "System metrics" } }
            }
        }
    }
};
//# sourceMappingURL=openapi.js.map