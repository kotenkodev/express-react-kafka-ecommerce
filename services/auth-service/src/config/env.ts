import "dotenv/config";
import { z } from "@ecommerce/shared";

const tokenDuration = z.enum(["15m", "30m", "1h", "7d", "30d"]);

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8000),
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
} as const;
