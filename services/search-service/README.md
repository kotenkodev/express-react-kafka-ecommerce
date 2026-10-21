# 🔎 Search Service

An event-driven search and indexing microservice built with **Node.js, TypeScript, Express.js, Apache Kafka, and Elasticsearch** for a distributed e-commerce platform.

The Search Service provides centralized order searching, filtering, and statistical aggregation. It consumes order, payment, and delivery events through Kafka and maintains searchable Elasticsearch documents that reflect the lifecycle of orders across the platform.

The service exposes an administrator-protected REST API for searching indexed orders, retrieving order details, and generating aggregated statistics without querying the primary transactional database.

## 🚀 Key Features

- **Event-Driven Indexing** — Automatically indexes order creation, payment, delivery, and dead-letter queue events from Kafka.
- **Elasticsearch Integration** — Stores searchable order documents in a dedicated Elasticsearch index.
- **Full-Text Search** — Supports multi-field searching with fuzzy matching and relevance scoring.
- **Advanced Filtering** — Filters orders by lifecycle status.
- **Pagination** — Provides paginated search results with configurable page sizes.
- **Automatic Index Initialization** — Creates the `orders` Elasticsearch index with explicit field mappings if it does not already exist.
- **Document Upserts** — Creates or updates indexed order documents as Kafka events arrive.
- **Order Statistics** — Calculates total indexed orders, aggregate order amounts, and average order value using Elasticsearch aggregations.
- **Role-Based Access Control** — Restricts search endpoints to authenticated administrators.
- **Request Validation** — Validates query parameters and order identifiers using Zod.
- **Prometheus Monitoring** — Exposes HTTP and Kafka consumer metrics.
- **Graceful Shutdown** — Disconnects Kafka, Elasticsearch, and the HTTP server during termination.
- **Docker Support** — Supports containerized execution using Node.js 20 Alpine.

## 🛠 Tech Stack

| Technology             | Purpose                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| Node.js 20             | JavaScript runtime                                                             |
| TypeScript             | Type-safe application development                                              |
| Express.js 5           | REST API and HTTP server                                                       |
| Apache Kafka           | Asynchronous event streaming                                                   |
| KafkaJS                | Kafka consumer                                                                 |
| Elasticsearch 8 client | Search indexing and querying                                                   |
| Zod                    | Request and environment validation                                             |
| Prometheus             | HTTP and Kafka monitoring                                                      |
| Docker                 | Containerization                                                               |
| @ecommerce/shared      | Shared event types, Kafka utilities, validation, authorization, and monitoring |

## 🏗 Architecture

The Search Service maintains an Elasticsearch-backed read model of order activity.

Other microservices publish domain events to Kafka, and the Search Service consumes those events to update searchable order documents.

```text
                    ┌────────────────────┐
                    │    Order Service   │
                    └─────────┬──────────┘
                              │
                         Kafka: orders
                              │
           ┌──────────────────┤
           │                  │
           ▼                  ▼
  ┌─────────────────┐  ┌─────────────────┐
  │ Payment Service │  │ Delivery Service│
  └────────┬────────┘  └────────┬────────┘
           │                    │
           ▼                    ▼
     Kafka: payments     Kafka: order.status.updated
           │                    │
           └──────────┬─────────┘
                      │
             Kafka Event Stream
                      │
                      ▼
             ┌───────────────────┐
             │   Search Service  │
             │     Port 3005     │
             │                   │
             │ • Kafka Consumer  │
             │ • Event Indexer   │
             │ • Search Engine   │
             │ • Aggregations    │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │   Elasticsearch   │
             │  Index: orders    │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │   Search REST API │
             │  Admin Protected  │
             └─────────┬─────────┘
                       │
                       ▼
                 API Gateway
                       │
                       ▼
              Admin Dashboard
```

The Search Service uses Elasticsearch as a dedicated read model. It does not directly modify transactional order records stored in the platform's primary database.

## 🔄 Event Indexing Flow

The service reacts to Kafka events and updates Elasticsearch documents according to the event type.

```text
         Kafka Event Received
                  │
                  ▼
           Identify Topic
                  │
         ┌────────┼──────────────┐
         │        │              │
         ▼        ▼              ▼
     Order      Payment      Delivery
     Created    Processed    Updated
         │        │              │
         ▼        ▼              ▼
     Set Order  Update       Update Status
     Details    Payment      and Courier
         │        │              │
         └────────┼──────────────┘
                  │
                  ▼
         Elasticsearch Upsert
                  │
                  ▼
          Searchable Document
                  │
                  ▼
           REST Search API
```

