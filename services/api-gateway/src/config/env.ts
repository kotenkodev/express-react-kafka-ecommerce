import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8000),
  AUTH_SERVICE_URL: z.string().url(),
  ORDER_SERVICE_URL: z.string().url(),
  PRODUCT_SERVICE_URL: z.string().url(),
  SEARCH_SERVICE_URL: z.string().url(),
  ANALYTICS_SERVICE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.string().default(""),
  METRICS_SCRAPE_TOKEN: z
    .string()
    .default("internal-prometheus-metrics-secret-key"),
});

const raw = schema.parse(process.env);

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  authServiceUrl: raw.AUTH_SERVICE_URL,
  orderServiceUrl: raw.ORDER_SERVICE_URL,
  productServiceUrl: raw.PRODUCT_SERVICE_URL,
  searchServiceUrl: raw.SEARCH_SERVICE_URL,
  analyticsServiceUrl: raw.ANALYTICS_SERVICE_URL,
  jwtSecret: raw.JWT_SECRET,
  metricsScrapeToken: raw.METRICS_SCRAPE_TOKEN,
  trustProxy: raw.TRUST_PROXY.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  corsOrigins: raw.CORS_ORIGINS?.split(",").map((o) => o.trim()) || [
    "http://localhost:5173",
  ],
} as const;
