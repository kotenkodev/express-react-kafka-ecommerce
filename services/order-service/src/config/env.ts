import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  KAFKA_BROKERS: z.string().min(1).default("localhost:9092"),
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
  kafkaBrokers: raw.KAFKA_BROKERS.split(",").map((broker) => broker.trim()),
  redisUrl: raw.REDIS_URL,
  redisPassword: raw.REDIS_PASSWORD,
} as const;