Incoming order failure events from `TOPICS.ORDER_DLQ` are also indexed and reflected in the searchable order state.

## 📨 Kafka Integration

The Search Service consumes events from four Kafka topics.

### Consumed Topics

| Topic                  | Event                | Purpose                             |
| ---------------------- | -------------------- | ----------------------------------- |
| `orders`               | `OrderCreated`       | Indexes newly created orders        |
| `payments`             | `PaymentProcessed`   | Updates payment information         |
| `order.status.updated` | `OrderStatusUpdated` | Updates delivery status and courier |
| `order.dlq`            | Dead-letter message  | Marks orders as payment failures    |

The consumer uses `search-service` as both its Kafka client ID and consumer group identifier.

It subscribes with `fromBeginning: true`, enabling a new consumer group to process retained events from their earliest available offsets.

### Order Creation Events

When an `OrderCreated` event is received, the service creates or updates an Elasticsearch document containing the order identifier, user identifier, items, total amount, and creation timestamp.

The initial indexed status is `PENDING`.

Example event:

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
  "createdAt": "2026-10-20T14:22:00.000Z"
}
```

### Payment Processing Events

When a payment event is received, the service updates the indexed payment status, processing timestamp, failure reason, and last update timestamp.

If the payment status is `FAILED`, the indexed order status is also set to `FAILED`.

For successful payments, the implementation updates `paymentStatus` to `SUCCESS` but does not explicitly change the document's general `status` to `PAID`.

### Delivery Status Events

Delivery events update the indexed order status, courier, and modification timestamp.

Example:

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SHIPPED",
  "courier": "Марія",
  "updatedAt": "2026-10-20T14:25:00.000Z"
}
```

### Dead-Letter Events

When an order failure event is received from `TOPICS.ORDER_DLQ`, the service indexes the order with:

```json
{
  "status": "payment_failed",
  "paymentStatus": "FAILED",
  "failureReason": "Payment failed after retries"
}
```

The implementation also records the order identifier and failure timestamp.

### Kafka Error Handling

The consumer increments a message consumption counter for incoming Kafka messages.

If an error occurs while parsing or indexing an event, it increments the Kafka consumer error counter and logs the failure.

Errors are caught inside the message handler, so the current implementation does not guarantee automatic retries of failed indexing operations.

## 🗂 Elasticsearch Integration

The service uses the official `@elastic/elasticsearch` client.

During startup, it checks whether the `orders` index exists.

If the index is missing, the service creates it with explicit field mappings. Existing indexes are reused without modifying their mappings.

### Elasticsearch Index

**Index name:** `orders`

| Field             | Elasticsearch Type | Description                  |
| ----------------- | ------------------ | ---------------------------- |
| `orderId`         | `keyword`          | Unique order identifier      |
| `userId`          | `keyword`          | User who created the order   |
| `status`          | `keyword`          | Current indexed order status |
| `courier`         | `text` + `keyword` | Courier name                 |
| `items.productId` | `keyword`          | Product identifier           |
| `items.quantity`  | `integer`          | Ordered quantity             |
| `items.price`     | `double`           | Product unit price           |
| `totalAmount`     | `double`           | Order total amount           |
| `paymentStatus`   | `keyword`          | Payment outcome              |
| `processedAt`     | `date`             | Payment processing timestamp |
| `failureReason`   | `text`             | Payment failure description  |
| `createdAt`       | `date`             | Order creation timestamp     |
| `updatedAt`       | `date`             | Last indexed event timestamp |

### Document Upserts

Events are indexed using Elasticsearch's update API with `doc_as_upsert: true`.

```typescript
await esClient.update({
  index: ORDERS_INDEX,
  id: event.orderId,
  doc,
  doc_as_upsert: true,
});
```

This allows an existing document to be updated or a new document to be created when it does not exist.

Each order uses its `orderId` as the Elasticsearch document ID, avoiding separate documents for repeated events with the same identifier.

The service does not currently enforce event timestamp ordering during upserts, so delayed or replayed events may overwrite newer document fields.

## 📡 REST API Reference

The Search Service registers routes under `/search`.

When accessed through the API Gateway, the public prefix is `/api/search`.

All search API routes require the `admin` role.

| Method | Gateway Endpoint         | Description                 | Authentication       |
| ------ | ------------------------ | --------------------------- | -------------------- |
| `GET`  | `/api/search`            | Search indexed orders       | Admin                |
| `GET`  | `/api/search/orders/:id` | Retrieve an indexed order   | Admin                |
| `GET`  | `/api/search/stats`      | Retrieve order aggregations | Admin                |
| `GET`  | `/health`                | Basic health check          | No                   |
| `GET`  | `/metrics`               | Prometheus metrics          | No, at service level |

