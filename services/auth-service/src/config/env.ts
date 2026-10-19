import { z } from "@ecommerce/shared";
import "dotenv/config";

const tokenDuration = z.enum(["15m", "30m", "1h", "7d", "30d"]);

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3006),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: tokenDuration.default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: tokenDuration.default("7d"),
  REDIS_URL: z
    .string()
    .url()
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "redis:" || protocol === "rediss:";
    }, "Redis URL must use redis:// or rediss://")
    .default("redis://localhost:6379"),
  REDIS_PASSWORD: z.string().min(1).optional(),
  TRUST_PROXY: z.string().default(""),
  ENABLE_RATE_LIMIT: z
    .string()
    .optional()
    .transform((val) => {
      if (val !== undefined) return val === "true" || val === "1";
      return process.env.NODE_ENV !== "development";
    })
    .default("false"),
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  LOGIN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
  LOGIN_FAILURE_LIMIT: z.coerce.number().int().positive().default(10),
  REGISTER_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(5),
  REFRESH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
});

const raw = schema.parse(process.env);

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  jwtSecret: raw.JWT_SECRET,
  jwtExpiresIn: raw.JWT_EXPIRES_IN,
  refreshTokenExpiresIn: raw.REFRESH_TOKEN_EXPIRES_IN,
  redisUrl: raw.REDIS_URL,
  redisPassword: raw.REDIS_PASSWORD,
  trustProxy: raw.TRUST_PROXY.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  enableRateLimit: raw.ENABLE_RATE_LIMIT,
  authRateLimit: raw.AUTH_RATE_LIMIT_PER_MINUTE,
  loginRateLimit: raw.LOGIN_RATE_LIMIT_PER_MINUTE,
  loginFailureLimit: raw.LOGIN_FAILURE_LIMIT,
  registerRateLimit: raw.REGISTER_RATE_LIMIT_PER_HOUR,
  refreshRateLimit: raw.REFRESH_RATE_LIMIT_PER_MINUTE,
} as const;
