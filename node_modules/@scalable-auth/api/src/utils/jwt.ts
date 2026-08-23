import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AccessTokenPayload } from "@scalable-auth/shared";

export function signAccessToken(payload: Omit<AccessTokenPayload, "iat" | "exp" | "iss">): { token: string; expiresInSeconds: number } {
  const expiresIn = env.JWT_EXPIRES_IN; // e.g. "15m"
  
  // Calculate seconds for client metadata
  let expiresInSeconds = 900;
  if (expiresIn.endsWith("m")) {
    expiresInSeconds = parseInt(expiresIn) * 60;
  } else if (expiresIn.endsWith("s")) {
    expiresInSeconds = parseInt(expiresIn);
  } else if (expiresIn.endsWith("h")) {
    expiresInSeconds = parseInt(expiresIn) * 3600;
  }

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn as any,
    issuer: "scalable-auth-api"
  });

  return { token, expiresInSeconds };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: "scalable-auth-api"
  }) as AccessTokenPayload;
}
