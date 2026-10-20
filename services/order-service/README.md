# 🛒 Order Service

An event-driven order management microservice built with **Node.js, TypeScript, Express.js, PostgreSQL, Prisma, Redis, and Apache Kafka** for a distributed e-commerce platform.

The Order Service manages the complete order lifecycle, from checkout and inventory validation to payment processing and delivery tracking. It provides a REST API for order management, publishes order creation events to Kafka, processes payment and delivery status updates, and delivers real-time notifications to clients through Server-Sent Events (SSE).

The service uses **Redis-backed idempotency**, transactional database operations, and role-based access control to support reliable order processing across the microservices architecture.

## 🚀 Key Features

- **Order Management** — Creates orders and retrieves individual orders or order history through a REST API.
- **Transactional Inventory Management** — Validates product availability and atomically decrements stock during checkout.
- **Idempotent Order Creation** — Uses Redis to prevent duplicate order creation when clients retry requests with the same idempotency key.
- **Event-Driven Architecture** — Publishes order creation events and consumes payment and delivery updates through Apache Kafka.
- **Payment Status Tracking** — Updates order records when payments succeed or fail.
- **Delivery Lifecycle Management** — Processes `PREPARING`, `SHIPPED`, and `DELIVERED` events.
- **Real-Time SSE Notifications** — Streams order status changes to connected clients without polling.
- **Role-Based Access Control** — Restricts users to their own orders while allowing administrators to access orders across the platform.
- **Event Validation** — Uses Zod to validate incoming delivery status events.
- **Dead-Letter Queue Handling** — Quarantines malformed delivery events and processes order failure notifications.
- **Prometheus Monitoring** — Exposes HTTP and Kafka metrics for observability.
- **Graceful Shutdown** — Closes HTTP connections and disconnects Kafka, Redis, and Prisma resources.
- **Docker Support** — Supports containerized execution using Node.js 20 Alpine.

## 🛠 Tech Stack

| Technology        | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| Node.js 20        | JavaScript runtime                                             |
| TypeScript        | Type-safe backend development                                  |
| Express.js 5      | HTTP server and REST API                                       |
| PostgreSQL        | Persistent order and product storage                           |
| Prisma ORM        | Database transactions and queries                              |
| Apache Kafka      | Event-driven communication                                     |
| KafkaJS           | Kafka producer and consumer                                    |
| Redis             | Idempotency locks and cached responses                         |
| ioredis           | Redis client                                                   |
| better-sse        | Real-time Server-Sent Events                                   |
| Zod               | Request and Kafka event validation                             |
| Prometheus        | Application and Kafka monitoring                               |
| Docker            | Containerization                                               |
| @ecommerce/shared | Shared database client, event types, middleware, and utilities |

## 🏗 Architecture

The Order Service acts as the central component for order creation and order state management within the e-commerce platform.

It communicates synchronously with client applications through the API Gateway and asynchronously with other microservices through Kafka.

```text
                    ┌─────────────────────┐
                    │   Web Application   │
                    │     / API Client    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     API Gateway     │
                    │      Port 8000      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Order Service    │
                    │      Port 3001      │
                    │                     │
                    │ • Order Management  │
                    │ • Inventory Checks  │
                    │ • Idempotency       │
                    │ • Status Processing │
                    │ • SSE Notifications │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌────────────┐ ┌────────────┐ ┌────────────┐
         │ PostgreSQL │ │   Redis    │ │   Kafka    │
         │            │ │            │ │            │
         │ • Orders   │ │ • Locks    │ │ • Orders   │
         │ • Items    │ │ • Cached   │ │ • Payments │
         │ • Products │ │   Results  │ │ • Statuses │
         └────────────┘ └────────────┘ └──────┬─────┘
                                              │
                                  ┌───────────┴───────────┐
                                  │                       │
                                  ▼                       ▼
                          Payment Service         Delivery Service
```

### Order Processing Flow

```text
           Client Checkout Request
                      │
                      ▼
              JWT Authentication
                      │
                      ▼
               Zod Validation
                      │
                      ▼
             Idempotency Check
                      │
                      ▼
           Load Requested Products
                      │
                      ▼
             Validate Inventory
                      │
                      ▼
              Prisma Transaction
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
        Decrement Stock    Create Order
              │                │
              └───────┬────────┘
                      │
                      ▼
            Commit Transaction
                      │
                      ▼
             Publish Kafka Event
                  `orders`
                      │
                      ▼
              Payment Service
                      │
                      ▼
             Kafka: `payments`
                      │
                      ▼
              Update Order State
                      │
                      ▼
              SSE Notification
```

