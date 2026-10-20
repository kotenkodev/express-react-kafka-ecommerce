# 🚚 Delivery Service

An event-driven delivery processing microservice built with **Node.js, TypeScript, Express.js, and Apache Kafka** for a distributed e-commerce platform.

The Delivery Service automatically processes successful payments, assigns couriers to orders, and simulates the delivery lifecycle through asynchronous Kafka events. It advances orders through the `PREPARING`, `SHIPPED`, and `DELIVERED` stages, publishing status updates that can be consumed by other microservices.

The service operates primarily as a **Kafka background worker**, while exposing HTTP endpoints for health checks and Prometheus monitoring.

## 🚀 Key Features

- **Event-Driven Delivery Processing** — Automatically initiates delivery workflows upon receiving successful payment events from Kafka.
- **Payment Status Filtering** — Processes only payments with a `SUCCESS` status and skips failed payments.
- **Automatic Courier Assignment** — Randomly assigns an available courier name from a predefined list.
- **Delivery Lifecycle Simulation** — Progresses orders through `PREPARING`, `SHIPPED`, and `DELIVERED` states.
- **Scheduled Status Transitions** — Simulates delivery progression with a 5-second delay between stages.
- **Kafka Event Publishing** — Broadcasts order status changes through the `order.status.updated` topic.
- **Asynchronous Processing** — Launches delivery workflows without waiting for them to finish inside the Kafka message handler.
- **Prometheus Monitoring** — Exposes HTTP and Kafka messaging metrics.
- **Graceful Shutdown** — Disconnects Kafka producers and consumers and closes the HTTP server during termination.
- **Environment Validation** — Uses Zod for type-safe configuration.
- **Docker Support** — Supports containerized execution with Node.js 20 Alpine.

## 🛠 Tech Stack

| Technology        | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| Node.js 20        | JavaScript runtime                                        |
| TypeScript        | Type-safe application development                         |
| Express.js 5      | HTTP server                                               |
| Apache Kafka      | Asynchronous event communication                          |
| KafkaJS           | Kafka consumer and producer                               |
| Prometheus        | Service and Kafka metrics                                 |
| Zod               | Environment configuration validation                      |
| dotenv            | Environment variable loading                              |
| Docker            | Containerization                                          |
| @ecommerce/shared | Shared Kafka clients, event types, metrics, and utilities |

## 🏗 Architecture

The Delivery Service participates in the e-commerce platform's event-driven architecture by reacting to successful payment events and publishing order status updates.

```text
                   ┌────────────────────┐
                   │    Order Service   │
                   └─────────┬──────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │   Payment Service  │
                   └─────────┬──────────┘
                             │
                             ▼
                     Kafka: payments
                             │
                             ▼
                   ┌────────────────────┐
                   │   Delivery Service │
                   │     Port 3003      │
                   │                    │
                   │ • Payment Consumer │
                   │ • Courier Selection│
                   │ • Delivery Workflow│
                   │ • Status Producer  │
                   └─────────┬──────────┘
                             │
                             ▼
                Kafka: order.status.updated
                             │
                             ▼
                   ┌────────────────────┐
                   │    Order Service   │
                   │ / Other Consumers  │
                   └────────────────────┘
```

The service does not directly modify order records in a database. Instead, it publishes events representing each delivery stage, allowing the appropriate downstream consumers to update their own state.

## 🔄 Delivery Lifecycle

After receiving a successful payment event, the service starts a simulated delivery workflow.

```text
        Payment Event Received
                  │
                  ▼
          Check Payment Status
                  │
           ┌──────┴──────┐
           │             │
         FAILED        SUCCESS
           │             │
           ▼             ▼
      Skip Delivery  Assign Courier
                         │
                         ▼
                    PREPARING
                         │
                    Wait 5 sec
                         │
                         ▼
                     SHIPPED
                         │
                    Wait 5 sec
                         │
                         ▼
                    DELIVERED
                         │
                         ▼
                 Delivery Complete
```

### Delivery Stages

