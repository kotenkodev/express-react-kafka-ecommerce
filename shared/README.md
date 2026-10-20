# 🧩 Shared Package — `@ecommerce/shared`

A centralized TypeScript infrastructure package providing **Prisma database access, Apache Kafka utilities, domain event contracts, authentication middleware, request validation, error handling, and Prometheus monitoring** for the KafkaShop e-commerce microservices platform.

The shared package eliminates duplicated infrastructure code across services and establishes consistent contracts for database models, Kafka messages, HTTP requests, authorization, and observability.

Unlike the platform's standalone microservices, `@ecommerce/shared` is a reusable workspace library. It does not expose its own HTTP server or listen on a network port.

**Package:** `@ecommerce/shared`  
**Version:** `1.0.0`  
**Database:** PostgreSQL  
**ORM:** Prisma 5.22  
**Messaging:** Apache Kafka / KafkaJS  
**Language:** TypeScript

---

## 🚀 Key Features

- **Centralized Database Models** — Shared Prisma schema for users, categories, products, orders, and order items.
- **Prisma Client Singleton** — Reusable database client with development-mode instance caching.
- **Kafka Client Factories** — Consistent producer and consumer creation with validated configuration.
- **Kafka Event Contracts** — Shared TypeScript interfaces for order creation, payments, delivery updates, statistics, and dead-letter messages.
- **Kafka Topic Registry** — Centralized topic names to reduce inconsistencies across services.
- **Dead-Letter Queue Utilities** — Standardized publishing of failed order messages.
- **Retry Utilities** — Reusable exponential-backoff retry helper and asynchronous sleep utility.
- **HTTP Authentication Middleware** — Reads trusted user identity headers and enforces role-based access.
- **Zod Request Validation** — Validates HTTP bodies, query parameters, and route parameters.
- **Centralized Error Handling** — Consistent HTTP errors and safe unexpected-error responses.
- **Prometheus Metrics** — Tracks Kafka messages, payment outcomes, HTTP activity, and processing duration.
- **Database Seeding** — Populates the database with demo users, product categories, products, and sample orders.
- **Reusable TypeScript Exports** — Exposes common infrastructure and domain types through a single package.

## 🛠 Technology Stack

| Technology      | Purpose                                            |
| --------------- | -------------------------------------------------- |
| TypeScript      | Type-safe shared library                           |
| Node.js         | Runtime for backend services                       |
| PostgreSQL      | Relational database                                |
| Prisma ORM 5.22 | Database schema, generated client, and persistence |
| KafkaJS         | Kafka clients and event messaging                  |
| Zod             | Runtime validation                                 |
| Express types   | HTTP middleware interfaces                         |
| prom-client     | Prometheus metrics                                 |
| bcryptjs        | Password hashing in database seeding               |
| dotenv          | Environment configuration                          |
| npm Workspaces  | Monorepo package integration                       |

## 🏗 Architecture

The shared package provides reusable functionality for the platform's backend services.

```text
                       KafkaShop Platform
                               │
               ┌───────────────┴───────────────┐
               │                               │
               ▼                               ▼
       ┌──────────────┐                ┌──────────────┐
       │ API Gateway  │                │ Auth Service │
       └──────┬───────┘                └──────┬───────┘
              │                               │
       ┌──────┴───────────────────────────────┴───────┐
       │                                               │
       ▼                                               ▼
┌────────────────────┐                      ┌────────────────────┐
│   Order Service    │                      │  Product Service   │
└─────────┬──────────┘                      └──────────┬─────────┘
          │                                            │
          └────────────────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  @ecommerce/shared  │
                    │                      │
                    │ • Prisma Client      │
                    │ • Database Models    │
                    │ • Kafka Factories    │
                    │ • Event Contracts    │
                    │ • HTTP Middleware    │
                    │ • Zod Validation     │
                    │ • Prometheus Metrics │
                    │ • Retry & DLQ        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ PostgreSQL │  │   Kafka    │  │ Prometheus │
       └────────────┘  └────────────┘  └────────────┘
```

Additional consumers of the shared package include the Payment, Delivery, Search, and Analytics Services.

The package centralizes infrastructure concerns while each microservice retains responsibility for its own business logic.

## 📂 Project Structure

