# 📊 Analytics Service

A real-time, event-driven analytics microservice built with **Node.js, TypeScript, Express, and Apache Kafka** for an e-commerce platform.

The Analytics Service consumes order and payment events, aggregates business statistics using a configurable sliding time window, and provides real-time insights through a REST API, Kafka events, and Prometheus metrics.

## 🚀 Features

- **Real-Time Analytics** — Calculates order counts, total revenue, payment success rates, and average processing latency.
- **Sliding Window Aggregation** — Maintains statistics for the most recent 60 seconds using a self-cleaning sliding window.
- **Event-Driven Architecture** — Processes order and payment events asynchronously through Apache Kafka.
- **Automated Broadcasting** — Publishes aggregated analytics to Kafka every 5 seconds.
- **REST API** — Exposes current business statistics through an HTTP endpoint.
- **Prometheus Monitoring** — Tracks HTTP activity, Kafka operations, and business metrics.
- **Role-Based Access Control** — Restricts access to sensitive analytics data to users with the `admin` role.
- **Environment Validation** — Validates configuration using Zod.
- **Docker Support** — Supports containerized deployment using a lightweight Alpine-based image.

## 🛠 Tech Stack

| Technology   | Purpose                              |
| ------------ | ------------------------------------ |
| Node.js 20   | JavaScript runtime                   |
| TypeScript   | Type-safe development                |
| Express.js 5 | HTTP server and REST API             |
| Apache Kafka | Event streaming and messaging        |
| KafkaJS      | Kafka consumer and producer          |
| Prometheus   | Application and business monitoring  |
| prom-client  | Prometheus metrics instrumentation   |
| Zod          | Environment configuration validation |
| Docker       | Containerization                     |

## 🏗 Architecture

The service follows an **event-driven architecture**, consuming events from Kafka, processing them in memory, and exposing the resulting statistics to other services and monitoring systems.

```text
     ┌──────────────────┐
     │   Order Service  │
     └────────┬─────────┘
              │
              ▼
         Kafka: orders
              │
              │
              ▼
     ┌──────────────────┐
     │                  │
     │ Analytics Service│◄──── Kafka: payments
     │                  │             ▲
     └────────┬─────────┘             │
              │                 Payment Service
              ▼
     ┌──────────────────┐
     │  Sliding Window  │
     │   Aggregation    │
     │    (60 seconds)  │
     └────────┬─────────┘
              │
       ┌──────┼─────────────┐
       │      │             │
       ▼      ▼             ▼
    REST API  Kafka      Prometheus
   /analytics order.stats  /metrics
```

### How It Works

1. The **Order Service** publishes new order events to the `orders` Kafka topic.
2. The Analytics Service consumes these events and tracks order creation timestamps and amounts.
3. The **Payment Service** publishes payment results to the `payments` topic.
4. The Analytics Service processes payment outcomes and calculates processing latency.
5. The `SlidingWindowService` maintains statistics for events within the configured time window.
6. Every 5 seconds, the service publishes updated statistics to the `order.stats` Kafka topic.
7. Aggregated data is also accessible through the REST API and Prometheus endpoint.

## 📈 Business Metrics

The service calculates the following metrics over a rolling 60-second window.

| Metric            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `ordersCount`     | Number of orders recorded within the sliding window      |
| `totalRevenue`    | Aggregated revenue reported for the window               |
| `successRate`     | Proportion of successful payment outcomes                |
| `avgProcessingMs` | Average order-to-payment processing time in milliseconds |
| `windowStart`     | Beginning of the current aggregation window              |

The sliding window automatically removes expired events, ensuring that statistics represent recent activity rather than historical totals.

## 📡 API Reference

### GET `/analytics`

Returns the current aggregated business statistics.

**Authorization:** Requires the `admin` role.

Example request:

```bash
curl http://localhost:3004/analytics \
  -H "Authorization: Bearer <token>"
```

Example response:

```json
{
  "windowStart": "2026-10-20T14:22:00.000Z",
  "ordersCount": 42,
  "totalRevenue": 1540.5,
  "successRate": 0.95,
  "avgProcessingMs": 350
}
```

### GET `/health`

Provides a basic health check for the service.

**Authorization:** Not required.

```bash
curl http://localhost:3004/health
```

Response:

```json
{
  "status": "ok",
  "service": "analytics-service"
}
```

### GET `/metrics`

Exposes application and business metrics in Prometheus-compatible format.

**Authorization:** Not required.

