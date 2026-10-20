# 💳 Payment Service

An event-driven payment processing microservice built with **Node.js, TypeScript, Express.js, and Apache Kafka** for a distributed e-commerce platform.

The Payment Service asynchronously consumes order creation events, simulates payment transactions, and publishes payment outcomes to Kafka. It implements automatic retries with exponential backoff, dead-letter queue handling for exhausted payment attempts, and Prometheus monitoring for payment activity and Kafka operations.

The service operates primarily as a **Kafka background worker**, while exposing HTTP endpoints for health checks and monitoring.

## 🚀 Key Features

- **Event-Driven Payment Processing** — Automatically initiates payment processing when new orders are published to Kafka.
- **Payment Simulation** — Simulates payment transactions with an 80% success probability per attempt.
- **Simulated Processing Latency** — Adds a randomized delay of approximately 1–3 seconds to each payment attempt.
- **Automatic Retry Mechanism** — Retries unsuccessful payments up to 3 total attempts.
- **Exponential Backoff** — Introduces increasing delays between retries to reduce immediate repeated processing.
- **Dead-Letter Queue (DLQ)** — Routes orders to a dead-letter queue when all payment attempts fail.
- **Payment Status Broadcasting** — Publishes successful and failed payment outcomes to Kafka.
- **Kafka Consumer Groups** — Processes order events through a dedicated `payment-service` consumer group.
- **Prometheus Monitoring** — Exposes payment success and failure counters alongside Kafka and HTTP metrics.
- **Environment Validation** — Uses Zod to validate runtime configuration.
- **Graceful Shutdown** — Disconnects Kafka resources and closes the HTTP server during termination.
- **Docker Support** — Supports containerized execution using Node.js 20 Alpine.

## 🛠 Tech Stack

| Technology        | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| Node.js 20        | JavaScript runtime                                        |
| TypeScript        | Type-safe backend development                             |
| Express.js 5      | HTTP server                                               |
| Apache Kafka      | Event-driven communication                                |
| KafkaJS           | Kafka consumer and producer                               |
| Prometheus        | Application and business monitoring                       |
| Zod               | Environment configuration validation                      |
| dotenv            | Environment variable loading                              |
| Docker            | Containerization                                          |
| @ecommerce/shared | Shared Kafka clients, event types, metrics, and utilities |

## 🏗 Architecture

The Payment Service communicates with other microservices asynchronously through Apache Kafka.

It consumes order creation events from the Order Service, processes simulated payments, and publishes results for downstream consumers such as the Order Service, Delivery Service, and Analytics Service.

```text
                    ┌──────────────────────┐
                    │     Order Service    │
                    └──────────┬───────────┘
                               │
                               ▼
                        Kafka: orders
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Payment Service   │
                    │      Port 3002       │
                    │                      │
                    │ • Order Consumer     │
                    │ • Payment Simulator  │
                    │ • Retry Mechanism    │
                    │ • DLQ Handling       │
                    │ • Payment Producer   │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             Kafka: payments         Kafka: order.dlq
                    │                     │
          ┌─────────┼─────────┐           │
          │         │         │           │
          ▼         ▼         ▼           ▼
        Order    Delivery  Analytics    Order
       Service   Service   Service     Service
```

### Payment Processing Flow

When a new order event is received, the Payment Service starts a simulated payment workflow.

```text
            Order Created Event
                     │
                     ▼
               Kafka: orders
                     │
                     ▼
              Payment Consumer
                     │
                     ▼
               Parse Order Event
                     │
                     ▼
             Simulate Payment
                 (1–3 sec)
                     │
              ┌──────┴──────┐
              │             │
           SUCCESS        FAILED
              │             │
              │             ▼
              │        Retry Allowed?
              │             │
              │       ┌─────┴─────┐
              │       │           │
              │      Yes          No
              │       │           │
              │       ▼           ▼
              │   Wait 1s/2s    Publish
              │       │         to DLQ
              │       ▼           │
              │     Retry         ▼
              │                Publish
              │              FAILED Event
              │                   │
              ▼                   ▼
        Publish SUCCESS     Kafka: payments
              │
              ▼
        Kafka: payments
```

The consumer processes each message through the configured retry sequence before completing its message handler.

## 💳 Payment Simulation

The service uses a simulated payment processor rather than communicating with an external payment provider.

The `simulatePayment` function generates randomized payment outcomes.

### Simulation Behavior

| Property            | Value                |
| ------------------- | -------------------- |
| Success Probability | 80% per attempt      |
| Failure Probability | 20% per attempt      |
| Processing Latency  | 1–3 seconds          |
| Maximum Attempts    | 3                    |
| Payment Identifier  | Random UUID          |
| Failure Reason      | `Insufficient funds` |
| Timestamp           | ISO 8601             |