```text
shared/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── http/
│   │   ├── auth.ts
│   │   ├── error.handler.ts
│   │   ├── error.ts
│   │   ├── index.ts
│   │   ├── metrics.middleware.ts
│   │   └── validation.ts
│   │
│   ├── kafka/
│   │   ├── client.ts
│   │   ├── dlq.ts
│   │   ├── index.ts
│   │   ├── metrics.ts
│   │   └── retry.ts
│   │
│   ├── types/
│   │   ├── events.ts
│   │   ├── index.ts
│   │   └── topics.ts
│   │
│   ├── index.ts
│   └── prisma.ts
│
├── test/
│   ├── error.handler.test.ts
│   ├── exports.typecheck.ts
│   └── validation.test.ts
│
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

### Module Responsibilities

| Module                           | Responsibility                                 |
| -------------------------------- | ---------------------------------------------- |
| `prisma/schema.prisma`           | Relational database schema                     |
| `prisma/seed.ts`                 | Development database seeding                   |
| `src/prisma.ts`                  | Shared Prisma client and database utilities    |
| `src/http/auth.ts`               | Authentication and role middleware             |
| `src/http/validation.ts`         | Zod request validation                         |
| `src/http/error.ts`              | Custom HTTP error class                        |
| `src/http/error.handler.ts`      | Express error responses                        |
| `src/http/metrics.middleware.ts` | HTTP metrics instrumentation                   |
| `src/kafka/client.ts`            | Kafka client, producer, and consumer factories |
| `src/kafka/dlq.ts`               | Dead-letter queue publishing                   |
| `src/kafka/retry.ts`             | Retry and sleep helpers                        |
| `src/kafka/metrics.ts`           | Prometheus metrics registry and counters       |
| `src/types/events.ts`            | Shared Kafka event contracts                   |
| `src/types/topics.ts`            | Kafka topic constants                          |
| `src/index.ts`                   | Main package exports                           |

---

## 🗄 Prisma Database Integration

The shared package owns the platform's Prisma schema and exports a reusable Prisma client.

The database schema is defined in:

```text
shared/prisma/schema.prisma
```

The datasource uses PostgreSQL and expects two environment variables:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`DATABASE_URL` provides the primary connection string, while `DIRECT_URL` is configured for direct database access.

### Database Models

| Model       | Description                                    |
| ----------- | ---------------------------------------------- |
| `User`      | User identity and role                         |
| `Category`  | Product categories                             |
| `Product`   | Product catalog and stock                      |
| `Order`     | Customer orders and their lifecycle            |
| `OrderItem` | Products and quantities associated with orders |

### Database Relationships

```text
             ┌──────────────┐
             │     User     │
             │              │
             │ id           │
             │ email        │
             │ username     │
             │ role         │
             └──────┬───────┘
                    │ 1:N
                    ▼
             ┌──────────────┐
             │     Order    │
             │              │
             │ userId       │
             │ status       │
             │ paymentStatus│
             │ totalAmount  │
             │ courier      │
             └──────┬───────┘
                    │ 1:N
                    ▼
             ┌──────────────┐
             │   OrderItem  │
             │              │
             │ productId    │
             │ quantity     │
             │ unitPrice    │
             └──────┬───────┘
                    │ N:1
                    ▼
             ┌──────────────┐
             │    Product   │
             │              │
             │ name         │
             │ price        │
             │ stock        │
             │ categoryId   │
             └──────┬───────┘
                    │ N:1
                    ▼
             ┌──────────────┐
             │   Category   │
             │              │
             │ name         │
             └──────────────┘
