import { AccessTokenPayload } from "@scalable-auth/shared";
export declare function signAccessToken(payload: Omit<AccessTokenPayload, "iat" | "exp" | "iss">): {
    token: string;
    expiresInSeconds: number;
};
export declare function verifyAccessToken(token: string): AccessTokenPayload;
//# sourceMappingURL=jwt.d.ts.map