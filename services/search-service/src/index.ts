import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { env } from "./config/env";
import {
  errorHandler,
  httpMetricsMiddleware,
  metricsHandler,
} from "@ecommerce/shared";
import { searchRouter } from "./routes/search.routes";
import { esClient, initElasticsearch } from "./config/elasticsearch";
import { eventConsumer, startEventConsumer } from "./consumers/search.consumer";
import { createServer } from "http";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.use(httpMetricsMiddleware);
app.get("/metrics", metricsHandler);

app.use("/search", searchRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "search-service" });
});

app.use(errorHandler);

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Search] Received ${signal}. Shutting down...`);
  try {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await eventConsumer.disconnect();
    await esClient.close();
    console.log(
      "[Search] Successfully disconnected from Kafka and Elasticsearch.",
    );
    process.exit(0);
  } catch (err) {
    console.error("[Search] Error during shutdown:", err);
    process.exit(1);
  }
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

async function start() {
  try {
    await initElasticsearch();
    await startEventConsumer();
    server.listen(PORT, () => {
      console.log(`Search service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Search] Failed to start search service:", error);
    process.exit(1);
  }
}
void start();
export default app;
