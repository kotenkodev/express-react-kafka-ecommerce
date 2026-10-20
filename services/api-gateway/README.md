# 🌐 API Gateway

A centralized API Gateway and reverse proxy built with **Node.js, TypeScript, and Express.js** for an event-driven e-commerce microservices platform.

The API Gateway serves as the **single entry point** for client applications, handling request routing, JWT authentication, role-based authorization, CORS configuration, and observability. It securely forwards requests to downstream microservices while propagating verified user information through trusted internal headers.

## 🚀 Key Features

- **Centralized API Routing** — Provides a unified entry point for Auth, Order, Product, Search, and Analytics services.
- **JWT Authentication** — Validates JSON Web Tokens before forwarding requests to protected services.
- **Role-Based Access Control (RBAC)** — Restricts administrative endpoints to users with the `admin` role.
- **Reverse Proxy** — Dynamically routes incoming requests to the appropriate downstream microservice.
- **Server-Sent Events (SSE)** — Supports proxying real-time event streams from the Order Service.
- **Trusted Header Injection** — Forwards verified user identity and role information through internal HTTP headers.
- **Header Spoofing Protection** — Removes client-supplied identity headers before processing requests.
- **Idempotency Support** — Preserves the `Idempotency-Key` header for downstream request deduplication.
- **CORS Management** — Centralizes cross-origin request configuration for frontend applications.
- **Prometheus Monitoring** — Exposes HTTP metrics with configurable metrics endpoint access.
- **Environment Validation** — Uses Zod for type-safe configuration validation.
- **Docker Support** — Provides containerized execution using Node.js 20 Alpine.

## 🛠 Tech Stack

| Technology            | Purpose                                      |
| --------------------- | -------------------------------------------- |
| Node.js 20            | JavaScript runtime                           |
| TypeScript            | Type-safe application development            |
| Express.js 5          | HTTP server and middleware                   |
| http-proxy-middleware | Reverse proxy and request forwarding         |
| JSON Web Tokens       | Authentication and authorization             |
| jsonwebtoken          | JWT verification                             |
| cors                  | Cross-origin resource sharing                |
| Zod                   | Environment configuration validation         |
| dotenv                | Environment variable loading                 |
| Prometheus            | HTTP metrics and monitoring                  |
| Docker                | Containerization                             |
| @ecommerce/shared     | Shared types, middleware, and error handling |

## 🏗 Architecture

The API Gateway sits between client applications and backend microservices, providing a centralized layer for authentication, authorization, request routing, and monitoring.

```text
                    ┌─────────────────────┐
                    │   Web Application   │
                    │    / API Clients    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     API Gateway     │
                    │      Port 8000      │
                    │                     │
                    │  • JWT Validation   │
                    │  • Role-Based Auth  │
                    │  • CORS Management  │
                    │  • Request Proxy    │
                    │  • HTTP Monitoring  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │    Auth    │   │   Order    │   │  Product   │
       │  Service   │   │  Service   │   │  Service   │
       └────────────┘   └────────────┘   └────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
              ┌────────────┐      ┌────────────┐
              │   Search   │      │ Analytics  │
              │  Service   │      │  Service   │
              └────────────┘      └────────────┘
```

### Request Lifecycle

When a client sends an HTTP request, the API Gateway applies the appropriate middleware before forwarding the request to its destination.

```text
Client Request
      │
      ▼
CORS Middleware
      │
      ▼
HTTP Metrics Middleware
      │
      ▼
Remove Client Identity Headers
      │
      ▼
Route Matching
      │
      ▼
JWT Authentication (if required)
      │
      ▼
Role Authorization (if required)
      │
      ▼
Inject Verified User Headers
      │
      ▼
Reverse Proxy
      │
      ▼
Downstream Microservice
      │
      ▼
HTTP Response / Event Stream
```

The Gateway also normalizes proxied CORS behavior by removing downstream CORS response headers, allowing the Gateway to manage cross-origin policies centrally.

## 📡 API Routing

The Gateway exposes a unified `/api` prefix for backend services.

| Endpoint           | Target Service      | Authentication | Required Role                                                  |
| ------------------ | ------------------- | -------------- | -------------------------------------------------------------- |
| `/api/auth/*`      | Auth Service        | Optional       | Any                                                            |
| `/api/orders/*`    | Order Service       | Required       | Any authenticated user                                         |
| `/api/events/*`    | Order Service (SSE) | Required       | Any authenticated user                                         |
| `/api/products/*`  | Product Service     | Optional       | Any                                                            |
| `/api/search/*`    | Search Service      | Required       | `admin`                                                        |
| `/api/analytics/*` | Analytics Service   | Required       | `admin`                                                        |
| `/health`          | API Gateway         | No             | Public                                                         |
| `/metrics`         | API Gateway         | Restricted     | Scrape token or admin JWT; Prometheus User-Agent also accepted |

