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

const app = express();

const PORT = env.port;
const SERVICES = {
  auth: env.authServiceUrl,
  order: env.orderServiceUrl,
  product: env.productServiceUrl,
  search: env.searchServiceUrl,
  analytics: env.analyticsServiceUrl,
};

app.use(cors());

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

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on http://localhost:${PORT}`);
  console.log(`[Services]`);
  console.log(`auth-service: ${SERVICES.auth}`);
  console.log(`order-service: ${SERVICES.order}`);
  console.log(`search-service: ${SERVICES.search}`);
  console.log(`analytics-service: ${SERVICES.analytics}`);
  console.log(`products-service: ${SERVICES.product}`);
});