## 📡 REST API

The service exposes its order endpoints under `/orders`.

When accessed through the API Gateway, the public prefix is `/api/orders`.

| Method | Gateway Endpoint  | Description                          | Authentication       |
| ------ | ----------------- | ------------------------------------ | -------------------- |
| `POST` | `/api/orders`     | Create a new order                   | Required             |
| `GET`  | `/api/orders`     | Retrieve accessible orders           | Required             |
| `GET`  | `/api/orders/:id` | Retrieve a specific order            | Required             |
| `GET`  | `/api/events`     | Subscribe to real-time order updates | Required             |
| `GET`  | `/health`         | Health check                         | No                   |
| `GET`  | `/metrics`        | Prometheus metrics                   | No, at service level |

### POST `/api/orders`

Creates a new order from an array of requested products and quantities.

**Authentication:** Required.

Example request:

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: checkout-request-123" \
  -d '[
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 1
    }
  ]'
```

The request body must be a nonempty array of product items.

Each item includes a UUID product identifier and a positive integer quantity.

The service validates the request, retrieves product information, checks stock availability, calculates the total amount, and creates the order within a Prisma transaction.

A successful request returns HTTP `200 OK` with the created order and its items.

Example response (illustrative):

```json
{
  "id": "a1b2c3d4-1234-4567-89ab-123456789012",
  "userId": "user-uuid",
  "status": "PENDING",
  "totalAmount": "249.97",
  "items": [
    {
      "id": "order-item-uuid",
      "orderId": "a1b2c3d4-1234-4567-89ab-123456789012",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2,
      "unitPrice": "99.99"
    },
    {
      "id": "order-item-uuid-2",
      "orderId": "a1b2c3d4-1234-4567-89ab-123456789012",
      "productId": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 1,
      "unitPrice": "49.99"
    }
  ]
}
```

Exact response fields depend on the shared Prisma schema.

### GET `/api/orders`

Returns orders accessible to the authenticated user.

```bash
curl http://localhost:8000/api/orders \
  -H "Authorization: Bearer <access_token>"
```

For users with the `user` role, the service filters orders by their authenticated user ID.

Administrators can retrieve orders across the platform and receive additional user information.

Results are ordered by creation date, newest first.

The response includes order items and associated product information.

### GET `/api/orders/:id`

Returns a specific order by its identifier.

```bash
curl http://localhost:8000/api/orders/<order_id> \
  -H "Authorization: Bearer <access_token>"
```

The response includes the order, its items, and associated product details.

Regular users can only access orders that belong to them. Administrators can access any order.

If the order does not exist, the service returns HTTP `404 Not Found`.

If the authenticated user does not own the requested order and is not an administrator, it returns HTTP `403 Forbidden`.

## 📦 Inventory Management

The Order Service manages inventory consistency during checkout through Prisma transactions.

### Product Validation

Before creating an order, the service retrieves the requested products from the database.

It verifies that each product exists and has enough stock for the requested quantity.

For each item, the order amount is calculated using:

```text
Item Total = Product Price × Quantity

Order Total = Sum of All Item Totals
```

If a product is unavailable, the service returns:

```json
{
  "error": "Product with ID <product_id> not found"
}
```

HTTP Status: `404 Not Found`

If a product has insufficient stock, it returns HTTP `400 Bad Request` with the available and requested quantities.

### Atomic Stock Updates

Stock is decremented within the same database transaction used to create the order.

The operation uses a conditional update:

```typescript
await tx.product.updateMany({
  where: {
    id: item.id,
    stock: { gte: item.quantity },
  },
  data: {
    stock: { decrement: item.quantity },
  },
});
```

This prevents a decrement when the current stock is below the requested quantity.

If the conditional update affects no records, the transaction fails with HTTP `409 Conflict`.

Successful stock deductions and order creation are committed together.

If the transaction fails, changes made within it are rolled back.

## 🔁 Redis Idempotency

The Order Service supports idempotent checkout requests through the optional `Idempotency-Key` HTTP header.

This mechanism reduces duplicate order creation caused by network retries, repeated form submissions, or accidental duplicate requests.

### Idempotency Workflow

```text
           POST /api/orders
                  │
                  ▼
         Idempotency-Key Present?
                  │
            ┌─────┴─────┐
            │           │
           No          Yes
            │           │
            │           ▼
            │      Check Redis
            │           │
            │    ┌──────┼───────────────┐
            │    │      │               │
            │    ▼      ▼               ▼
            │   New  IN_PROGRESS    Cached Result
            │    │      │               │
            │    ▼      ▼               ▼
            │  Lock   HTTP 409       Return HTTP 200
            │    │
            └────┤
                 ▼
           Create Order
                 │
                 ▼
          Publish Kafka Event
                 │
                 ▼
           Cache Result
                 │
                 ▼
           Return HTTP 200