```

### User Model

The `User` model stores account information and authentication-related data.

Its fields include:

```text
id
username
firstName
lastName
email
passwordHash
role
orders
createdAt
updatedAt
```

User IDs are generated as UUID strings.

Usernames and email addresses are unique.

Passwords are represented in the database using a `passwordHash` field mapped to the `password_hash` database column.

Roles default to `user`.

### Product Model

Products contain catalog information, pricing, inventory, and category relationships.

```text
id
name
emoji
description
stock
price
categoryId
createdAt
updatedAt
```

Product prices use PostgreSQL decimal precision:

```prisma
price Decimal @db.Decimal(10, 2)
```

### Order Model

The `Order` model tracks order state, payment status, value, and delivery information.

```text
id
userId
status
paymentStatus
totalAmount
courier
statusUpdatedAt
createdAt
updatedAt
```

Order totals use:

```prisma
totalAmount Decimal @db.Decimal(12, 2)
```

### Order Item Model

Each order item stores a product reference, quantity, and captured unit price.

```prisma
@@unique([orderId, productId])
```

This uniqueness constraint prevents the same product from appearing more than once in a single order record.

Checkout services should aggregate duplicate product identifiers before creating order items.

## 🔢 Shared Enums

### User Roles

```typescript
enum Role {
  admin
  user
}
```

The default role for new users is `user`.

### Order Status

```typescript
enum OrderStatus {
  PENDING
  PAID
  PREPARING
  SHIPPED
  DELIVERED
  FAILED
  CANCELED
  PACKAGING
  SHIPPING
}
```

These values represent the statuses available in the database schema.

The Kafka delivery event contract uses a narrower set: `PREPARING`, `SHIPPED`, and `DELIVERED`.

### Payment Status

```typescript
enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}
```

Payment status is tracked separately from the order's general lifecycle status.

---

## 🔌 Prisma Client Singleton

The shared Prisma client is implemented in:

```text
src/prisma.ts
```

It creates a client when needed and reuses a globally cached instance outside production.

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

This approach reduces the creation of duplicate Prisma client instances during development reloads.

### Usage Example

```typescript
import { prisma } from "@ecommerce/shared";

const user = await prisma.user.findUnique({
  where: {
    email: "john.doe@example.com",
  },
});
```

The package also exports `Prisma`, `PrismaClient`, and several generated database types.

## 📨 Kafka Infrastructure

The shared package provides reusable KafkaJS client factories with standardized retry configuration.

### Kafka Client Configuration

The factory accepts a client identifier and broker addresses.

```typescript
import { createKafkaClient } from "@ecommerce/shared";

const kafka = createKafkaClient({
  clientId: "order-service",
  brokers: ["localhost:9092"],
});
```

The factory rejects empty client IDs and invalid broker lists.

The configured KafkaJS retry policy is:

```typescript
retry: {
  initialRetryTime: 300,
  retries: 5,
}
```

### Kafka Producer

```typescript
import { createKafkaProducer } from "@ecommerce/shared";

const producer = createKafkaProducer({
  clientId: "order-service",
  brokers: ["localhost:9092"],
});

await producer.connect();
```

Automatic Kafka topic creation is disabled:

```typescript
producer({
  allowAutoTopicCreation: false,
});
```

### Kafka Consumer

```typescript
import { createKafkaConsumer } from "@ecommerce/shared";

const consumer = createKafkaConsumer(
  {
    clientId: "payment-service",
    brokers: ["localhost:9092"],
  },
  "payment-service",
);