### GET `/api/search`

Searches indexed orders using optional text queries, status filtering, and pagination.

Example:

```bash
curl "http://localhost:8000/api/search?query=SHIPPED&page=1&limit=10" \
  -H "Authorization: Bearer <admin_access_token>"
```

Example response:

```json
{
  "orders": [
    {
      "orderId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-uuid",
      "status": "SHIPPED",
      "courier": "Марія",
      "totalAmount": 99.98,
      "paymentStatus": "SUCCESS",
      "createdAt": "2026-10-20T14:22:00.000Z",
      "updatedAt": "2026-10-20T14:25:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Search Query Parameters

| Parameter | Type    | Default | Description                    |
| --------- | ------- | ------- | ------------------------------ |
| `query`   | string  | —       | Primary full-text search query |
| `q`       | string  | —       | Alternative search query       |
| `status`  | string  | —       | Exact order status filter      |
| `page`    | integer | `1`     | Page number                    |
| `limit`   | integer | `10`    | Results per page, maximum 100  |

When both `query` and `q` are provided, the service prioritizes `query` if it is truthy.

If neither search field is supplied, Elasticsearch uses a `match_all` query.

### Supported Status Filters

```text
PENDING
PAID
PREPARING
SHIPPED
DELIVERED
FAILED
payment_failed
```

Example filtering request:

```bash
curl "http://localhost:8000/api/search?status=DELIVERED&page=1&limit=20" \
  -H "Authorization: Bearer <admin_access_token>"
```

### GET `/api/search/orders/:id`

Retrieves a specific indexed order by UUID.

```bash
curl http://localhost:8000/api/search/orders/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin_access_token>"
```

The service looks up the Elasticsearch document using the order ID.

If no matching document exists, it returns HTTP `404 Not Found`.

Example error:

```json
{
  "error": "Order not found"
}
```

### GET `/api/search/stats`

Returns aggregated statistics calculated from indexed orders.

```bash
curl http://localhost:8000/api/search/stats \
  -H "Authorization: Bearer <admin_access_token>"
```

Example response:

```json
{
  "totalOrders": 150,
  "totalRevenue": 28450.75,
  "avgOrderAmount": 189.67
}
```

The statistics are calculated from the entire Elasticsearch `orders` index, rather than a sliding time window.

## 🔍 Full-Text Search

The Search Service uses Elasticsearch's `multi_match` query to search multiple order fields.

### Searchable Fields

| Field             | Boost   | Purpose                               |
| ----------------- | ------- | ------------------------------------- |
| `orderId`         | `3x`    | Prioritize matching order identifiers |
| `userId`          | Default | Search by user identifier             |
| `courier`         | `2x`    | Prioritize courier matches            |
| `items.productId` | Default | Search by product identifiers         |
| `status`          | Default | Search order statuses                 |

The current query configuration is:

```typescript
{
  multi_match: {
    query: queryString,
    fields: [
      "orderId^3",
      "userId",
      "courier^2",
      "items.productId",
      "status"
    ],
    type: "best_fields",
    fuzziness: "AUTO"
  }
}
```

The `best_fields` mode uses the best matching field to calculate relevance, while `AUTO` fuzziness enables approximate matches where supported by the field mappings.

Keyword fields such as `orderId`, `userId`, and `status` are not analyzed like full-text fields, so search behavior differs by field type.

### Result Sorting

When a text query is provided, results are sorted by relevance score in descending order.

Creation date is used as a secondary descending sort.

When no text query is provided, results are sorted by creation date.

## 📄 Pagination

The service implements offset-based pagination using Elasticsearch's `from` and `size` parameters.

```typescript
const from = (page - 1) * limit;
```

The default page size is 10, with a maximum of 100.

The service also requests accurate hit counts using `track_total_hits: true`.

Example pagination metadata:

```json
{
  "total": 245,
  "page": 2,
  "limit": 20,
  "totalPages": 13
}
```

For very large result sets, cursor-like Elasticsearch approaches such as `search_after` may be preferable to deep offset-based pagination.

## 📊 Search Aggregations

The Search Service uses Elasticsearch aggregations to calculate statistics across indexed orders.

### Total Orders

The total number of matching index documents is retrieved using Elasticsearch's total hit count.

### Total Revenue

Total revenue is calculated by summing the `totalAmount` field:

```typescript
totalRevenue: {
  sum: {
    field: "totalAmount",
  },
}
```

### Average Order Amount

The average indexed order value is calculated using:

```typescript
avgOrderAmount: {
  avg: {
    field: "totalAmount",
  },
}
```

Both monetary values are rounded to two decimal places in the API response.

**Important:** These aggregations include all indexed documents regardless of payment success or delivery status. `totalRevenue` therefore represents the sum of indexed order amounts, not necessarily completed or successfully paid revenue.

## 🔐 Authentication & Authorization

The Search Service is intended for administrative order search and reporting.

All routes registered under `/search` use:

```typescript
router.use(requireRole("admin"));
```

The API Gateway also requires JWT authentication and administrator authorization before forwarding requests to the Search Service.

### Access Control

| Operation                  | Guest | Regular User | Admin |
| -------------------------- | ----- | ------------ | ----- |
| Search orders              | No    | No           | Yes   |
| Filter orders              | No    | No           | Yes   |
| Retrieve indexed order     | No    | No           | Yes   |
| Retrieve search statistics | No    | No           | Yes   |

The Search Service relies on shared authentication and authorization utilities.

In production, access to internal services should be restricted to trusted infrastructure to prevent unauthorized clients from providing forged internal identity headers.

## ⚙️ Environment Variables

Environment configuration is loaded through `dotenv` and validated using Zod.

| Variable            | Default                 | Description                            |
| ------------------- | ----------------------- | -------------------------------------- |
| `NODE_ENV`          | `development`           | Application environment                |
| `PORT`              | `3005`                  | Express HTTP server port               |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch server URL               |
| `KAFKA_BROKERS`     | `localhost:9092`        | Comma-separated Kafka broker addresses |

### Example `.env`

```dotenv
NODE_ENV=development
PORT=3005