The implementation introduces a random processing delay:

```typescript
await sleep(Math.floor(1000 + Math.random() * 2000));
```

Each payment succeeds with an 80% probability:

```typescript
const isSuccess = Math.random() < 0.8;
```

The simulator generates a payment result containing an order ID, payment ID, status, processing timestamp, and optional failure reason.

### Example Successful Payment

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentId": "b2c3d4e5-2345-4567-89ab-234567890123",
  "status": "SUCCESS",
  "processedAt": "2026-10-20T14:22:00.000Z",
  "failureReason": null
}
```

### Example Failed Payment

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentId": "b2c3d4e5-2345-4567-89ab-234567890123",
  "status": "FAILED",
  "processedAt": "2026-10-20T14:22:00.000Z",
  "failureReason": "Insufficient funds"
}
```

Each simulation attempt generates a new payment ID.

These events are examples of the `PaymentProcessed` type provided by `@ecommerce/shared`.

## 🔄 Retry Mechanism

The Payment Service implements automatic retries when simulated payment attempts fail.

A maximum of **3 attempts** is allowed for each order event.

### Retry Configuration

| Attempt | Processing              | Delay Before Next Attempt |
| ------- | ----------------------- | ------------------------- |
| 1       | Initial payment attempt | 1 second                  |
| 2       | First retry             | 2 seconds                 |
| 3       | Final retry             | No further retry          |

The source code defines:

```typescript
const maxRetries = 3;
const backoffTimes = [1000, 2000, 4000];
```

Only the first two delays are used because the service does not retry after the third attempt.

### Retry Behavior

After each failed attempt, the service logs the failure reason and checks whether another attempt is available.

If another attempt is permitted, it waits for the configured backoff delay before running the payment simulation again.

When an attempt succeeds, the successful payment result is immediately published to Kafka, and the retry loop ends.

If all three attempts fail, the service publishes the original order to the dead-letter queue and then publishes the final failed payment result.

### Retry Probability

Given the configured independent 80% success probability per attempt, the theoretical probability of obtaining at least one successful payment across three attempts is:

\[
1-(0.2)^3=0.992
\]

Therefore, the simulated workflow has a theoretical **99.2% chance of eventually succeeding** within three attempts.

This probability applies only to the randomized simulator, not to real payment systems or Kafka delivery guarantees.

## 📨 Kafka Integration

The Payment Service communicates with the rest of the platform through Apache Kafka.

### Consumed Topics

| Topic    | Consumer Group    | Purpose                       |
| -------- | ----------------- | ----------------------------- |
| `orders` | `payment-service` | Receives newly created orders |

The consumer subscribes to `TOPICS.ORDERS` with:

```typescript
await orderConsumer.subscribe({
  topic: TOPICS.ORDERS,
  fromBeginning: true,
});
```

The service uses `payment-service` as both its Kafka client ID and consumer group identifier.