```

### Redis Key Format

Each idempotency key is scoped to the authenticated user.

```text
idempotency:order:<userId>:<idempotencyKey>
```

For example:

```text
idempotency:order:user-123:checkout-request-123
```

### Redis Expiration

| Record                | TTL        | Purpose                                          |
| --------------------- | ---------- | ------------------------------------------------ |
| `IN_PROGRESS` lock    | 60 seconds | Prevents concurrent execution                    |
| Cached order response | 24 hours   | Returns the previous result for matching retries |

The lock is acquired using Redis `SET` with the `NX` option.

If a request is already being processed using the same key, the service returns:

```json
{
  "error": "Order is already being processed. Please wait."
}
```

HTTP Status: `409 Conflict`

When a cached result exists, the previous order response is returned without creating another order.

If processing fails, the service attempts to release the idempotency key.

**Note:** The implementation scopes keys by user and key value, but does not compare request bodies. Clients should use a new idempotency key for each distinct checkout operation.

## 📨 Kafka Integration

The Order Service uses Apache Kafka for asynchronous communication with other microservices.

### Produced Topics

| Topic                      | Event                | Purpose                                      |
| -------------------------- | -------------------- | -------------------------------------------- |
| `orders`                   | `OrderCreated`       | Announces newly created orders               |
| `order.status.updated.dlq` | Invalid event record | Quarantines malformed delivery status events |

### Order Creation Event

After a successful database transaction, the service publishes an event to `TOPICS.ORDERS`.

Example payload:

```json
{
  "orderId": "a1b2c3d4-1234-4567-89ab-123456789012",
  "userId": "user-uuid",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "totalAmount": 199.98,
  "createdAt": "2026-10-20T14:22:00.000Z"
}
```

The event is published with the order ID as the Kafka message key and requests acknowledgments from all in-sync replicas using `acks: -1`.

The shared `kafkaMessagesProduced` metric is incremented after successful publishing.

### Consumed Topics

| Topic                            | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `payments`                       | Processes payment outcomes           |
| `order.status.updated`           | Processes delivery lifecycle changes |
| `order.dlq` (`TOPICS.ORDER_DLQ`) | Handles order failure notifications  |

The Kafka consumer uses the client ID and consumer group `order-service`.

It subscribes with `fromBeginning: true`, allowing a new consumer group to process existing messages from the earliest retained offsets.

## 💳 Payment Status Processing

The Order Service listens for payment resolution events from the Payment Service.

When a payment result is received, the service updates the corresponding order using a database transaction.

### Successful Payment

A successful payment transitions an order from `PENDING` to `PAID`.

The `paymentStatus` field is updated to `SUCCESS`.

```text
PENDING
   │
   ▼
Payment SUCCESS
   │
   ▼
PAID
```

### Failed Payment

A failed payment can transition an order from `PENDING` or `PAID` to `FAILED`.

The `paymentStatus` field is updated to `FAILED`.

```text
PENDING / PAID
      │
      ▼
 Payment FAILED
      │
      ▼
    FAILED