await consumer.connect();
```

Consumer groups must have a nonempty group ID.

Automatic topic creation is also disabled for consumers.

### Kafka Topic Registry

Topic names are centralized in:

```text
src/types/topics.ts
```

```typescript
export const TOPICS = {
  ORDERS: "orders",
  PAYMENTS: "payments",
  ORDER_STATUS_UPDATED: "order.status.updated",
  ORDER_DLQ: "order.dlq",
  ORDER_STATS: "order.stats",
};
```

### Topic Responsibilities

| Topic                  | Purpose                          |
| ---------------------- | -------------------------------- |
| `orders`               | Newly created orders             |
| `payments`             | Payment processing results       |
| `order.status.updated` | Delivery status changes          |
| `order.dlq`            | Failed order processing messages |
| `order.stats`          | Order statistics events          |

All referenced Kafka topics should exist before services attempt to produce or consume them, since automatic topic creation is disabled.

---

## 📜 Shared Event Contracts

The package defines TypeScript types for communication between microservices.

These contracts ensure producers and consumers agree on message shapes during development.

### `OrderCreated`

```typescript
export type OrderCreated = {
  orderId: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  createdAt: string;
};
```

Used to communicate newly created orders.

### `PaymentProcessed`

```typescript
export type PaymentProcessed = {
  paymentId: string;
  orderId: string;
  status: "SUCCESS" | "FAILED";
  processedAt: string;
  failureReason: string | null;
};
```

Used to communicate payment outcomes.

### `OrderStatusUpdated`

```typescript
export type OrderStatusUpdated = {
  orderId: string;
  status: "PREPARING" | "SHIPPED" | "DELIVERED";
  courier: string;
  updatedAt: string;
};
```

Used to communicate delivery lifecycle updates.

### `OrderStats`

```typescript
export type OrderStats = {
  windowStart: string;
  ordersCount: number;
  totalRevenue: number;
  successRate: number;
  avgProcessingMs: number;
};
```

Represents an aggregated order statistics window.

### `DeadLetterMessage`

```typescript
export type DeadLetterMessage<T> = {
  originalMessage: T;
  error: string;
  retryCount: number;
  failedAt: string;
};
```

A generic contract for preserving information about failed message processing.

**Important:** These TypeScript contracts do not automatically validate incoming Kafka JSON at runtime. Consumers should apply appropriate runtime validation when handling untrusted messages.

---

## 🚨 Dead-Letter Queue Utility

The shared package includes a generic helper for publishing failed order messages.

```typescript
import { publishToDLQ } from "@ecommerce/shared";
```

The helper accepts a Kafka producer, an original message containing an order ID, an error, and a retry count.

```typescript
await publishToDLQ(
  producer,
  originalOrder,
  "Payment failed after maximum retries",
  3,
);
```

It publishes the message to `TOPICS.ORDER_DLQ`.

### DLQ Message Structure

```json
{
  "originalMessage": {
    "orderId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "error": "Payment failed after maximum retries",
  "retryCount": 3,
  "failedAt": "2026-10-20T14:22:00.000Z"
}
```

The original order ID is used as the Kafka message key.

Publishing requests acknowledgments from all in-sync replicas using `acks: -1`.

### DLQ Responsibilities

The helper standardizes the message format and publishing operation.

It does not automatically inspect, replay, or recover dead-letter messages. Recovery requires separate consumer or operational logic.

---

## 🔄 Retry Utilities

The shared package provides two retry-related utilities.

### `sleep()`

An asynchronous delay helper:

```typescript
import { sleep } from "@ecommerce/shared";

await sleep(1000);
```

### `withRetry()`

Executes an asynchronous operation with exponential backoff.

```typescript
import { withRetry } from "@ecommerce/shared";

const result = await withRetry(
  async () => {
    return performOperation();
  },
  {
    retries: 3,
    initialRetryTime: 1000,
  },
);
```

### Retry Configuration

| Option             | Default | Description                                 |
| ------------------ | ------- | ------------------------------------------- |
| `retries`          | `3`     | Number of retries after the initial attempt |
| `initialRetryTime` | `1000`  | Initial backoff delay in milliseconds       |

With default settings, delays are:

```text
Initial Attempt
      │
      ▼
   Failure
      │
   Wait 1s
      │
      ▼
  Retry #1
      │
   Failure
      │
   Wait 2s
      │
      ▼
  Retry #2
      │
   Failure
      │
   Wait 4s
      │
      ▼
  Retry #3
      │
      ▼
 Success / Final Error
```

The helper validates that the retry count and initial delay are nonnegative integers.

When the retry limit is exhausted, the final error is rethrown.

The utility does not include jitter, cancellation, or operation-specific retry classification.

---

## 🔐 Authentication & Authorization Middleware

The shared package provides reusable Express middleware for authenticated identity and role checks.

### `requireUser`

The `requireUser` middleware reads user information from HTTP headers:

```text
x-user-id
x-user-role
x-user-email
```

Example usage:

```typescript
import { requireUser } from "@ecommerce/shared";

router.get("/orders", requireUser, orderController.getOrders);
```

When required identity headers are missing, the middleware returns HTTP `401`.

On success, it attaches the identity to the request:

```typescript
req.user = {
  id,
  role,
  email,
};
```

The `AuthenticatedUser` type uses a string ID and Prisma's role type.

### `requireRole`

The `requireRole` middleware restricts access to permitted roles.

```typescript
import { requireRole } from "@ecommerce/shared";

router.post("/products", requireRole("admin"), productController.createProduct);
```

If no role is available, the middleware returns HTTP `401`.

If the role is not permitted, it returns HTTP `403`.

### Security Boundary

These middleware functions do not verify JWT signatures themselves.

They rely on user identity forwarded through trusted headers, typically from the API Gateway.

**Direct client access to backend services must be restricted** so external users cannot forge identity or role headers.

The `requireRole` middleware can read the role directly from `x-user-role` when `req.user` is absent, so network-level trust boundaries are especially important.

---

## ✅ HTTP Request Validation

The shared package provides a generic Zod-based validation middleware:

```typescript
import { validate } from "@ecommerce/shared";
```

It can validate route parameters, query parameters, request bodies, or combinations of them.

### Request Body Validation

```typescript
import { z, validate } from "@ecommerce/shared";

const createSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().min(0),
});