| Stage       | Description                                | Delay Before Next Stage |
| ----------- | ------------------------------------------ | ----------------------- |
| `PREPARING` | The order enters the preparation stage     | 5 seconds               |
| `SHIPPED`   | The order transitions into shipment        | 5 seconds               |
| `DELIVERED` | The order completes the delivery lifecycle | None                    |

The service publishes an event immediately upon entering each stage.

Under normal conditions, the simulated workflow takes approximately 10 seconds, excluding Kafka publishing latency and scheduling overhead.

These delays represent a simulation rather than real courier travel or logistics operations.

## 📨 Kafka Integration

The Delivery Service communicates with other microservices using Apache Kafka.

### Consumed Topics

| Topic      | Consumer Group     | Purpose                                                 |
| ---------- | ------------------ | ------------------------------------------------------- |
| `payments` | `delivery-service` | Receives payment outcomes and starts delivery workflows |

The consumer subscribes to `TOPICS.PAYMENTS` with `fromBeginning: true`.

Its Kafka client ID and consumer group are both configured as `delivery-service`.

### Payment Processing

Upon receiving a payment event, the consumer parses its JSON payload as the shared `PaymentProcessed` type.

Example successful payment event:

```json
{
  "orderId": "order-123",
  "status": "SUCCESS"
}
```

When the status is `SUCCESS`, the consumer starts processing the associated delivery.

For other statuses, including `FAILED`, the event is skipped.

The consumer increments the shared Kafka consumption counter and records parsing errors using the Kafka consumer error metric.

**Important:** Delivery processing is launched asynchronously without awaiting completion inside the Kafka message handler. This allows the consumer to continue handling messages, but it also means a delivery workflow is not guaranteed to finish before its originating message is considered processed.

### Produced Topics

| Topic                  | Event Type           | Purpose                                    |
| ---------------------- | -------------------- | ------------------------------------------ |
| `order.status.updated` | `OrderStatusUpdated` | Publishes changes in order delivery status |

For each delivery stage, the service publishes a Kafka message containing the order identifier, current status, assigned courier, and update timestamp.

Example event:

```json
{
  "orderId": "order-123",
  "status": "SHIPPED",
  "courier": "Марія",
  "updatedAt": "2026-10-20T14:22:00.000Z"
}
```

Messages use the `orderId` as their Kafka message key.

The producer requests acknowledgments from all in-sync replicas using `acks: -1`.

After successful publishing, the service increments the Kafka message production counter.

## 🛵 Courier Assignment

Each successful payment triggers automatic courier assignment.

The current implementation uses a predefined list of courier names:

```typescript
export const COURIERS = [
  "Іван",
  "Марія",
  "Олег",
  "Аня",
  "Тарас",
  "Оля",
] as const;
```

A courier is selected using `Math.random()`:

```typescript
export const getRandomCourier = () => {
  const randomIndex = Math.floor(Math.random() * COURIERS.length);
  return COURIERS[randomIndex];
};
```

The selected courier remains associated with the order throughout its simulated delivery lifecycle.

Courier assignment is intentionally simplified. The current implementation does not track actual courier availability, location, workload, or capacity.

## 📡 HTTP Endpoints

Although delivery processing is handled asynchronously through Kafka, the service provides an Express HTTP server for operational monitoring.

| Method | Endpoint   | Description                 | Authentication |
| ------ | ---------- | --------------------------- | -------------- |
| `GET`  | `/health`  | Basic service health check  | No             |
| `GET`  | `/metrics` | Prometheus metrics endpoint | No             |

### GET `/health`

Returns a basic indication that the HTTP service is running.

```bash
curl http://localhost:3003/health
```

Response:

```json
{
  "status": "ok",
  "service": "delivery-service"
}
```

HTTP Status: `200 OK`

This endpoint does not independently check Kafka broker connectivity or active delivery workflows.

### GET `/metrics`

Exposes Prometheus-compatible metrics through the shared monitoring package.

```bash
curl http://localhost:3003/metrics
```

The endpoint supports monitoring of HTTP request activity, Kafka message consumption, Kafka message production, and consumer errors.

