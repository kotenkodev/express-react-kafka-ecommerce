import express from "express";
import cors from "cors";
import {
  authenticateToken,
  optionalToken,
} from "./middlewares/auth.middleware";
import {
  createGatewayProxy,
  createSseProxy,
} from "./middlewares/proxy.middleware";
import { env } from "./config/env";
import {
  errorHandler,
  httpMetricsMiddleware,
  metricsHandler,
} from "@ecommerce/shared";
import { Request, Response } from "express";

const app = express();
app.set("trust proxy", env.trustProxy);

const PORT = env.port;
const SERVICES = {
  auth: env.authServiceUrl,
  order: env.orderServiceUrl,
  product: env.productServiceUrl,
  search: env.searchServiceUrl,
  analytics: env.analyticsServiceUrl,
};

app.use(
  cors({
    origin: env.corsOrigins || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(httpMetricsMiddleware);
app.get("/metrics", metricsHandler);

app.use((req, _res, next) => {
  delete req.headers["x-user-id"];
  delete req.headers["x-user-email"];
  delete req.headers["x-user-role"];
  next();
});

app.use("/api/auth", optionalToken, createGatewayProxy(SERVICES.auth));

app.use("/api/orders", authenticateToken, createGatewayProxy(SERVICES.order));

app.use("/api/events", authenticateToken, createSseProxy(SERVICES.order));

app.use("/api/search", authenticateToken, createGatewayProxy(SERVICES.search));

app.use(
  "/api/analytics",
  authenticateToken,
  createGatewayProxy(SERVICES.analytics),
);

app.use("/api/products", optionalToken, createGatewayProxy(SERVICES.product));

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "api-gateway" }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on http://localhost:${PORT}`);
  console.log(`[Services]`);
  console.log(`auth-service: ${SERVICES.auth}`);
  console.log(`order-service: ${SERVICES.order}`);
  console.log(`search-service: ${SERVICES.search}`);
  console.log(`analytics-service: ${SERVICES.analytics}`);
  console.log(`products-service: ${SERVICES.product}`);
});