router.post("/products", validate({ body: createSchema }), createProduct);
```

### Query Validation

```typescript
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/products", validate({ query: querySchema }), (req, res) => {
  const query = res.locals.query;
  res.json(query);
});
```

Validated query parameters are stored in:

```typescript
res.locals.query;
```

This avoids assigning directly to Express 5's getter-only `req.query` property.

### Validation Behavior

| Input Source | Validated Result             |
| ------------ | ---------------------------- |
| `body`       | Replaces `req.body`          |
| `params`     | Replaces `req.params`        |
| `query`      | Stored in `res.locals.query` |

### Validation Error

Invalid input returns HTTP `400 Bad Request`.

```json
{
  "error": "Validation failed",
  "details": {
    "body": {
      "formErrors": [],
      "fieldErrors": {
        "name": ["String must contain at least 1 character(s)"]
      }
    }
  }
}
```

The exact validation details depend on the Zod schema and the submitted values.

The controller is not called when validation fails.

---

## ⚠️ Centralized Error Handling

The shared package provides an `HttpError` class and Express error-handling middleware.

### Custom HTTP Errors

```typescript
import { HttpError } from "@ecommerce/shared";

throw new HttpError("Product not found", 404);
```

The error handler preserves expected `HttpError` status codes between 400 and 599.

Example response:

```json
{
  "error": "Product not found"
}
```

### Error Behavior

| Condition                   | HTTP Status    | Response                |
| --------------------------- | -------------- | ----------------------- |
| Invalid JSON request body   | `400`          | `Invalid JSON body`     |
| Valid `HttpError`           | Defined status | Error message           |
| Unexpected exception        | `500`          | `Internal server error` |
| Invalid custom error status | `500`          | `Internal server error` |

Unexpected errors are logged on the server but are not exposed directly to clients.

If HTTP response headers have already been sent, the handler passes the error to the next Express error handler.

### Express Integration

```typescript
import express from "express";
import { errorHandler } from "@ecommerce/shared";

const app = express();

app.use(express.json());

// Register routes here.

app.use(errorHandler);
```

The error middleware should be registered after application routes.

---

## 📊 Prometheus Monitoring

The shared package integrates Prometheus metrics through `prom-client`.

It registers default Node.js process metrics and exposes counters and histograms for application-specific operations.

### Available Metrics

| Metric                              | Type      | Description                                   |
| ----------------------------------- | --------- | --------------------------------------------- |
| `kafka_messages_produced_total`     | Counter   | Successfully published Kafka messages         |
| `kafka_messages_consumed_total`     | Counter   | Kafka messages counted by consumers           |
| `kafka_consumer_errors_total`       | Counter   | Consumer processing errors                    |
| `order_processing_duration_seconds` | Histogram | End-to-end order processing durations         |
| `payment_success_total`             | Counter   | Successfully published payment success events |
| `payment_failure_total`             | Counter   | Successfully published payment failure events |
| `http_requests_total`               | Counter   | Completed HTTP requests                       |

### Metric Labels

Kafka production metrics use the `topic` label.

Kafka consumption and error metrics use:

```text
topic
groupId
```

HTTP metrics use:

```text
route
status_code
```

The order processing histogram uses these configured buckets:

```text
0.1, 0.5, 1, 2, 5, 10, 30, 60 seconds
```

### HTTP Metrics Middleware

The shared middleware increments an HTTP request counter when a response finishes.

```typescript
import { httpMetricsMiddleware, metricsHandler } from "@ecommerce/shared";

app.use(httpMetricsMiddleware);