ELASTICSEARCH_URL=http://localhost:9200
KAFKA_BROKERS=localhost:9092
```

For multiple Kafka brokers:

```dotenv
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
```

The service splits Kafka broker addresses by commas and trims surrounding whitespace.

## 💻 Getting Started

### Prerequisites

The Search Service requires Node.js 20 or later, npm, Apache Kafka, Elasticsearch compatible with the installed Elasticsearch 8 client, and the internal `@ecommerce/shared` workspace package.

### Local Development

Install workspace dependencies from the monorepo root:

```bash
npm install
```

Ensure Kafka and Elasticsearch are running and reachable.

Configure the environment variables, then start the service:

```bash
npm run dev --workspace=search-service
```

Alternatively, from the service directory:

```bash
cd services/search-service
npm run dev
```

The development script uses `tsx watch` for automatic reloading.

On startup, the service initializes the Elasticsearch index, connects its Kafka consumer, subscribes to the configured topics, and starts the Express HTTP server.

The HTTP server listens on:

```text
http://localhost:3005
```

### Production Build

Compile TypeScript:

```bash
npm run build --workspace=search-service
```

Start the compiled application:

```bash
npm run start --workspace=search-service
```

The production script executes:

```bash
node dist/index.js
```

Ensure the shared workspace package is built and the compiled JavaScript module imports are compatible with the runtime environment.

### Docker

The repository provides a Dockerfile based on Node.js 20 Alpine.

Build the image from the **monorepo root**:

```bash
docker build \
  -f services/search-service/Dockerfile \
  -t search-service .
```

Run the container:

```bash
docker run -p 3005:3005 \
  -e ELASTICSEARCH_URL=http://host.docker.internal:9200 \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  search-service
```

Ensure Kafka and Elasticsearch are accessible from the container.

The Dockerfile currently launches `npm run dev`, making it development-oriented. Production deployments should use compiled output and the corresponding production startup script.

## 📂 Project Structure

```text
search-service/
├── src/
│   ├── config/
│   │   ├── elasticsearch.ts
│   │   └── env.ts
│   │
│   ├── consumers/
│   │   └── search.consumer.ts
│   │
│   ├── controllers/
│   │   └── search.controller.ts
│   │
│   ├── routes/
│   │   └── search.routes.ts
│   │
│   ├── schema/
│   │   ├── search-id.schema.ts
│   │   └── search-query.schema.ts
│   │
│   ├── services/
│   │   ├── indexer.service.ts
│   │   └── search.service.ts
│   │
│   └── index.ts
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

