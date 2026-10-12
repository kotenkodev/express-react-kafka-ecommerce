import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Service hostnames (configured via env in docker-compose)
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || "http://auth-service:3006",
  order: process.env.ORDER_SERVICE_URL || "http://order-service:3001",
  product: process.env.PRODUCT_SERVICE_URL || "http://product-service:3007",
  search: process.env.SEARCH_SERVICE_URL || "http://search-service:3005",
  analytics:
    process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:3004",
};

app.use(cors());

// 1. Sanitize incoming spoofed headers
app.use((req, res, next) => {
  delete req.headers["x-user-id"];
  delete req.headers["x-user-email"];
  delete req.headers["x-user-role"];
  next();
});

// 2. JWT Verification Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    // Attach decoded user info
    req.user = decoded;
    next();
  });
};

// Optional auth for endpoints where auth is optional (e.g., GET /products)
const optionalToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) req.user = decoded;
      next();
    });
  } else {
    next();
  }
};

// Helper: Configure proxy options with header injection and path rewrite
const createGatewayProxy = (target, stripPrefix = true) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: stripPrefix ? { "^/api": "" } : undefined,
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward verified user headers to downstream services
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.id);
          proxyReq.setHeader("x-user-email", req.user.email);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
      error: (err, req, res) => {
        console.error(`Proxy error connecting to ${target}:`, err.message);
        if (!res.headersSent) {
          res
            .status(502)
            .json({ error: "Bad Gateway: downstream service unavailable" });
        }
      },
    },
  });
};

// 3. Route Proxying

// Auth Service (Public endpoints like /login, /register; pass-through)
app.use("/api/auth", optionalToken, createGatewayProxy(SERVICES.auth));

// Products Service (Public read, admin-checked write downstream)
app.use("/api/products", optionalToken, createGatewayProxy(SERVICES.product));

// Order Service & SSE (/api/orders & /api/events)
app.use("/api/orders", authenticateToken, createGatewayProxy(SERVICES.order));
app.use(
  "/api/events",
  authenticateToken,
  createProxyMiddleware({
    target: SERVICES.order,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
    // Important for SSE: prevent response buffering
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.id);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
    },
  }),
);

// Search Service (Full-text order search)
app.use("/api/search", authenticateToken, createGatewayProxy(SERVICES.search));

// Analytics Service
app.use(
  "/api/analytics",
  authenticateToken,
  createGatewayProxy(SERVICES.analytics),
);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "api-gateway" }),
);

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
