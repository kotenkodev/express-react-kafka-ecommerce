import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3002),
  KAFKA_BROKERS: z.string().default("localhost:9092"),
});

const raw = schema.parse(process.env);

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  kafkaBrokers: raw.KAFKA_BROKERS.split(",").map((b) => b.trim()),
} as const;