## 📊 Observability

The Delivery Service integrates monitoring through `@ecommerce/shared`.

### Kafka Metrics

| Metric Export           | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `kafkaMessagesConsumed` | Counts consumed Kafka messages                                           |
| `kafkaMessagesProduced` | Counts successfully published Kafka messages                             |
| `kafkaConsumerErrors`   | Counts payment message parsing or handling errors caught by the consumer |

Kafka metrics include topic labels, and consumer metrics also include the consumer group identifier.

### HTTP Monitoring

The Express application uses the shared `httpMetricsMiddleware` to instrument HTTP requests.

Metrics are exposed at:

```text
http://localhost:3003/metrics
```

The service can be integrated with Prometheus and Grafana for operational dashboards and monitoring.

### Application Logging

The service logs important delivery lifecycle events.

Example:

```text
[Delivery] Payment consumer connected to Kafka
[Delivery] Received successful payment for order: order-123. Starting delivery...
[Delivery] Assigned courier "Іван" to order: order-123
[Delivery] Order order-123 -> PREPARING (Courier: Іван)
[Delivery] Order order-123 -> SHIPPED (Courier: Іван)
[Delivery] Order order-123 -> DELIVERED (Courier: Іван)
[Delivery] Order order-123 successfully completed delivery flow.
```

Failures during delivery processing are logged through the asynchronous processing error handler.

## ⚙️ Environment Variables

The service uses Zod to validate environment configuration.

| Variable        | Default          | Description                                                   |
| --------------- | ---------------- | ------------------------------------------------------------- |
| `NODE_ENV`      | `development`    | Application environment (`development`, `production`, `test`) |
| `PORT`          | `3003`           | Express HTTP server port                                      |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka broker addresses                        |

### Example `.env`

```dotenv
NODE_ENV=development
PORT=3003

KAFKA_BROKERS=localhost:9092
```

For multiple Kafka brokers:

```dotenv
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
```

The service splits broker addresses by commas and trims surrounding whitespace.

**Note:** The 5-second delivery stage delay and courier list are currently defined in source code rather than environment variables.

## 💻 Getting Started

### Prerequisites

Before running the service, ensure Node.js 20 or later and npm are installed. The application also requires an accessible Apache Kafka broker and the monorepo's `@ecommerce/shared` package.

### Local Development

Install workspace dependencies from the monorepo root:

```bash
npm install
```

Configure the environment variables and ensure Kafka is running.

Start the service:

```bash
npm run dev --workspace=delivery-service
```

Alternatively, navigate to the service directory:

```bash
cd services/delivery-service
npm run dev
```

The development server uses `tsx watch` to restart when source files change.

Once the Kafka producer and consumer are successfully connected, the Express application starts listening on:

```text
http://localhost:3003
```

### Production Build

Compile the TypeScript source:

```bash
npm run build --workspace=delivery-service
```

Start the compiled application:

```bash
npm run start --workspace=delivery-service
```

The production script executes:

```bash
node dist/index.js
```

The shared package must also be built, and its compiled modules must be compatible with the configured Node.js module system.

### Docker

The repository includes a Dockerfile based on Node.js 20 Alpine.

Build the image from the **monorepo root**, since the Dockerfile references the shared workspace and service directories:

```bash
docker build \
  -f services/delivery-service/Dockerfile \
  -t delivery-service .
```

Run the container:

```bash
docker run -p 3003:3003 \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  delivery-service
```

The Kafka broker must be reachable from inside the container.

The provided Dockerfile currently launches `npm run dev`, making it development-oriented. For production deployment, use a compiled build and the appropriate production startup command.

## 📂 Project Structure