app.get("/metrics", metricsHandler);
```

The metrics handler sets the Prometheus content type and returns all registered metrics.

Example:

```bash
curl http://localhost:3001/metrics
```

The port belongs to the service using the shared middleware; the package itself does not run an HTTP server.

---

## 🌱 Database Seeding

The shared package includes a development database seeding script:

```text
prisma/seed.ts
```

It initializes sample data for the e-commerce platform.

### Seeded Categories

The script defines six categories:

| Category               |
| ---------------------- |
| Electronics            |
| Clothing               |
| Home & Kitchen         |
| Sports & Outdoors      |
| Books                  |
| Beauty & Personal Care |

### Seeded Products

The script includes 23 predefined products across those categories.

Each product includes a name, emoji, description, price, available stock, and category association.

Products are created if missing or updated when an existing product with the same name is found.

### Demo Users

The seed script creates two administrator accounts and two regular user accounts.

Passwords are hashed using bcrypt with 10 salt rounds.

**Security:** The seed script uses fixed development credentials. These accounts must not be created in a public or production database without replacing their credentials and reviewing their access.

### Sample Orders

When the database contains no orders, the seed script creates three sample orders for demonstration.

These represent different order states, including delivered, shipping, and packaging stages.

If any order already exists, sample order creation is skipped.

### Running the Seed

From the monorepo root:

```bash
npm run db:seed --workspace=@ecommerce/shared
```

The seed script reads the root `.env` file using a relative path from the shared Prisma directory.

### Seed Behavior

Category records are created using Prisma upserts.

User records are created or updated using email-based upserts.

Product records are matched by name and updated or created.

Running the seed again updates predefined product prices and stock quantities to their seeded values, which may overwrite changes made during development.

---

## ⚙️ Environment Variables

The shared package does not maintain one universal environment schema for all services.

Its Prisma schema and seed script use database environment variables.

| Variable       | Required For            | Description                                      |
| -------------- | ----------------------- | ------------------------------------------------ |
| `DATABASE_URL` | Prisma datasource       | PostgreSQL connection URL                        |
| `DIRECT_URL`   | Prisma datasource       | Direct PostgreSQL connection URL                 |
| `NODE_ENV`     | Prisma client lifecycle | Distinguishes production from other environments |

Example development configuration:

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/kafkashop
DIRECT_URL=postgresql://postgres:password@localhost:5432/kafkashop

NODE_ENV=development
```

Kafka broker addresses are supplied by individual services when creating Kafka clients.

Redis configuration is not part of this shared package.

---

## 💻 Getting Started

### Prerequisites

The package requires Node.js, npm, a PostgreSQL database, and access to the Kafka infrastructure for services that use Kafka utilities.

### Install Dependencies

From the monorepo root:

```bash
npm install
```

### Generate Prisma Client

```bash
npm run db:generate --workspace=@ecommerce/shared
```

This runs:

```bash
prisma generate
```

### Validate Prisma Schema

```bash
npm run db:validate --workspace=@ecommerce/shared
```

This runs:

```bash
prisma validate
```

### Build Shared Package

```bash
npm run build --workspace=@ecommerce/shared
```

The build command generates the Prisma client and compiles TypeScript into `dist`.

**Important:** Generating the Prisma client and compiling TypeScript do not create database tables or apply database migrations. Database migration management must be handled separately.

### Seed the Database

```bash
npm run db:seed --workspace=@ecommerce/shared
```

Use the seeding command only against an intended development or demonstration database.

## 📦 Package Exports

The root entry point re-exports Kafka utilities, HTTP middleware, database utilities, domain types, and Zod.

```typescript
export * from "./kafka";
export * from "./http";
export * from "./prisma";
export * from "./types";
export { z } from "zod";
```

### Common Imports

```typescript
import {
  prisma,
  Prisma,
  z,
  HttpError,
  validate,
  requireUser,
  requireRole,
  createKafkaProducer,
  createKafkaConsumer,
  TOPICS,
  publishToDLQ,
  withRetry,
  sleep,
  httpMetricsMiddleware,
  metricsHandler,
} from "@ecommerce/shared";
```

### Package Subpaths

The package manifest also declares subpaths for types, validation, Prisma, and Kafka.

```text
@ecommerce/shared
@ecommerce/shared/types
@ecommerce/shared/validation
@ecommerce/shared/prisma
@ecommerce/shared/kafka
```

The root entry point is the most straightforward import path for the shared functionality described here.

**Build compatibility note:** The current package manifest declares `"type": "commonjs"`, while `tsconfig.json` targets ES2022 modules. These settings should be aligned before relying on the compiled `dist` output in Node.js.

The manifest also declares a `./metrics` export pointing to `dist/metrics.js`, but the provided source tree places metrics under `src/kafka/metrics.ts`. That export should be corrected or backed by a corresponding compiled file.

---

## 🧪 Testing

The shared package contains tests for request validation, HTTP error handling, and TypeScript exports.

### Error Handler Tests

```text
test/error.handler.test.ts
```

Tests cover expected HTTP errors, malformed JSON bodies, unexpected errors, invalid status codes, and errors occurring after response headers have been sent.

### Validation Tests

```text
test/validation.test.ts
```

Tests cover parsed query values stored in `res.locals.query`, validation failure responses, and replacement of validated request body and parameter values.

