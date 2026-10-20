import "dotenv/config";
import { z } from "@ecommerce/shared";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3004),
  KAFKA_BROKERS: z.string().default("localhost:9092"),
  CORRELATION_RETENTION_MS: z.coerce.number().int().min(60_000).default(86_400_000),
});

const raw = schema.parse(process.env);

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  correlationRetentionMs: raw.CORRELATION_RETENTION_MS,
  kafkaBrokers: raw.KAFKA_BROKERS.split(",").map((broker) => broker.trim()),
} as const;
