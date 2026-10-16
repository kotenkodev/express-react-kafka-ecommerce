import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { orderRoutes } from "./routes/order.routes";
import { sseRoutes } from "./routes/sse.routes";
import {
  errorHandler,
  prisma,
  httpMetricsMiddleware,
  metricsHandler,
} from "@ecommerce/shared";
import { env } from "./config/env";
import { orderProducer } from "./producers/order.producer";
import { createServer } from "node:http";
import {
  statusConsumer,
  startStatusConsumer,
} from "./consumers/status.consumer";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.use(httpMetricsMiddleware);
app.get("/metrics", metricsHandler);

app.use("/orders", orderRoutes);

app.use("/events", sseRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

app.use(errorHandler);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}. Shutting down...`);

  const deadline = setTimeout(() => {
    console.error("Shutdown timed out");
    process.exit(1);
  }, 8000);
  deadline.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      const drainTimeout = setTimeout(() => {
        server.closeAllConnections();
      }, 3000);

      server.close((error) => {
        clearTimeout(drainTimeout);

        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    console.error("HTTP shutdown failed:", error);
    process.exitCode = 1;
  }

  try {
    await statusConsumer.disconnect();
  } catch (error) {
    console.error("Failed to disconnect status consumer:", error);
    process.exitCode = 1;
    return;
  }

  const results = await Promise.allSettled([
    orderProducer.disconnect(),
    prisma.$disconnect(),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Resource cleanup failed:", result.reason);
      process.exitCode = 1;
    }
  }

  clearTimeout(deadline);
}

async function start(): Promise<void> {
  await orderProducer.connect();
  console.log("Order Kafka producer connected");

  await startStatusConsumer();
  console.log("Order status consumer started");

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
      resolve();
    });

    server.once("error", reject);
  });

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

start().catch(async (error: unknown) => {
  console.error("Failed to start order service:", error);

  const deadline = setTimeout(() => process.exit(1), 8000);
  deadline.unref();

  try {
    await statusConsumer.disconnect();

    const results = await Promise.allSettled([
      orderProducer.disconnect(),
      prisma.$disconnect(),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Startup cleanup failed:", result.reason);
      }
    }

    clearTimeout(deadline);
  } catch (cleanupError) {
    console.error("Startup cleanup failed:", cleanupError);
  }

  process.exitCode = 1;
});

export default app;