### Path Rewriting

The Gateway removes the leading `/api` prefix before forwarding requests to downstream services.

For example:

```text
Client:
GET /api/orders/123

Downstream:
GET /orders/123
```

Similarly:

```text
GET /api/products    → Product Service /products
GET /api/search      → Search Service /search
GET /api/analytics   → Analytics Service /analytics
GET /api/auth/login  → Auth Service /auth/login
```

This allows backend services to retain their existing route structures without exposing separate service URLs to client applications.

## 🔐 Authentication & Authorization

The API Gateway uses JWT-based authentication to verify client identity and enforce access policies.

### JWT Authentication

Protected routes require a valid JWT.

The Gateway accepts tokens through the standard authorization header:

```http
Authorization: Bearer <access_token>
```

The current implementation also supports a `token` query parameter when a bearer token is not present.

Example request:

```bash
curl http://localhost:8000/api/orders \
  -H "Authorization: Bearer <access_token>"
```

JWT signatures are verified using the configured `JWT_SECRET`.

### Authentication Middleware

**`authenticateToken`**

Enforces JWT authentication on protected routes. Requests without a token receive HTTP `401`, while invalid or expired tokens receive HTTP `403`.

**`optionalToken`**

Attempts to validate a JWT when supplied. If the token is missing or invalid, the request continues without an authenticated user.

This middleware is used for routes such as `/api/auth` and `/api/products`, where authentication is optional.

**`requireRole`**

Checks whether the authenticated user's role matches the required role.

Administrative routes are protected using:

```typescript
(authenticateToken, requireRole("admin"));
```

Only authenticated users with the `admin` role can access the Search and Analytics endpoints.

### Authentication Errors

Example missing-token response:

```json
{
  "error": "Access token required"
}
```

HTTP Status: `401 Unauthorized`

Example invalid-token response:

```json
{
  "error": "Invalid or expired token"
}
```

HTTP Status: `403 Forbidden`

Example insufficient-role response:

```json
{
  "error": "Forbidden: Admin role required"
}
```

HTTP Status: `403 Forbidden`

## 🛡 Trusted Header Injection

After JWT verification, the Gateway injects trusted user information into proxied HTTP requests.

| Header            | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `x-user-id`       | Authenticated user identifier                         |
| `x-user-email`    | Authenticated user's email address, when available    |
| `x-user-role`     | Authenticated user's role                             |
| `x-forwarded-for` | Client IP information used by the standard HTTP proxy |
| `idempotency-key` | Original client idempotency key, when provided        |

Example forwarded headers:

```http
x-user-id: 42
x-user-email: user@example.com
x-user-role: admin
```

### Header Spoofing Protection

To prevent clients from impersonating other users, the Gateway removes incoming identity headers before executing route-specific middleware.

```typescript
delete req.headers["x-user-id"];
delete req.headers["x-user-email"];
delete req.headers["x-user-role"];
```

Only user information obtained from successfully verified JWTs is used to populate trusted identity headers.

**Important:** Downstream services should only trust these headers when requests originate from the Gateway or another explicitly trusted internal component.

## 🔄 Reverse Proxy

The Gateway uses `http-proxy-middleware` to forward incoming requests to their corresponding microservices.

The proxy provides request routing, configurable target URLs, path rewriting, forwarded user information, and upstream error handling.

### Standard Proxy

The `createGatewayProxy` function handles regular HTTP communication with downstream services.

It supports:

- Configurable target service URLs
- `/api` prefix rewriting
- Forwarding authenticated user identity
- Preserving idempotency keys
- Client IP forwarding
- Downstream CORS header removal
- HTTP `502` responses for proxy connection failures

### Proxy Error Handling

If a downstream service is unavailable, the Gateway returns:

```json
{
  "error": "Bad Gateway",
  "message": "Downstream service is currently unavailable"
}
```

HTTP Status: `502 Bad Gateway`

This response prevents raw proxy errors from being returned directly to clients.

## 📡 Server-Sent Events (SSE)

The API Gateway includes a dedicated proxy for real-time server-sent event streams.

**Endpoint:**

```http
GET /api/events
```

**Target:** Order Service

**Authentication:** Required

The `createSseProxy` function forwards authenticated requests to the Order Service's event endpoint.

It propagates the verified `x-user-id` and `x-user-role` headers, supporting user-aware event streams.

Example:

```bash
curl -N http://localhost:8000/api/events \
  -H "Authorization: Bearer <access_token>"
```