```

After processing a payment event, the service retrieves the corresponding order and broadcasts its current state through SSE when the record exists.

## 🚚 Delivery Status Processing

Delivery status events are received from the Delivery Service through Kafka.

Incoming delivery events are validated using Zod before being applied.

### Supported Delivery Stages

| Status      | Description                   |
| ----------- | ----------------------------- |
| `PREPARING` | Order preparation has started |
| `SHIPPED`   | Order has entered shipment    |
| `DELIVERED` | Delivery has been completed   |

### Allowed Previous States

The service supports the following status transitions:

| New Status  | Allowed Previous Statuses                                          |
| ----------- | ------------------------------------------------------------------ |
| `PREPARING` | `PENDING`, `PAID`                                                  |
| `SHIPPED`   | `PENDING`, `PAID`, `PREPARING`, `PACKAGING`                        |
| `DELIVERED` | `PENDING`, `PAID`, `PREPARING`, `PACKAGING`, `SHIPPED`, `SHIPPING` |

The status update is applied only when the current order status is allowed and the incoming event timestamp is newer than the stored `statusUpdatedAt` value, or when no previous timestamp exists.

This protects delivery state from stale events and invalid backward transitions.

### Delivery Event Validation

Incoming events must contain:

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "DELIVERED",
  "courier": "Марія",
  "updatedAt": "2026-10-20T14:22:00.000Z"
}
```

The schema requires a UUID order ID, one of the three supported delivery statuses, a nonempty courier name, and a valid datetime with timezone information.

The Kafka message key must also match the event's `orderId`.

When a valid status update modifies the order, the updated state is broadcast through SSE.

## 🚨 Dead-Letter Queue Handling

The Order Service includes functionality for quarantining invalid delivery events and responding to order failure messages.

### Invalid Delivery Events

When an `order.status.updated` message fails validation or its Kafka message key does not match the order ID, the consumer publishes the invalid event to:

```text
order.status.updated.dlq
```

Example quarantine payload:

```json
{
  "sourceTopic": "order.status.updated",
  "sourcePartition": 0,
  "sourceOffset": "123",
  "originalKey": "invalid-order-id",
  "originalValue": "{\"status\":\"UNKNOWN\"}",
  "error": "Validation failed",
  "failedAt": "2026-10-20T14:22:00.000Z"
}
```

This preserves diagnostic information about the malformed message for later inspection.

### Order Failure Events

The consumer also subscribes to `TOPICS.ORDER_DLQ`.

When an order failure notification is received, the service extracts the order ID and attempts to mark the order as `FAILED`.

The implementation does not overwrite orders already marked `DELIVERED`.

It also updates the payment status to `FAILED` and records the event timestamp.

If an order record exists, its state is broadcast through SSE.

## 📡 Real-Time Server-Sent Events

The Order Service supports real-time order tracking through Server-Sent Events.

Unlike polling, SSE maintains an open HTTP connection through which the server can send updates whenever order state changes.

The feature uses the `better-sse` library.

### GET `/api/events`

Opens an authenticated event stream.

```bash
curl -N http://localhost:8000/api/events \
  -H "Authorization: Bearer <access_token>"
```

The API Gateway forwards this request to the Order Service's `/events` endpoint.

### Event Types

Each status notification is broadcast under two event names:

```text
order_update
order.status.updated
```

Example event payload:

```json
{
  "id": "a1b2c3d4-1234-4567-89ab-123456789012",
  "orderId": "a1b2c3d4-1234-4567-89ab-123456789012",
  "userId": "user-uuid",
  "status": "SHIPPED",
  "courier": "Марія",
  "updatedAt": "2026-10-20T14:22:00.000Z"
}
```

### Authorization Filtering

SSE events are filtered by authenticated user identity.

Regular users receive updates only for their own orders, while administrators can receive updates for all orders.

The service stores the authenticated user ID and role in each SSE session.

### Frontend Example

A browser application can subscribe to order updates using `EventSource`:

```javascript
const events = new EventSource("/api/events", {
  withCredentials: true,
});

events.addEventListener("order_update", (event) => {
  const order = JSON.parse(event.data);

  console.log("Order updated:", order);
});

events.onerror = (error) => {
  console.error("SSE connection error:", error);
};
```

**Note:** Native browser `EventSource` does not support custom `Authorization` headers. This example requires an authentication method compatible with the Gateway, such as its supported token query parameter or another configured authentication mechanism. The provided Gateway implementation does not authenticate SSE requests using cookies alone.

## 🔐 Authentication & Authorization

The Order Service uses the shared `requireUser` middleware to enforce authenticated access.

The API Gateway validates JWT access tokens and forwards verified user identity through trusted internal headers.

### Access Rules

