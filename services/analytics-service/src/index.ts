import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { env } from "./config/env";
import { analyticsRouter } from "./routes/analytics.routes";
import { createServer } from "http";
import {
  errorHandler,
  httpMetricsMiddleware,
  metricsHandler,
} from "@ecommerce/shared";
import { publishOrderStats, statsProducer } from "./producers/stats.producer";
import { slidingWindowService } from "./services/analyticsWindow";
import { startStatsPublisher } from "./services/statsPublisher";
import {
  analyticsConsumer,
  startAnalyticsConsumer,
} from "./consumers/analytics.consumer";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.use(httpMetricsMiddleware);
app.get("/metrics", metricsHandler);

app.use("/analytics", analyticsRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "analytics-service" });
});

app.use(errorHandler);

let stopPublishing: (() => Promise<void>) | undefined;

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Analytics] Received ${signal}. Shutting down...`);
  slidingWindowService.stopCleanup();
  try {
    await stopPublishing?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await analyticsConsumer.disconnect();
    await statsProducer.disconnect();
    console.log(
      "[Analytics] Successfully disconnected from Kafka and closed HTTP server.",
    );
    process.exit(0);
  } catch (err) {
    console.error("[Analytics] Error during shutdown:", err);
    process.exit(1);
  }
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

async function start() {
  try {
    slidingWindowService.startCleanup();
    await statsProducer.connect();
    console.log("[Analytics] Kafka stats producer connected");
    await startAnalyticsConsumer();
    console.log("[Analytics] Kafka consumer started");

    stopPublishing = startStatsPublisher(
      () => publishOrderStats(slidingWindowService.getStats()),
      err => console.error("[Analytics] Error publishing stats:", err),
    );
    server.listen(PORT, () => {
      console.log(`Analytics service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Analytics] Failed to start analytics service:", error);
    process.exit(1);
  }
}
void start();

export default app;