If the downstream SSE connection cannot be established, the Gateway returns:

```json
{
  "error": "Bad Gateway",
  "message": "Downstream SSE event stream unavailable"
}
```

HTTP Status: `502 Bad Gateway`

## 🔁 Idempotency Support

The Gateway preserves the `Idempotency-Key` request header when forwarding standard HTTP requests.

This allows downstream services to implement idempotent operations and reduce the risk of duplicate processing.

Example:

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-123" \
  -d '{"example":"payload"}'
```

The Gateway forwards the key but does not independently implement idempotency storage or deduplication. Those responsibilities belong to downstream services.

## 🌍 CORS Configuration

Cross-Origin Resource Sharing is configured centrally at the Gateway.

By default, requests from the local frontend are permitted:

```text
http://localhost:5173
```

Additional origins can be configured using the `CORS_ORIGINS` environment variable.

Example:

```dotenv
CORS_ORIGINS=http://localhost:5173,https://app.example.com
```

The CORS middleware enables credentials and accepts common application headers, including `Authorization`, `Content-Type`, and `Idempotency-Key`.

The proxy also removes downstream CORS response headers to avoid conflicts with the Gateway's CORS configuration.

## 📊 Monitoring & Observability

The API Gateway integrates Prometheus metrics through the internal `@ecommerce/shared` package.

### GET `/metrics`

Exposes HTTP metrics in Prometheus-compatible format.

Access is controlled by the `metricsAuth` middleware.

The current implementation allows access when a request provides a valid configured metrics scrape token, a valid administrator JWT, or a User-Agent beginning with `Prometheus/`.

Example using a scrape token:

```bash
curl http://localhost:8000/metrics \
  -H "Authorization: Bearer <metrics_scrape_token>"
```

The endpoint can be integrated with Prometheus and visualized through monitoring platforms such as Grafana.

### GET `/health`

Provides a basic health check.

```bash
curl http://localhost:8000/health
```

Response:

```json
{
  "status": "ok",
  "service": "api-gateway"
}
```

HTTP Status: `200 OK`

This is a basic application health check and does not verify connectivity to downstream microservices.

## ⚙️ Environment Variables

Configuration is loaded through `dotenv` and validated using Zod during service initialization.

| Variable                | Required | Default                 | Description                                     |
| ----------------------- | -------- | ----------------------- | ----------------------------------------------- |
| `PORT`                  | No       | `8000`                  | HTTP server port                                |
| `NODE_ENV`              | No       | `development`           | Runtime environment                             |
| `AUTH_SERVICE_URL`      | Yes      | —                       | Auth Service URL                                |
| `ORDER_SERVICE_URL`     | Yes      | —                       | Order Service URL                               |
| `PRODUCT_SERVICE_URL`   | Yes      | —                       | Product Service URL                             |
| `SEARCH_SERVICE_URL`    | Yes      | —                       | Search Service URL                              |
| `ANALYTICS_SERVICE_URL` | Yes      | —                       | Analytics Service URL                           |
| `JWT_SECRET`            | Yes      | —                       | JWT verification secret (minimum 16 characters) |
| `CORS_ORIGINS`          | No       | `http://localhost:5173` | Comma-separated allowed origins                 |
| `TRUST_PROXY`           | No       | Empty string            | Comma-separated Express proxy trust settings    |
| `METRICS_SCRAPE_TOKEN`  | No       | Built-in fallback       | Bearer token for Prometheus scraping            |

### Example `.env`

```dotenv
NODE_ENV=development
PORT=8000

AUTH_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
PRODUCT_SERVICE_URL=http://localhost:3003
SEARCH_SERVICE_URL=http://localhost:3005
ANALYTICS_SERVICE_URL=http://localhost:3004

JWT_SECRET=replace_with_your_secure_jwt_secret
METRICS_SCRAPE_TOKEN=replace_with_a_secure_metrics_token

CORS_ORIGINS=http://localhost:5173
TRUST_PROXY=
```

The service URLs above are illustrative local-development values. Update them to match your actual service configuration.

All five downstream service URLs must be valid URLs. The `JWT_SECRET` must contain at least 16 characters.

## 💻 Getting Started

### Prerequisites

The following tools and dependencies are required:

- Node.js 20 or later
- npm
- Access to the e-commerce monorepo
- The `@ecommerce/shared` workspace package
- Configured downstream microservices
- Docker (optional)

### Local Development

Install workspace dependencies from the monorepo root:

```bash
npm install
```

Navigate to the Gateway directory:

```bash
cd services/api-gateway
```

Configure the required environment variables using a `.env` file or your development environment.

Start the service in development mode:

```bash
npm run dev
```

The development script uses `tsx watch` to automatically reload the application when source files change.