| Operation                      | Regular User | Admin |
| ------------------------------ | ------------ | ----- |
| Create an order                | Yes          | Yes   |
| View own orders                | Yes          | Yes   |
| View other users' orders       | No           | Yes   |
| Subscribe to own order updates | Yes          | Yes   |
| Subscribe to all order updates | No           | Yes   |

The service performs ownership verification before returning a specific order.

For regular users, order listing is filtered by authenticated user ID.

In production, the Order Service should only accept trusted identity headers from the API Gateway or another authorized internal component.

## ⚙️ Environment Variables

The service uses Zod to validate configuration during startup.

| Variable         | Default                  | Description                            |
| ---------------- | ------------------------ | -------------------------------------- |
| `NODE_ENV`       | `development`            | Application environment                |
| `PORT`           | `3001`                   | HTTP server port                       |
| `KAFKA_BROKERS`  | `localhost:9092`         | Comma-separated Kafka broker addresses |
| `REDIS_URL`      | `redis://localhost:6379` | Redis connection URL                   |
| `REDIS_PASSWORD` | Optional                 | Redis authentication password          |

### Example `.env`

```dotenv
NODE_ENV=development
PORT=3001

KAFKA_BROKERS=localhost:9092

REDIS_URL=redis://localhost:6379
```

Database configuration is supplied through the shared Prisma package. Configure the appropriate database connection variables according to the monorepo's shared environment configuration.

## 💻 Getting Started

### Prerequisites

The service requires Node.js 20 or later, npm, PostgreSQL, Redis, Apache Kafka, and the `@ecommerce/shared` workspace package.

### Local Development

Install workspace dependencies from the monorepo root:

```bash
npm install
```

Ensure the required infrastructure services are running and configure the environment variables.

Start the Order Service:

```bash
npm run dev --workspace=order-service
```

Alternatively, from the service directory:

```bash
cd services/order-service
npm run dev
```

The application uses `tsx watch` for automatic reloading during development.

After Redis and Kafka connections are established, the HTTP server starts on:

```text
http://localhost:3001
```

### Production Build

Compile TypeScript:

```bash
npm run build --workspace=order-service
```

Start the compiled application:

```bash
npm run start --workspace=order-service
```

The production script executes `node dist/index.js`.

Ensure the shared package is built and that the compiled module imports are compatible with your Node.js runtime configuration.

### Docker

The repository includes a Dockerfile based on Node.js 20 Alpine.

Build the image from the monorepo root:

```bash
docker build \
  -f services/order-service/Dockerfile \
  -t order-service .
```

Run the container with the required environment variables:

```bash
docker run -p 3001:3001 \
  --env-file services/order-service/.env \
  order-service
```

Ensure PostgreSQL, Redis, and Kafka are accessible from within the container.

The provided Dockerfile currently launches the development server using `npm run dev`. Production deployment should use compiled artifacts and the corresponding production startup command.

## 📂 Project Structure

