import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { env } from "./config/env";
import { httpMetricsMiddleware, metricsHandler } from "@ecommerce/shared";
import { statusProducer } from "./producers/status.producer";
import {
  paymentConsumer,
  startPaymentConsumer,
} from "./consumers/payment.consumer";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.use(httpMetricsMiddleware);
app.get("/metrics", metricsHandler);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "delivery-service" });
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Delivery] Received ${signal}. Shutting down...`);

  try {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await paymentConsumer.disconnect();
    await statusProducer.disconnect();
    console.log(
      "[Delivery] Successfully disconnected from Kafka and closed HTTP server.",
    );
    process.exit(0);
  } catch (err) {
    console.error("[Delivery] Error during shutdown:", err);
    process.exit(1);
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

async function start() {
  try {
    await statusProducer.connect();
    console.log("[Delivery] Kafka status producer connected");

    await startPaymentConsumer();
    console.log(
      "[Delivery] Payment consumer started and subscribed to 'payments'",
    );

    server.listen(PORT, () => {
      console.log(`Delivery service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Delivery] Failed to start delivery service:", error);
    process.exit(1);
  }
}

void start();

export default app;
