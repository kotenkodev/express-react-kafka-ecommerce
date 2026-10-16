import "dotenv/config";
import { z } from "@ecommerce/shared";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3005),
  ELASTICSEARCH_URL: z.string().default("http://localhost:9200"),
  KAFKA_BROKERS: z.string().default("localhost:9092"),
});

const raw = schema.parse(process.env);

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  elasticsearchUrl: raw.ELASTICSEARCH_URL,
  kafkaBrokers: raw.KAFKA_BROKERS.split(",").map((broker) => broker.trim()),
} as const;