The Gateway listens on:

```text
http://localhost:8000
```

### Production Build

Compile TypeScript into JavaScript:

```bash
npm run build
```

Start the compiled application:

```bash
npm run start
```

The production script executes:

```bash
node dist/index.js
```

Ensure the shared workspace package has been built and the compiled module imports are compatible with your runtime environment.

### Docker

The repository provides a Dockerfile based on `node:20-alpine`.

It installs workspace dependencies, copies the Gateway and shared package source, and builds the shared package.

Because the Dockerfile expects monorepo paths, build from the **repository root**:

```bash
docker build -f services/api-gateway/Dockerfile -t api-gateway .
```

Run the container:

```bash
docker run -p 8000:8000 \
  --env-file services/api-gateway/.env \
  api-gateway
```

When running inside Docker, ensure service URLs are reachable from the container. Localhost addresses refer to the container itself, not automatically to the host machine.

The existing `Dockerfile` runs `npm run dev` for development. For production, use the separate multi-stage image from the repository root:

```bash
docker build -f services/api-gateway/Dockerfile.prod -t api-gateway:production .
docker run --rm -p 8000:8000 --env-file services/api-gateway/.env api-gateway:production
```

The production image compiles the shared package and gateway using TypeScript, removes development dependencies, and runs `node dist/index.js` as the non-root `node` user with `NODE_ENV=production`. Node-compatible CommonJS output requires no bundler or custom build script.

Supply the required service URLs and JWT secret through the environment file or deployment environment. Service URLs must be reachable from the container; do not bake secrets into the image.

## 📂 Project Structure

```text
api-gateway/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── metrics.middleware.ts
│   │   └── proxy.middleware.ts
│   │
│   ├── types/
│   │   └── global.d.ts
│   │
│   └── index.ts
│
├── dist/
│   └── ...
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

| File                                    | Responsibility                                                        |
| --------------------------------------- | --------------------------------------------------------------------- |
| `src/index.ts`                          | Express initialization, middleware registration, routing, and startup |
| `src/config/env.ts`                     | Environment variable validation and configuration                     |
| `src/middlewares/auth.middleware.ts`    | JWT authentication and RBAC                                           |
| `src/middlewares/metrics.middleware.ts` | Prometheus endpoint access control                                    |
| `src/middlewares/proxy.middleware.ts`   | HTTP reverse proxy and SSE proxy                                      |
| `src/types/global.d.ts`                 | TypeScript declarations for authenticated Express requests            |
| `Dockerfile`                            | Container image configuration                                         |
| `tsconfig.json`                         | TypeScript compilation settings                                       |

## 📦 Shared Dependencies

The Gateway relies on the internal `@ecommerce/shared` package for common functionality.

It imports:

- `AuthenticatedUser` — Shared authenticated user type
- `httpMetricsMiddleware` — HTTP metrics instrumentation
- `metricsHandler` — Prometheus metrics endpoint handler
- `errorHandler` — Shared Express error handling

Using a shared package promotes consistent contracts, monitoring, and error handling across the e-commerce microservices.

## 🔒 Production Considerations

The Gateway is a security-sensitive entry point and should be deployed with appropriate infrastructure controls.

**JWT Security:** Use a strong secret managed through environment configuration or a secrets manager. The Gateway and token-issuing service must use compatible JWT verification settings.

**Metrics Security:** Configure a unique `METRICS_SCRAPE_TOKEN` and remove User-Agent-based access bypasses before exposing metrics outside a trusted network. The current implementation accepts requests identifying themselves as Prometheus without independently verifying their origin.

**Trusted Headers:** Prevent clients from accessing backend services directly when those services trust Gateway-injected identity headers.

**Query Tokens:** Prefer authorization headers over URL query parameters because URLs may be recorded in logs or monitoring systems.

**CORS:** Explicitly configure trusted frontend origins in production.

**Proxy Configuration:** Configure `TRUST_PROXY` to match your infrastructure's trusted reverse proxies.

**Container Deployment:** Build and run compiled production artifacts rather than using development watch mode.

**Service Availability:** The Gateway returns HTTP `502` for supported upstream connection errors, but it does not currently implement dedicated circuit breakers, retry policies, or service health aggregation.

## 📝 Notes

The API Gateway provides centralized HTTP access to the e-commerce platform but does not directly handle Kafka events or business logic.

Backend services remain responsible for their own domain-specific functionality, such as order processing, payment handling, product management, searching, and analytics.

The Gateway focuses on secure request forwarding, access control, identity propagation, cross-origin configuration, and operational visibility.

---

**API Gateway** — A centralized, secure, and observable entry point for the e-commerce microservices platform.
