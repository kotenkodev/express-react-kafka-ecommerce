# E-Commerce Order Processing Platform v2 — System Context & Spec

Event-driven microservices e-commerce platform communicating asynchronously via Apache Kafka with JWT auth, role-based access, full-text Elasticsearch indexing, Prometheus analytics, and React frontend.

## 1. Architecture & Port Map

| Component             | Port                        | Stack / Image                      | Role / Routing                                                                                                                                  |
| --------------------- | --------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **frontend**          | `80` (prod), `5173` (dev)   | React 18 + Vite + Nginx            | SPA client, SSE listener, Zustand stores                                                                                                        |
| **api-gateway**       | `8000`                      | Node.js / Express                  | Single entrypoint. JWT verify, header injection (`x-user-id`, `x-user-email`, `x-user-role`), reverse proxy                                     |
| **auth-service**      | `3006`                      | Express + Prisma + Redis           | JWT access (15m) + Redis refresh token (7d TTL: `refresh_token:<userId>`). User roles: `user`, `admin`                                          |
| **order-service**     | `3001`                      | Express + Prisma + Kafka           | REST API, Kafka producer (`orders`), status consumer (`order.status.updated`), SSE stream (`/events`)                                           |
| **payment-service**   | `3002`                      | Node Kafka Worker                  | Consumes `orders`. Simulates payment: 1–3s latency, 80% SUCCESS / 20% FAILED. Retries: 3x (1s, 2s, 4s backoff) → `orders.DLQ`                   |
| **delivery-service**  | `3003`                      | Node Kafka Worker                  | Consumes `payments`. Skips FAILED. Random courier (`Іван`,`Марія`,`Олег`,`Аня`,`Тарас`,`Оля`). Stages every 5s: PREPARING → SHIPPED → DELIVERED |
| **analytics-service** | `3004`                      | Node Kafka Streams                 | 1-min sliding window: order count, total revenue, successRate, avgProcessingMs. Emits `order-stats`, Prometheus `/metrics`                      |
| **search-service**    | `3005`                      | Express + `@elastic/elasticsearch` | Consumes `orders`, `payments`, `order.status.updated`, `orders.DLQ`. Idempotent upsert into ES index `orders`. Full-text search API             |
| **product-service**   | `3007`                      | Express + Prisma                   | Catalog CRUD. Public read, admin-only write via `adminOnly` middleware (checks `x-user-role === 'admin'`, 403 on fail)                          |
| **kafka**             | `9092` (int), `29092` (ext) | `cp-kafka:7.5.0`                   | Event broker                                                                                                                                    |
| **zookeeper**         | `2181`                      | `cp-zookeeper:7.5.0`               | Cluster coordination                                                                                                                            |
| **kafka-ui**          | `8080`                      | `provectuslabs/kafka-ui`           | Kafka web UI                                                                                                                                    |
| **elasticsearch**     | `9200`                      | `elasticsearch:8.11.0`             | Search engine                                                                                                                                   |
| **kibana**            | `5601`                      | `kibana:8.11.0`                    | Elasticsearch dashboard                                                                                                                         |
| **postgres**          | `5432`                      | `postgres:16-alpine`               | Relational storage (Users, Orders, Products)                                                                                                    |
| **redis**             | `6379`                      | `redis:7-alpine`                   | Refresh tokens store                                                                                                                            |
| **prometheus**        | `9090`                      | `prom/prometheus:latest`           | Metrics scraping (15s interval)                                                                                                                 |
| **grafana**           | `3000`                      | `grafana/grafana:latest`           | Monitoring dashboards (10s auto-refresh, 6 panels)                                                                                              |

Default Admin Seed: `admin@kafkashop.com` / `admin123`.

## 2. Gateway Route Proxying

- `/api/auth/*` → `auth-service:3006`
- `/api/orders` & `/api/events` (SSE) → `order-service:3001`
- `/api/products/*` → `product-service:3007`
- `/api/search/*` → `search-service:3005`
- `/api/analytics` → `analytics-service:3004`

## 3. Kafka Topics, Flow & Event Contracts

Key partitioning: always by `orderId`.

- **`orders`** (`OrderCreatedEvent`, `order-service` → `payment`, `search`, `analytics`):
  `{"orderId":"uuid","userId":"uuid","items":[{"productId":"string","quantity":number,"price":number}],"totalAmount":number,"createdAt":"ISO"}`
- **`payments`** (`PaymentProcessedEvent`, `payment-service` → `delivery`, `search`, `analytics`):
  `{"paymentId":"uuid","orderId":"uuid","status":"SUCCESS"|"FAILED","processedAt":"ISO","failureReason":string|null}`
- **`order.status.updated`** (`delivery-service` → `order-service`, `search`, `analytics`):
  `{"orderId":"uuid","status":"PREPARING"|"SHIPPED"|"DELIVERED","courier":"string","updatedAt":"ISO"}`
- **`orders.DLQ`** (`payment-service` on 3 failed retries → `search`, alerts):
  `{"originalMessage":object,"error":"string","retryCount":3,"failedAt":"ISO"}`
- **`order-stats`** (`analytics-service` → dashboards/monitors):
  `{"windowStart":"ISO","ordersCount":number,"totalRevenue":number,"successRate":number,"avgProcessingMs":number}`

## 4. Service APIs & Endpoints

### Auth (`:3006`)

