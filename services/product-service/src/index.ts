import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { productRoutes } from "./routes/product.routes";
import {
  errorHandler,
  httpMetricsMiddleware,
  metricsHandler,
} from "@ecommerce/shared";
import { env } from "./config/env";

dotenv.config();

const app = express();
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.use(httpMetricsMiddleware);
app.get("/metrics", metricsHandler);

app.use("/products", productRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "product-service" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});

export default app;
