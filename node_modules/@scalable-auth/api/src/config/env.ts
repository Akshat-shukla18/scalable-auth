import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  INSTANCE_ID: z.string().default(`api-${Math.random().toString(36).substring(2, 7)}`),
  
  // Database & Cache
  DATABASE_URL: z.string().default("postgresql://auth_user:auth_secret_password@localhost:5432/scalable_auth_db?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  
  // JWT & Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long").default("super-secret-jwt-signing-key-production-32-chars!"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters long").default("super-secret-refresh-token-signing-key-32-chars!"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().default(7),
  
  // CORS & Security
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  COOKIE_SECRET: z.string().default("cookie-secret-encryption-key-for-session-tokens"),
  
  // Email Configuration
  EMAIL_PROVIDER: z.enum(["mock", "resend", "smtp"]).default("mock"),
  EMAIL_FROM: z.string().email().default("noreply@scalableauth.internal"),
  EMAIL_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Rate Limiting (Requests per Window in Seconds)
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().default(5),
  RATE_LIMIT_REGISTER_WINDOW_SEC: z.coerce.number().default(60),
  
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().default(10),
  RATE_LIMIT_LOGIN_WINDOW_SEC: z.coerce.number().default(60),
  
  RATE_LIMIT_VERIFY_MAX: z.coerce.number().default(5),
  RATE_LIMIT_VERIFY_WINDOW_SEC: z.coerce.number().default(600),
  
  RATE_LIMIT_RESEND_MAX: z.coerce.number().default(3),
  RATE_LIMIT_RESEND_WINDOW_SEC: z.coerce.number().default(600),
  
  RATE_LIMIT_REFRESH_MAX: z.coerce.number().default(30),
  RATE_LIMIT_REFRESH_WINDOW_SEC: z.coerce.number().default(60),

  // Verification Code Expiry
  VERIFICATION_CODE_EXPIRES_MINUTES: z.coerce.number().default(15),
  VERIFICATION_MAX_ATTEMPTS: z.coerce.number().default(5)
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(result.error.format(), null, 2));
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
  return result.success ? result.data : envSchema.parse({});
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