```text
delivery-service/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── consumers/
│   │   └── payment.consumer.ts
│   │
│   ├── contants/
│   │   └── couriers.ts
│   │
│   ├── producers/
│   │   └── status.producer.ts
│   │
│   ├── services/
│   │   └── delivery.service.ts
│   │
│   └── index.ts
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

| File                                | Responsibility                                                           |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `src/index.ts`                      | Application initialization, Kafka connections, HTTP server, and shutdown |
| `src/config/env.ts`                 | Environment configuration and validation                                 |
| `src/consumers/payment.consumer.ts` | Consumes payment events and starts deliveries                            |
| `src/contants/couriers.ts`          | Stores courier names and provides random courier selection               |
| `src/producers/status.producer.ts`  | Publishes order status updates to Kafka                                  |
| `src/services/delivery.service.ts`  | Executes the simulated delivery lifecycle                                |
| `Dockerfile`                        | Container image configuration                                            |
| `package.json`                      | Dependencies and npm scripts                                             |
| `tsconfig.json`                     | TypeScript compiler configuration                                        |

## 🔁 Asynchronous Processing

The service starts each delivery workflow independently of the Kafka consumer's message processing loop.

The consumer invokes:

```typescript
void processDelivery(payment.orderId).catch((err) => {
  console.error(
    `[Delivery] Error processing delivery for order: ${payment.orderId}`,
    err,
  );
});
```

This allows multiple simulated delivery workflows to execute concurrently without waiting for previous deliveries to finish.

However, the current implementation does not persist workflow progress or manage background tasks through a durable job queue.

An interrupted workflow may therefore stop before all status updates have been published.

Additionally, because Kafka consumption begins at the earliest available offset for a new consumer group and the implementation has no explicit duplicate-delivery guard, replayed successful payment events can start the delivery workflow again.

## 🛑 Graceful Shutdown

The Delivery Service handles `SIGINT` and `SIGTERM` signals.

When a shutdown signal is received, the service stops its HTTP server, disconnects the Kafka payment consumer, and disconnects the Kafka status producer.

A shutdown flag prevents the process from executing the shutdown logic multiple times.

If shutdown succeeds, the process exits with status code `0`. If disconnection or shutdown fails, it logs the error and exits with status code `1`.

**Limitation:** The current shutdown implementation does not explicitly wait for all previously started delivery workflows to complete.

## 📦 Shared Dependencies

The service relies on the internal `@ecommerce/shared` package for common functionality across the e-commerce platform.

Shared functionality includes Kafka consumer and producer factories, Kafka topic constants, event type definitions, Kafka metrics counters, Express metrics middleware, and utility functions such as `sleep`.

This approach promotes consistent event contracts, Kafka connectivity, and observability across microservices.

## 🔒 Production Considerations

The current Delivery Service is designed primarily as a simulated delivery worker.

**Idempotency:** Replayed or duplicated payment events may create duplicate delivery workflows. A production implementation should track processed events or order delivery state.

**Workflow Durability:** Active workflows exist in application memory and are not persisted. Durable task processing would improve recovery after restarts.

**Delivery Timing:** Status transitions are based on fixed 5-second delays, not actual courier or shipment events.

**Courier Management:** Couriers are randomly selected from a static list rather than assigned according to availability or location.

**Error Recovery:** Failed Kafka publications are logged by the delivery processing handler, but the workflow does not currently implement an explicit retry or dead-letter queue strategy.

**Graceful Shutdown:** Active delivery tasks should be drained or persisted before Kafka connections are closed.

**Metrics Security:** The `/metrics` endpoint has no application-level access control and should be restricted to trusted monitoring infrastructure in production.

**Horizontal Scaling:** Kafka consumer groups support distribution of incoming messages, but workflow durability and duplicate-event protection should be addressed before relying on horizontal scaling for delivery guarantees.

## 📝 Notes

The Delivery Service does not currently integrate with external shipping providers or real courier management systems.

It simulates the fulfillment lifecycle by publishing three order status events for each successfully processed payment.

Other microservices, particularly the Order Service, can subscribe to these events to maintain order state and provide real-time updates to clients.

The service's event-driven design separates payment processing from delivery simulation and enables asynchronous communication without requiring direct HTTP calls between services.

---

**Delivery Service** — Automated, event-driven order fulfillment simulation powered by Kafka, TypeScript, and Express.js.
