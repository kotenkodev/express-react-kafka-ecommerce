import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRoutes } from "./routes/auth.routes";
import { errorHandler } from "@ecommerce/shared";
import cookieParser from "cookie-parser";
import { connectRedis, disconnectRedis } from "./lib/redis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

app.use(errorHandler);

const start = async () => {
  await connectRedis();
  const server = app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await disconnectRedis();
        console.log("Redis disconnected.");
      } catch (err) {
        console.error("Error disconnecting Redis:", err);
      } finally {
        process.exit(0);
      }
    });

    setTimeout(() => {
      console.error("Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();

export default app;

