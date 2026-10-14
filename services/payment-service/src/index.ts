import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { env } from "./config/env";
import { metricsRegistry, httpRequestsTotal } from "@ecommerce/shared";
import { paymentProducer } from "./producers/payment.producer";
import { orderConsumer, startOrderConsumer } from "./consumers/order.consumer";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    const route = req.baseUrl || req.path || "unknown";
    httpRequestsTotal.inc({
      route,
      status_code: res.statusCode.toString(),
    });
  });
  next();
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "payment-service" });
});

app.get("/metrics", async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Payment] Received ${signal}. Shutting down...`);

  try {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await orderConsumer.disconnect();
    await paymentProducer.disconnect();
    console.log(
      "[Payment] Successfully disconnected from Kafka and closed HTTP server.",
    );
    process.exit(0);
  } catch (err) {
    console.error("[Payment] Error during shutdown:", err);
    process.exit(1);
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

async function start() {
  try {
    await paymentProducer.connect();
    console.log("[Payment] Kafka producer connected");

    await startOrderConsumer();
    console.log("[Payment] Order consumer started and subscribed to 'orders'");

    server.listen(PORT, () => {
      console.log(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Payment] Failed to start payment service:", error);
    process.exit(1);
  }
}

void start();

export default app;