| File                                   | Responsibility                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/index.ts`                         | Application initialization, HTTP server, Elasticsearch and Kafka startup, graceful shutdown |
| `src/config/env.ts`                    | Environment configuration validation                                                        |
| `src/config/elasticsearch.ts`          | Elasticsearch client and index initialization                                               |
| `src/consumers/search.consumer.ts`     | Kafka event consumption and dispatch                                                        |
| `src/controllers/search.controller.ts` | HTTP request and response handling                                                          |
| `src/routes/search.routes.ts`          | Admin-protected search endpoints                                                            |
| `src/schema/search-query.schema.ts`    | Search query and pagination validation                                                      |
| `src/schema/search-id.schema.ts`       | UUID validation                                                                             |
| `src/services/indexer.service.ts`      | Elasticsearch document upserts                                                              |
| `src/services/search.service.ts`       | Search queries, order retrieval, and aggregations                                           |

## 📈 Monitoring & Observability

The Search Service integrates monitoring through the shared `@ecommerce/shared` package.

### HTTP Monitoring

The application registers `httpMetricsMiddleware` to collect HTTP request metrics.

Metrics are exposed through:

```text
GET http://localhost:3005/metrics
```

### Kafka Monitoring

| Metric Export           | Purpose                                |
| ----------------------- | -------------------------------------- |
| `kafkaMessagesConsumed` | Counts consumed Kafka messages         |
| `kafkaConsumerErrors`   | Counts Kafka event processing failures |

The consumer records metrics using the incoming topic and its `search-service` consumer group.

### Application Logging

The service logs Elasticsearch initialization, Kafka connectivity, indexing operations, startup errors, and shutdown events.

Example:

```text
[Search] Creating Elasticsearch index: orders
[Search] Index 'orders' created successfully
[Search] Search consumer connected to Kafka
[Search Indexer] Indexed OrderCreated: order-123
[Search Indexer] Indexed PaymentProcessed: order-123
[Search Indexer] Indexed OrderStatusUpdated: order-123 (SHIPPED)
Search service running on port 3005
```

## 🛑 Graceful Shutdown

The Search Service handles `SIGINT` and `SIGTERM` signals.

When shutdown begins, it stops the HTTP server, disconnects the Kafka consumer, and closes the Elasticsearch client.

A shutdown flag prevents duplicate cleanup attempts.

The service exits with code `0` after successful shutdown, or code `1` if cleanup fails.

## 🔒 Production Considerations

**Eventual Consistency:** Elasticsearch documents are updated asynchronously from Kafka events. Search results may temporarily differ from the transactional order database.

**Event Ordering:** The current indexer does not enforce timestamp-based versioning. Out-of-order or replayed events may overwrite more recent state.

**Document Upserts:** Using the order ID as the Elasticsearch document ID prevents duplicate documents for the same order, but does not guarantee that duplicate or stale events are ignored.

**Event Validation:** Kafka payloads are parsed as JSON and cast to TypeScript types without dedicated runtime schema validation. Stronger validation is recommended for production ingestion.

**Consumer Error Recovery:** Indexing errors are caught and logged within the Kafka message handler. A retry strategy or dead-letter mechanism for indexing failures would improve reliability.

**Search Mappings:** Exact-match identifiers and statuses use `keyword` mappings, which behave differently from analyzed text fields. Search queries should account for these differences.

**Index Synchronization:** The service creates the index when missing but does not automatically update existing mappings or rebuild stale documents.

**Search Statistics:** Aggregate amounts include indexed orders regardless of payment status, so they should not be interpreted as settled revenue.

**Authorization:** Search endpoints require the `admin` role. Direct access to the Search Service should be restricted to trusted internal infrastructure.

**Metrics Security:** The `/metrics` endpoint is registered without authentication and should be restricted to trusted monitoring systems.

**Container Deployment:** Production environments should use compiled builds rather than the development watch process.

## 📦 Shared Dependencies

The Search Service relies on the internal `@ecommerce/shared` package for reusable functionality across the e-commerce platform.

Shared functionality includes Kafka consumer factories, topic constants, domain event interfaces, Zod validation utilities, role-based authorization, HTTP error handling, and Prometheus instrumentation.

This promotes consistent event processing, security, and observability across microservices.

## 📝 Notes

The Search Service maintains a dedicated Elasticsearch read model built from Kafka events.

It does not directly own order creation, payment processing, or delivery workflows. These responsibilities remain with their respective domain services.

The service provides administrator-focused order search, filtered retrieval, and aggregate reporting, while the Analytics Service separately handles real-time sliding-window business metrics.

This separation enables the platform to support both historical indexed search and short-term operational analytics through specialized microservices.

---

**Search Service** — Event-driven Elasticsearch indexing, administrator search, and order analytics powered by Kafka, TypeScript, and Express.js.