- `POST /auth/register` (body: email, username, password, firstName, lastName; default role: 'user')
- `POST /auth/login` → `{ accessToken, refreshToken, user }`
- `POST /auth/refresh` (body: refreshToken) → `{ accessToken }`
- `POST /auth/logout` (body: refreshToken) → del Redis key `refresh_token:<userId>`
- `GET /auth/me` (Bearer token) → `{ id, email, username, role, firstName, lastName }`

### Order (`:3001`)

- `POST /orders` (body: items: `[{productId, quantity, price}]`) → saves `PENDING` to Postgres, emits `orders`
- `GET /orders/:id` → order status & details
- `GET /orders` → list orders (`admin`: all; `user`: only own orders filtered by `x-user-id`)
- `GET /events` → SSE stream (real-time order status updates for client)
- `GET /health`, `GET /metrics`

### Product (`:3007`)

- `GET /products?q=&category=&minPrice=&maxPrice=&inStock=` (public catalog filter)
- `GET /products/categories` (unique categories list)
- `GET /products/:id` (product details)
- `POST /products`, `PUT /products/:id`, `DELETE /products/:id` (requires `x-user-role === 'admin'`, else 403)

### Search (`:3005`)

- `GET /search?q=&status=&page=&limit=` (full-text search, status filter, pagination)
- `GET /search/orders/:id` (get order doc from Elasticsearch)
- `GET /search/stats` (ES aggs: `totalOrders`, `totalRevenue`, `avgOrderAmount`)
- ES Upsert semantics: `orders` -> index new; `payments` -> update paymentStatus/processedAt; `order.status.updated` -> update status/courier; `orders.DLQ` -> set status="payment_failed".

### Analytics (`:3004`)

- `GET /analytics` → current 1-min sliding window aggregations
- `GET /metrics` → Prometheus scrape endpoint

## 5. Shared Package (`@ecommerce/shared`)

- `prisma/schema.prisma`: Unified models (`User`, `Order`, `Product`, `OrderItem`)
- `src/prisma.ts`: Singleton `PrismaClient`
- `src/kafka/client.ts`: `createProducer()`, `createConsumer()` wrapper around `kafkajs`
- `src/kafka/retry.ts`: `withRetry()` helper (exponential backoff 1s, 2s, 4s) & `publishToDLQ()`
- `src/kafka/metrics.ts`: Prometheus metrics collectors
- `src/types/events.ts`: TypeScript interfaces for Kafka events & DTOs
- `src/middleware/auth.ts`: Gateway header validation & role check utilities

## 6. Frontend Architecture (React 18 + Vite + TS)

- **Stores (Zustand)**:
  - `authStore`: `user`, `accessToken`, `refreshToken`, `login()`, `logout()`, `isAdmin()`
  - `cartStore`: `items`, `addItem()`, `removeItem()`, `updateQty()`, `total()`, `count()`, `clear()`
  - `ordersStore`: `orders`, `total`, `updateOrderStatus()`, SSE connection listener
  - `analyticsStore`: `successRate`, `avgMs`, `totals`, chart time series
- **Routes & Permissions**:
  - `/`: `ShopPage` (user) or redirect `/orders` (admin)
  - `/orders`: `OrdersPage` (user sees own, admin sees all; status badges: PENDING=gray, PREPARING=amber, SHIPPED=blue, DELIVERED=green, FAILED=red)
  - `/analytics`: `AnalyticsPage` (admin only; Recharts line chart orders/min, pie chart success rate, stat cards)
  - `/search`: `SearchPage` (admin only; 300ms debounced input, status filter, pagination, cards)
  - `/product-search`: `ProductSearchPage` (user only; 300ms debounced input, category/price filters, grid + Add to Cart)
  - `/products`: `AdminProductsPage` (admin only; CRUD table, Formik+Yup modal, emoji picker, delete confirm)

## 7. Metrics & Observability

Prometheus scrapes `/metrics` every 15s. Grafana 6-panel dashboard refreshes every 10s:

- `kafka_messages_produced_total` [Counter] (topic)
- `kafka_messages_consumed_total` [Counter] (topic)
- `kafka_consumer_errors_total` [Counter]
- `order_processing_duration_seconds` [Histogram] (end-to-end)
- `payment_success_total` / `payment_failure_total` [Counter]
- `http_requests_total` [Counter] (route, status_code)

## 8. Deployment (CI/CD & EC2)

- Server: AWS EC2 `t3.medium`, Ubuntu 24.04 LTS, 30GB gp3. Runner: GitHub Actions self-hosted (`systemd`).
- Pipeline (`.github/workflows/deploy.yml` on push to `main`):
  1. Checkout repo on EC2 runner
  2. Write `.env` from GitHub Secret `ENV_FILE`
  3. `docker compose down --remove-orphans`
  4. `docker compose up --build -d`
  5. `docker compose ps`
  6. Run admin seed (`admin@kafkashop.com` / `admin123`) & product seed

## 9. Key Engineering Rules

1. **Header Security**: Never trust frontend claims of user ID or role; downstream services strictly parse `x-user-id` and `x-user-role` injected by `api-gateway`.
2. **Kafka Partitioning**: Always partition messages by `orderId` to ensure ordered per-order processing.
3. **Idempotence**: Consumers (especially search and status updates) must handle out-of-order or duplicate deliveries safely.
4. **Resilience**: Payment worker retries up to 3 times before routing to `orders.DLQ`; delivery worker ignores failed payments.