```text
order-service/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── consumers/
│   │   └── status.consumer.ts
│   │
│   ├── controllers/
│   │   ├── order.controller.ts
│   │   └── sse.controller.ts
│   │
│   ├── lib/
│   │   └── redis.ts
│   │
│   ├── producers/
│   │   └── order.producer.ts
│   │
│   ├── routes/
│   │   ├── order.routes.ts
│   │   └── sse.routes.ts
│   │
│   ├── schemas/
│   │   ├── order-create.schema.ts
│   │   └── order-status.schema.ts
│   │
│   ├── services/
│   │   ├── idempotency.service.ts
│   │   ├── order-status.service.ts
│   │   ├── order.service.ts
│   │   └── sse.service.ts
│   │
│   └── index.ts
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

| File                                   | Responsibility                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `src/index.ts`                         | Application startup, route registration, Kafka and Redis connections, shutdown |
| `src/config/env.ts`                    | Environment configuration validation                                           |
| `src/controllers/order.controller.ts`  | Order API request handling                                                     |
| `src/controllers/sse.controller.ts`    | SSE session management and broadcasting                                        |
| `src/lib/redis.ts`                     | Redis client lifecycle                                                         |
| `src/consumers/status.consumer.ts`     | Payment, delivery, and order failure event processing                          |
| `src/producers/order.producer.ts`      | Kafka order creation publishing                                                |
| `src/routes/order.routes.ts`           | Order REST API routes                                                          |
| `src/routes/sse.routes.ts`             | SSE event stream route                                                         |
| `src/schemas/order-create.schema.ts`   | Checkout request validation                                                    |
| `src/schemas/order-status.schema.ts`   | Delivery event validation                                                      |
| `src/services/idempotency.service.ts`  | Redis idempotency locks and cached responses                                   |
| `src/services/order-status.service.ts` | Transactional order status updates                                             |
| `src/services/order.service.ts`        | Order creation, inventory management, and retrieval                            |

The `sse.service.ts` file currently contains an empty service implementation. Active SSE functionality is implemented in `sse.controller.ts`.

## 📊 Monitoring & Observability

The Order Service integrates Prometheus monitoring using the shared package.

### HTTP Metrics

The `httpMetricsMiddleware` instruments incoming HTTP requests.

Metrics are available at:

```text
GET http://localhost:3001/metrics
```

### Kafka Metrics

The service tracks Kafka consumption, production, and consumer errors using shared metrics counters.

| Metric Export           | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `kafkaMessagesConsumed` | Counts consumed Kafka messages                      |
| `kafkaMessagesProduced` | Counts successfully published order creation events |
| `kafkaConsumerErrors`   | Counts Kafka consumer processing errors             |

Kafka metrics can be used to monitor message throughput and detect processing failures.

The service is compatible with Prometheus and monitoring dashboards such as Grafana.

## 🛑 Graceful Shutdown

The service handles `SIGINT` and `SIGTERM` signals.

During shutdown, it stops the HTTP server, disconnects the Kafka consumer and producer, closes the Prisma connection, and disconnects Redis.

The implementation uses an 8-second overall shutdown deadline.

After 3 seconds, remaining HTTP connections may be forcibly closed to avoid delaying shutdown indefinitely.

Resource cleanup operations are coordinated using `Promise.allSettled`, allowing cleanup failures to be logged individually.

The application also includes startup error handling to disconnect initialized Kafka and database resources if startup fails.

## 🔒 Production Considerations

**Idempotency:** Redis idempotency protects requests that reuse the same key, but requests without a key are not deduplicated.

**Inventory Consistency:** Conditional stock decrements and database transactions protect against overselling for individual updates. Repeated product IDs within the same order payload should be consolidated or rejected before checkout to avoid inconsistent aggregate stock validation.

**Event Publishing:** Order creation is committed to the database before the Kafka event is published. If Kafka publishing fails, the order may already exist without its creation event being delivered. A transactional outbox pattern would improve reliability.

**Payment Processing:** The service updates payment state using conditional database operations. The current implementation does not apply the same timestamp-ordering guard to payment events that it applies to delivery events.

**Kafka Error Handling:** Consumer processing errors are logged and counted. They are not necessarily retried because exceptions are caught inside the message handler.

**Dead-Letter Queues:** Malformed delivery events are quarantined, but the quarantine topic requires a separate operational process for inspection and recovery.

**SSE Scaling:** SSE sessions are maintained in application memory. In multi-instance deployments, a client only receives broadcasts handled by the instance holding its connection unless an additional shared broadcasting mechanism is introduced.

**Authorization:** Backend services must only trust authenticated user headers forwarded by approved infrastructure.

**Metrics Security:** The `/metrics` endpoint is registered without service-level authentication and should be restricted to trusted monitoring systems in production.

**Recovery:** A complete production deployment should include event replay strategies, idempotent event processing, and recovery procedures for interrupted workflows.

## 📦 Shared Dependencies

The Order Service relies on `@ecommerce/shared` for common infrastructure and application contracts.

Shared functionality includes the Prisma client, authenticated user types, Kafka producer and consumer factories, topic constants, event interfaces, validation middleware, error handling, and Prometheus instrumentation.

Using a shared package promotes consistent event schemas and reduces duplicated infrastructure code across the e-commerce microservices.

## 📝 Notes

The Order Service is responsible for order creation, inventory reservation through stock deduction, order persistence, and the tracking of payment and delivery states.

It does not directly process payments or perform deliveries. Those responsibilities belong to the Payment Service and Delivery Service, which communicate their results through Kafka.

The service connects synchronous REST-based checkout operations with asynchronous business processes and provides real-time status updates to authenticated clients through SSE.

---

**Order Service** — Reliable, event-driven order management with transactional inventory updates, Kafka integration, Redis idempotency, and real-time tracking.