### Export Type Checking

```text
test/exports.typecheck.ts
```

This file is intended to verify the package's exported TypeScript interfaces.

Some references in the provided type-check file do not match the current source declarations. For example, it references a `UserRole` export and a numeric user ID even though the shared authentication interface uses a string ID.

These mismatches should be corrected before including that file in a strict type-checking pipeline.

### Running Tests

The current `shared/package.json` does not define an `npm test` script.

The test files use Node.js's built-in test runner, but a dedicated TypeScript-compatible test command or script must be configured to execute them.

No test execution results are included in the provided source export.

---

## 🔒 Security Considerations

**Database Credentials:** Keep `DATABASE_URL` and `DIRECT_URL` private and restrict database privileges according to service requirements.

**Trusted User Headers:** Shared authentication middleware trusts identity headers. These headers must only be supplied by authenticated, trusted infrastructure.

**Role Authorization:** `requireRole` performs role comparison but does not independently verify JWT signatures.

**Input Validation:** Use the shared Zod middleware on every endpoint requiring structured input validation.

**Error Responses:** Unexpected errors are converted into generic HTTP `500` responses to avoid exposing internal error details.

**Kafka Payloads:** TypeScript event contracts provide compile-time guarantees only. Runtime validation is still necessary for messages received from Kafka.

**Dead-Letter Queues:** Dead-letter records can contain original message payloads. Avoid including secrets or unnecessary personal data in event messages.

**Monitoring:** Prometheus endpoints should be accessible only to trusted monitoring infrastructure.

**Demo Data:** Seeded accounts use fixed development credentials. Never use those credentials in a production environment.

---

## ⚠️ Production Considerations

### Kafka Reliability

The Kafka client factories configure connection retries and disable automatic topic creation.

Production infrastructure should provision topics explicitly and define suitable replication and retention policies.

### Message Processing

Retry helpers can improve resilience, but business operations must be designed for possible duplicate deliveries and partial failures.

### Database Connections

The Prisma singleton avoids unnecessary client creation during development, but each running service process still manages its own database connections.

Use appropriate connection pooling and database limits in production.

### Event Contract Evolution

Changes to shared event types affect multiple microservices.

Coordinate producer and consumer deployments when modifying event structures, and consider versioned schemas for incompatible changes.

### Metrics Labeling

The current HTTP metrics middleware derives the route label from `req.baseUrl` or `req.path`.

Applications with many dynamic paths may generate high-cardinality labels. Route normalization should be considered before large-scale monitoring.

### Package Build Configuration

Review the CommonJS package declaration, ES2022 TypeScript output, and exported subpaths before deploying compiled applications.

### Testing

Maintain automated validation, error handling, Kafka helper, and database integration tests to reduce regressions across dependent services.

---

## 🔗 Integration with Microservices

The shared package is used throughout KafkaShop's backend architecture.

| Service           | Shared Functionality                                           |
| ----------------- | -------------------------------------------------------------- |
| API Gateway       | HTTP utilities and common types                                |
| Auth Service      | Prisma, validation, authentication types, errors               |
| Order Service     | Prisma, Kafka producers/consumers, events, metrics, validation |
| Payment Service   | Kafka messaging, retry utilities, DLQ, metrics                 |
| Delivery Service  | Kafka messaging, delivery event contracts, metrics             |
| Product Service   | Prisma, validation, authorization, errors                      |
| Search Service    | Kafka event contracts, consumers, validation, authorization    |
| Analytics Service | Kafka events, topic constants, statistics types, metrics       |

The package provides common infrastructure while each service implements its own domain-specific behavior.

## 🧭 Navigation

**Project**

[← Back to Root](../README.md)

**Backend Services**

[API Gateway](../services/api-gateway/README.md) · [Auth Service](../services/auth-service/README.md) · [Order Service](../services/order-service/README.md) · [Payment Service](../services/payment-service/README.md) · [Delivery Service](../services/delivery-service/README.md) · [Product Service](../services/product-service/README.md) · [Search Service](../services/search-service/README.md) · [Analytics Service](../services/analytics-service/README.md)

**Frontend & Tools**

[Web Frontend](../web/README.md) · [Postman API Suite](../postman/README.md)

---

**`@ecommerce/shared`** — The foundation of KafkaShop's distributed architecture, providing consistent database access, Kafka communication, application contracts, validation, authorization, and observability across microservices.
