export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            BearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
            CookieAuth: {
                type: string;
                in: string;
                name: string;
                description: string;
            };
        };
        schemas: {
            RegisterInput: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
            LoginInput: {
                type: string;
                required: string[];
                properties: {
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
            VerifyEmailInput: {
                type: string;
                required: string[];
                properties: {
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    code: {
                        type: string;
                        example: string;
                    };
                };
            };
            ApiResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    data: {
                        type: string;
                    };
                    meta: {
                        type: string;
                        properties: {
                            requestId: {
                                type: string;
                                example: string;
                            };
                            timestamp: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                };
            };
            ApiErrorResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    error: {
                        type: string;
                        properties: {
                            code: {
                                type: string;
                                example: string;
                            };
                            message: {
                                type: string;
                                example: string;
                            };
                            details: {
                                type: string;
                            };
                        };
                    };
                    meta: {
                        type: string;
                        properties: {
                            requestId: {
                                type: string;
                            };
                            timestamp: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    paths: {
        "/api/auth/register": {
            post: {
                summary: string;
                tags: string[];
                description: string;
                requestBody: {
                    required: boolean;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    400: {
                        description: string;
                    };
                    409: {
                        description: string;
                    };
                    429: {
                        description: string;
                    };
                };
            };
        };
        "/api/auth/verify-email": {
            post: {
                summary: string;
                tags: string[];
                description: string;
                requestBody: {
                    required: boolean;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                    400: {
                        description: string;
                    };
                    429: {
                        description: string;
                    };
                };
            };
        };
        "/api/auth/login": {
            post: {
                summary: string;
                tags: string[];
                description: string;
                requestBody: {
                    required: boolean;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                    403: {
                        description: string;
                    };
                    429: {
                        description: string;
                    };
                };
            };
        };
        "/api/auth/refresh": {
            post: {
                summary: string;
                tags: string[];
                description: string;
                security: {
                    CookieAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        "/api/auth/logout": {
            post: {
                summary: string;
                tags: string[];
                description: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        "/api/auth/logout-all": {
            post: {
                summary: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                description: string;
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        "/api/auth/me": {
            get: {
                summary: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        "/api/sessions": {
            get: {
                summary: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        "/api/sessions/{id}": {
            delete: {
                summary: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    404: {
                        description: string;
                    };
                };
            };
        };
        "/health": {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        "/ready": {
            get: {
                summary: string;
                tags: string[];
                description: string;
                responses: {
                    200: {
                        description: string;
                    };
                    503: {
                        description: string;
                    };
                };
            };
        };
        "/metrics": {
            get: {
                summary: string;
                tags: string[];
                description: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=openapi.d.ts.map