### Example Order Event

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-uuid",
  "items": [
    {
      "productId": "660e8400-e29b-41d4-a716-446655440000",
      "quantity": 2,
      "price": 49.99
    }
  ],
  "totalAmount": 99.98,
  "createdAt": "2026-10-20T14:21:00.000Z"
}
```

The consumer parses the incoming JSON message as the shared `OrderCreated` type.

Malformed JSON messages are logged, counted as consumer errors, and skipped.

### Produced Topics

| Topic       | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `payments`  | Publishes successful or failed payment results                   |
| `order.dlq` | Stores orders whose simulated payments failed after all attempts |

The dead-letter topic is reached through the shared `publishToDLQ` helper, which encapsulates its publishing behavior.

### Payment Result Publishing

The service publishes results to `TOPICS.PAYMENTS`.

```typescript
await paymentProducer.send({
  topic: TOPICS.PAYMENTS,
  acks: -1,
  messages: [
    {
      key: event.orderId,
      value: JSON.stringify(event),
    },
  ],
});
```

The order ID is used as the Kafka message key.

The producer requests acknowledgments from all in-sync replicas using `acks: -1`.

After successful publication, the service updates the corresponding message production and payment outcome counters.

## 🚨 Dead-Letter Queue

When all simulated payment attempts fail, the original order is forwarded to the dead-letter queue.

The service uses a shared DLQ helper rather than implementing the Kafka DLQ payload directly.

```typescript
export async function publishPaymentToDLQ(
  order: OrderCreated,
  error: unknown,
  retryCount: number = 3,
): Promise<void> {
  await publishToDLQ(paymentProducer, order, error, retryCount);
}
```

The wrapper forwards the original order, failure reason, and retry count to `publishToDLQ` from `@ecommerce/shared`.

After successfully publishing the DLQ event, the consumer publishes the final `FAILED` payment event to the `payments` topic.

This allows downstream services to respond to payment exhaustion and final payment failure.

The exact DLQ message structure is determined by the shared helper.

## 📡 HTTP Endpoints

The Payment Service primarily operates as a Kafka background worker.

Its Express server exposes operational endpoints rather than a synchronous payment API.

| Method | Endpoint   | Description        | Authentication |
| ------ | ---------- | ------------------ | -------------- |
| `GET`  | `/health`  | Basic health check | No             |
| `GET`  | `/metrics` | Prometheus metrics | No             |

### GET `/health`

Returns the current HTTP service status.

```bash
curl http://localhost:3002/health
```

Response:

```json
{
  "status": "ok",
  "service": "payment-service"
}
```

HTTP Status: `200 OK`

The endpoint verifies that the HTTP server responds but does not independently test Kafka broker connectivity or processing health.

### GET `/metrics`

Exposes Prometheus-compatible monitoring metrics.

```bash
curl http://localhost:3002/metrics
```

The endpoint uses the shared `metricsHandler` from `@ecommerce/shared`.

## 📊 Monitoring & Observability

The Payment Service integrates Prometheus metrics to monitor payment outcomes, Kafka messaging, and HTTP activity.

### Payment Metrics

| Metric Export         | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `paymentSuccessTotal` | Counts successfully published payment success events |
| `paymentFailureTotal` | Counts successfully published payment failure events |

These metrics are incremented after the corresponding `PaymentProcessed` event is published.

Failed simulation attempts that are later retried successfully do not independently increment `paymentFailureTotal`.

### Kafka Metrics

| Metric Export           | Description                                   |
| ----------------------- | --------------------------------------------- |
| `kafkaMessagesConsumed` | Counts consumed Kafka messages                |
| `kafkaMessagesProduced` | Counts published payment events               |
| `kafkaConsumerErrors`   | Counts malformed order message parsing errors |

The shared monitoring utilities provide consistent Kafka metrics across services.

### HTTP Metrics

The application registers `httpMetricsMiddleware` to track incoming HTTP requests.

Metrics are exposed at:

```text
GET http://localhost:3002/metrics
```

Monitoring systems such as Prometheus and Grafana can use these metrics for operational dashboards.

### Application Logging

The service logs important payment processing events.

Example:

```text
[Payment] Kafka producer connected
[Payment] Order consumer started and subscribed to 'orders'
[Payment] Processing payment for order: order-123
[Payment] Order order-123 payment FAILED on attempt 1: Insufficient funds
[Payment] Retrying in 1000ms...
[Payment] Payment successful for order: order-123, paymentId: payment-uuid
```

When payment attempts are exhausted:

```text
[Payment] Order order-123 failed after 3 retries. Routing to DLQ.
```

## ⚙️ Environment Variables

The Payment Service uses Zod to validate its configuration.

| Variable        | Default          | Description                            |
| --------------- | ---------------- | -------------------------------------- |
| `NODE_ENV`      | `development`    | Application environment                |
| `PORT`          | `3002`           | Express HTTP server port               |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka broker addresses |

### Example `.env`

```dotenv
NODE_ENV=development
PORT=3002

KAFKA_BROKERS=localhost:9092
```

Multiple Kafka brokers can be configured:

```dotenv
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
```

The service splits the value by commas and trims whitespace around each broker address.

The payment success probability, simulated processing delay, retry count, and backoff intervals are currently defined in source code rather than environment variables.

## 💻 Getting Started

### Prerequisites

Before starting the service, ensure Node.js 20 or later, npm, Apache Kafka, and the `@ecommerce/shared` workspace package are available.

Docker is optional for containerized execution.

### Local Development

Install dependencies from the monorepo root:

```bash
npm install
```

Configure the required environment variables and ensure the Kafka broker is running.

Start the Payment Service:

```bash
npm run dev --workspace=payment-service
```

Alternatively, from the service directory:

```bash
cd services/payment-service
npm run dev
```

The development script uses `tsx watch` to restart the application automatically when source files change.

The service initializes its Kafka producer and order consumer before starting the HTTP server.

Once initialized, the health and metrics endpoints are available at:

```text
http://localhost:3002
```

### Production Build

Compile the TypeScript source:

```bash
npm run build --workspace=payment-service
```

Start the compiled application:

```bash
npm run start --workspace=payment-service
```

The production script runs:

```bash
node dist/index.js
```

Ensure the shared workspace package is built and the resulting module imports are compatible with the runtime environment.

### Docker

The repository includes a Dockerfile based on Node.js 20 Alpine.

Build the image from the **monorepo root**:

```bash
docker build \
  -f services/payment-service/Dockerfile \
  -t payment-service .