```bash
curl http://localhost:3004/metrics
```

The endpoint supports monitoring of HTTP request activity, Kafka consumption and production, and business-level statistics.

## 📨 Kafka Integration

The Analytics Service communicates asynchronously with other microservices through Apache Kafka.

### Consumed Topics

| Topic      | Source          | Purpose                                           |
| ---------- | --------------- | ------------------------------------------------- |
| `orders`   | Order Service   | Tracks newly created orders and order amounts     |
| `payments` | Payment Service | Tracks payment resolutions and processing latency |

**Order events**

When a new order event is received, the service records the order information and creation timestamp in its sliding window.

**Payment events**

When a payment event is received, the service processes the payment status (`SUCCESS` or `FAILED`) and calculates processing time using the associated order creation timestamp.

### Produced Topics

| Topic         | Interval        | Purpose                                   |
| ------------- | --------------- | ----------------------------------------- |
| `order.stats` | Every 5 seconds | Broadcasts aggregated business statistics |

Example published payload:

```json
{
  "windowStart": "2026-10-20T14:22:00.000Z",
  "ordersCount": 42,
  "totalRevenue": 1540.5,
  "successRate": 0.95,
  "avgProcessingMs": 350
}
```

This allows other microservices to consume analytics updates without making synchronous HTTP requests.

## ⚙️ Configuration

The service uses environment variables validated with **Zod**.

| Variable        | Default          | Description                                                   |
| --------------- | ---------------- | ------------------------------------------------------------- |
| `PORT`          | `3004`           | HTTP server port                                              |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka broker addresses                        |
| `NODE_ENV`      | `development`    | Application environment (`development`, `production`, `test`) |

Example `.env` configuration:

```dotenv
PORT=3004
KAFKA_BROKERS=localhost:9092
NODE_ENV=development
```

## 💻 Getting Started

### Prerequisites

Ensure the following dependencies are available:

- Node.js 20 or later
- npm
- Apache Kafka
- Docker (optional)

### Local Development

The service uses the shared `@ecommerce/shared` workspace package and should be installed within the root monorepo workspace.

Install dependencies from the repository root:

```bash
npm install
```

Navigate to the Analytics Service directory if necessary, then start the development server:

```bash
npm run dev
```

The API is available at:

```text
http://localhost:3004
```

### Production

Compile the TypeScript source:

```bash
npm run build
```

Start the compiled application:

```bash
npm run start
```

### Docker

Build the Docker image:

```bash
docker build -t analytics-service .
```

Run the container:

```bash
docker run -p 3004:3004 \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  analytics-service
```

Ensure Kafka is running and accessible from the container. The `host.docker.internal` hostname is intended for environments where Docker supports host connectivity through that name.

## 📊 Observability

The Analytics Service integrates **Prometheus** through the `prom-client` library and shared monitoring utilities.

Metrics are exposed at:

```text
GET http://localhost:3004/metrics
```

Monitoring covers three primary areas:

**HTTP Monitoring**

Tracks incoming HTTP requests and service performance.

**Kafka Monitoring**

Provides visibility into Kafka event consumption and production.

**Business Monitoring**

Exposes analytics-related measurements such as order activity, revenue, payment success rates, and processing latency.

The metrics endpoint can be connected to Prometheus and visualized using tools such as Grafana.

## 🔐 Security

The `/analytics` endpoint is protected by role-based access control (RBAC).

Only authenticated requests associated with the `admin` role are authorized to access the analytics data.

The `/health` and `/metrics` endpoints are publicly accessible at the application level and do not require authentication. In production, consider restricting access to `/metrics` through internal networking or infrastructure-level access controls.

## 📦 Shared Dependencies

The service integrates with the internal **`@ecommerce/shared`** package, which provides reusable functionality across the e-commerce microservice architecture.

Shared functionality includes:

- Kafka configuration and topic constants
- Common TypeScript types and interfaces
- Prometheus middleware and monitoring utilities
- Generic error handling

This approach reduces duplication and promotes consistent communication, monitoring, and error handling across services.

## 📝 Notes

Analytics are calculated using an in-memory sliding window. Consequently, the service focuses on recent operational data rather than long-term historical reporting.

Statistics are periodically broadcast to Kafka, enabling downstream consumers to process aggregated information asynchronously.

The service depends on an available Kafka broker and the internal shared workspace package for successful operation.

---

**Analytics Service** — Real-time business insights powered by Kafka, TypeScript, and Prometheus.