```

Run the container:

```bash
docker run -p 3002:3002 \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  payment-service
```

Kafka must be accessible from within the container.

The Dockerfile currently starts the service through `npm run dev`, making it development-oriented. Production deployment should use compiled artifacts and the production startup script.

## 📂 Project Structure

```text
payment-service/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── consumers/
│   │   └── order.consumer.ts
│   │
│   ├── producers/
│   │   ├── dlq.producer.ts
│   │   └── payment.producer.ts
│   │
│   ├── services/
│   │   └── payment.simulator.ts
│   │
│   └── index.ts
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

| File                                | Responsibility                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `src/index.ts`                      | Application initialization, Kafka connections, HTTP server, and graceful shutdown |
| `src/config/env.ts`                 | Environment variable validation                                                   |
| `src/consumers/order.consumer.ts`   | Consumes order events and controls payment retry processing                       |
| `src/producers/payment.producer.ts` | Publishes payment results to Kafka                                                |
| `src/producers/dlq.producer.ts`     | Forwards failed orders to the shared DLQ publisher                                |
| `src/services/payment.simulator.ts` | Simulates payment latency and randomized outcomes                                 |
| `Dockerfile`                        | Container image configuration                                                     |
| `package.json`                      | Dependencies and npm scripts                                                      |
| `tsconfig.json`                     | TypeScript compilation settings                                                   |

## 🔁 Asynchronous Processing

The Payment Service processes incoming Kafka order events using the consumer's `eachMessage` handler.

For each valid JSON message, the handler performs payment simulation, manages retries, and awaits publication of the final result before returning.

This ensures the payment processing workflow is executed within the Kafka message handler rather than launched as an independent fire-and-forget task.

The consumer does not directly update database records. Order state is updated by the Order Service after consuming the resulting Kafka events.

## 🛑 Graceful Shutdown

The service supports `SIGINT` and `SIGTERM` signals.

When shutdown begins, it stops the Express HTTP server, disconnects the Kafka order consumer, and disconnects the Kafka payment producer.

A shutdown flag prevents duplicate shutdown execution.

On successful shutdown, the process exits with code `0`.

If cleanup fails, the error is logged and the process exits with code `1`.

The current implementation does not define a separate shutdown timeout.

## 🔒 Production Considerations

**Payment Simulation:** The service uses randomized outcomes and does not connect to a real payment gateway. It should not be used to process real financial transactions.

**Idempotency:** Kafka message replays may cause the same order to be simulated and processed again. A production implementation should track processed order IDs or payment attempts.

**Retry Strategy:** The current retry mechanism is intended for simulation. Real payment systems require careful handling of retriable failures to avoid duplicate charges.

**DLQ Recovery:** Failed orders are forwarded to a dead-letter queue, but inspection, replay, and recovery procedures must be implemented separately.

**Message Validation:** The consumer parses order events as JSON and casts them to a TypeScript type without runtime schema validation. A production implementation should validate event payloads before processing.

**Error Handling:** Unexpected errors during payment simulation or Kafka publishing are not handled by a dedicated outer retry mechanism in the message handler.

**Observability:** Payment metrics track successfully published final outcomes rather than every simulation attempt. Additional metrics would be useful for retry counts and processing latency.

**Horizontal Scaling:** Kafka consumer groups allow workload distribution, but idempotent processing should be implemented before relying on multiple service instances for strong processing guarantees.

**Metrics Security:** The `/metrics` endpoint is exposed without application-level authentication and should be restricted to trusted monitoring infrastructure in production.

## 📦 Shared Dependencies

The Payment Service relies on the internal `@ecommerce/shared` package for common functionality across the e-commerce platform.

Shared functionality includes Kafka consumer and producer factories, Kafka topic constants, event interfaces, dead-letter queue publishing, Prometheus metric counters, HTTP metrics middleware, and utility functions such as `sleep`.

Using shared infrastructure promotes consistent communication contracts and observability across microservices.

## 📝 Notes

The Payment Service is responsible for simulated payment processing and publishing payment outcomes rather than directly managing orders or deliveries.

Successful payment events can trigger delivery processing, while exhausted payment attempts are routed to the dead-letter queue and reported as failed payments.

The architecture demonstrates asynchronous payment workflows, retry strategies, exponential backoff, Kafka event publishing, and distributed microservice communication.

---

**Payment Service** — Event-driven payment simulation with automatic retries, Kafka messaging, dead-letter queue handling, and Prometheus monitoring.
