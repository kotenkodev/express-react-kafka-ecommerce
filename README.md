# 🛒 KafkaShop — Event-Driven E-Commerce Platform

A full-stack, microservices-based e-commerce platform built with **Node.js, TypeScript, React, Apache Kafka, PostgreSQL, Redis, Elasticsearch, and Docker**.

KafkaShop demonstrates an event-driven approach to e-commerce order processing. Customers can browse products, manage a shopping cart, place orders, and track their delivery status in real time. Administrators can manage the product catalog, monitor orders, search historical records, and explore business analytics.

The platform combines synchronous REST APIs for user-facing operations with asynchronous Kafka events for payment processing, delivery simulation, search indexing, and analytics.

At its core, KafkaShop separates business responsibilities into independent services while sharing database models, event contracts, and infrastructure utilities through the `@ecommerce/shared` workspace package.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Microservices](#-microservices)
- [Service Documentation](#-service-documentation)
- [Technology Stack](#-technology-stack)
- [Event-Driven Order Lifecycle](#-event-driven-order-lifecycle)
- [Kafka Topics](#-kafka-topics)
- [Frontend Application](#-frontend-application)
- [Authentication and Authorization](#-authentication-and-authorization)
- [API Overview](#-api-overview)
- [Database Architecture](#-database-architecture)
- [Search and Analytics](#-search-and-analytics)
- [Getting Started](#-getting-started)
- [Docker and Infrastructure](#-docker-and-infrastructure)
- [Monitoring and Observability](#-monitoring-and-observability)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Implementation Notes](#-implementation-notes)

## 🌟 Overview

KafkaShop is designed to illustrate how multiple backend services cooperate to process an e-commerce order without tightly coupling their business logic.

When a customer places an order, the Order Service validates inventory, creates the order in PostgreSQL, and publishes an event to Apache Kafka.

The Payment Service consumes this event and performs simulated payment processing. Successful payments trigger the Delivery Service, which publishes delivery status updates. Other services independently consume the resulting events to maintain search indexes, calculate analytics, and update the order's persisted state.

The React frontend provides a unified interface for these operations through the API Gateway.

### Platform Goals

KafkaShop demonstrates:

- Service-oriented backend design with clearly separated responsibilities.
- Event-driven communication through Apache Kafka.
- Transactional order creation and inventory management.
- Asynchronous payment and delivery workflows.
- Real-time user notifications with Server-Sent Events.
- JWT authentication and role-based authorization.
- Redis-backed idempotency for checkout requests.
- Elasticsearch-powered order search.
- Business analytics and Prometheus observability.
- Shared TypeScript contracts and infrastructure utilities.
- Container-oriented deployment architecture.

The payment and delivery components are simulations intended for development and demonstration. They do not process real payments or dispatch actual couriers.

## 🚀 Key Features

### 🛍️ Customer Features

- Account registration and login.
- Product catalog browsing and product detail pages.
- Product search by name, category, price range, and availability.
- Shopping cart with quantity and total calculations.
- Checkout with Redis-backed idempotency.
- Personal order history.
- Live order status notifications through SSE.
- Responsive React interface with reusable components.

### 🧑‍💼 Administrator Features

- View orders across users.
- Create, edit, and delete products.
- Manage catalog information, pricing, and stock quantities.
- Search indexed orders through Elasticsearch.
- Filter orders by lifecycle status.
- View aggregate order statistics.
- Explore analytics charts and operational metrics.
- Monitor application behavior using exposed Prometheus metrics.

### ⚙️ Backend Features

- REST API routing through a centralized API Gateway.
- Shared PostgreSQL database schema managed by Prisma.
- Kafka producers and consumers for asynchronous workflows.
- Payment retries and dead-letter queue support.
- Delivery event processing with timestamp-aware state transitions.
- Redis idempotency locks and cached checkout results.
- Role-based middleware and Zod request validation.
- Elasticsearch document upserts.
- Health and metrics endpoints.
- Graceful resource shutdown in applicable services.

## 🏗 System Architecture

KafkaShop uses a hybrid architecture: REST for direct client interactions and Kafka for asynchronous communication between business workflows.

```text
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │      KafkaShop      │
                         │                     │
                         │ Storefront / Admin  │
                         └──────────┬──────────┘
                                    │
                              HTTP / SSE
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     API Gateway     │
                         │      Port 8000      │
                         │                     │
                         │ JWT Verification    │
                         │ Request Proxying    │
                         │ Identity Forwarding │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
      │ Auth Service │      │Order Service │      │Product Svc   │
      │    :3006     │      │    :3001     │      │    :3007     │
      └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
             │                     │                     │
             ▼                     ▼                     ▼
           Redis              PostgreSQL             PostgreSQL
                                   │
                                   ▼
                           Kafka: orders
                                   │
                                   ▼
                          ┌────────────────┐
                          │Payment Service │
                          │     :3002      │
                          └────────┬───────┘
                                   │
                            Kafka: payments
                                   │
                                   ▼
                          ┌────────────────┐
                          │Delivery Service│
                          │     :3003      │
                          └────────┬───────┘
                                   │
                       Kafka: order.status.updated
                                   │
                                   ▼
                              Order Service
                                   │
                                   ▼
                         PostgreSQL + SSE
                                   │
                                   ▼
                             React Frontend

       ┌───────────────────────────────────────────────┐
       │            Additional Kafka Consumers         │
       │                                               │
       │ Search Service :3005 → Elasticsearch          │
       │ Analytics Service :3004 → Windowed Statistics │
       └───────────────────────────────────────────────┘
```

The Search and Analytics Services consume relevant Kafka events independently of the payment and delivery workflow.

The architecture supports eventual consistency between the transactional database, Elasticsearch index, analytics read models, and connected frontend clients.

## 🧩 Microservices

KafkaShop separates business functionality into eight backend services.

| Service               |   Port | Responsibility                                                           |
| --------------------- | -----: | ------------------------------------------------------------------------ |
| **API Gateway**       | `8000` | Central API entry point, JWT verification, request routing, SSE proxying |
| **Auth Service**      | `3006` | User registration, login, JWT authentication, refresh sessions           |
| **Order Service**     | `3001` | Order creation, inventory updates, status persistence, SSE               |
| **Payment Service**   | `3002` | Simulated payment processing, retries, failure handling                  |
| **Delivery Service**  | `3003` | Simulated courier assignment and delivery lifecycle                      |
| **Analytics Service** | `3004` | Event-based operational analytics and metrics                            |
| **Search Service**    | `3005` | Elasticsearch indexing, order search, aggregations                       |
| **Product Service**   | `3007` | Product catalog, filtering, categories, admin CRUD                       |

The platform also contains the reusable `@ecommerce/shared` package and React frontend.

### API Gateway

The API Gateway is the primary HTTP entry point for frontend clients.

It forwards requests to the appropriate backend services, verifies JWT access tokens on protected routes, and provides trusted user identity to downstream services.

It also proxies the SSE endpoint used for live order updates.

### Auth Service

The Auth Service manages user accounts and authentication.

It uses PostgreSQL and Prisma for account data, JWT for access tokens, and Redis-backed refresh-session management.

Users are assigned either the `user` or `admin` role.

### Order Service

The Order Service creates and retrieves orders.

During checkout, it validates requested products, checks inventory, decrements stock within a Prisma transaction, and creates the order and its items.

After database persistence, it publishes an order creation event to Kafka.

The service also consumes payment and delivery events, updates order state, and broadcasts changes through SSE.

Redis-backed idempotency helps prevent duplicate orders when clients retry checkout requests with the same key.

### Payment Service

The Payment Service is an asynchronous Kafka worker.

It consumes newly created orders and simulates payment processing with approximately 1–3 seconds of latency and an 80% success probability per attempt.

The worker allows up to three payment attempts and uses increasing delays between unsuccessful attempts.

After retry exhaustion, it publishes the original order to a dead-letter queue and publishes the final failed payment outcome.

### Delivery Service

The Delivery Service listens for successful payment events.

It randomly selects a courier from a predefined list and publishes these delivery stages:

```text
PREPARING → SHIPPED → DELIVERED
```

There is a five-second delay between consecutive stages.

The service simulates delivery rather than integrating with an external courier provider.

### Analytics Service

The Analytics Service processes Kafka events to produce short-window operational statistics.

Its purpose is to provide visibility into order volume, payment outcomes, revenue-related values, and processing activity.

The web frontend consumes its analytics API to display live dashboard metrics.

### Search Service

The Search Service maintains an Elasticsearch index of orders.

It consumes order creation, payment, delivery, and order failure events and updates searchable documents using Elasticsearch upserts.

Its administrator-only API supports full-text search, filtering, pagination, individual order retrieval, and aggregate statistics.

### Product Service

The Product Service provides the catalog API.

It supports product listing, keyword search, category and price filtering, stock filtering, and paginated results.

Product creation, updates, and deletion are restricted to administrators through shared role-based middleware.

## 📚 Service Documentation

Each component includes its own README with detailed architecture, API documentation, configuration, development instructions, and implementation considerations.

### Backend Services

| Component            | Documentation                                                    |
| -------------------- | ---------------------------------------------------------------- |
| 🚪 API Gateway       | [API Gateway README](services/api-gateway/README.md)             |
| 🔐 Auth Service      | [Auth Service README](services/auth-service/README.md)           |
| 🛒 Order Service     | [Order Service README](services/order-service/README.md)         |
| 💳 Payment Service   | [Payment Service README](services/payment-service/README.md)     |
| 🚚 Delivery Service  | [Delivery Service README](services/delivery-service/README.md)   |
| 📊 Analytics Service | [Analytics Service README](services/analytics-service/README.md) |
| 🔎 Search Service    | [Search Service README](services/search-service/README.md)       |
| 📦 Product Service   | [Product Service README](services/product-service/README.md)     |

### Shared Packages, Frontend & Tools

| Component            | Documentation                             |
| -------------------- | ----------------------------------------- |
| 🧩 Shared Package    | [Shared Package README](shared/README.md) |
| 🖥️ Web Frontend      | [Web Frontend README](web/README.md)      |
| 🧪 Postman API Suite | [Postman README](postman/README.md)       |

These relative links are intended to work directly from this root README in GitHub.

## 🛠 Technology Stack

### Backend

| Technology   | Usage                                       |
| ------------ | ------------------------------------------- |
| Node.js 20   | Backend runtime                             |
| TypeScript   | Service implementation and shared contracts |
| Express.js 5 | REST APIs and operational HTTP endpoints    |
| PostgreSQL   | Primary relational database                 |
| Prisma ORM 5 | Database modeling and persistence           |
| Apache Kafka | Asynchronous service communication          |
| KafkaJS      | Kafka producer and consumer clients         |
| Redis        | Refresh sessions and order idempotency      |
| ioredis      | Redis client                                |
| Zod          | Runtime validation                          |
| better-sse   | Order notification streams                  |

### Frontend

| Technology     | Usage                        |
| -------------- | ---------------------------- |
| React          | User interface               |
| TypeScript     | Frontend type safety         |
| React Router   | Routing and access guards    |
| Zustand        | Client-side state management |
| TanStack Query | API caching and server state |
| Axios          | HTTP API client              |
| Tailwind CSS   | Responsive styling           |
| Recharts       | Analytics visualization      |
| Lucide React   | Icons                        |
| Sonner         | Toast notifications          |

### Infrastructure & Observability

| Technology     | Usage                                           |
| -------------- | ----------------------------------------------- |
| Docker         | Service containerization                        |
| Docker Compose | Multi-container orchestration, where configured |
| Elasticsearch  | Search index and document retrieval             |
| Prometheus     | Metrics collection                              |
| prom-client    | Metrics instrumentation                         |
| Grafana        | Metrics dashboard integration                   |
| Kibana         | Elasticsearch inspection and visualization      |

Infrastructure tools such as Grafana, Kibana, and Docker Compose are part of the documented deployment design. Their exact provisioned configuration should be checked against the root infrastructure files.

## 🔄 Event-Driven Order Lifecycle

The core KafkaShop workflow begins when a customer places an order.

### 1. Customer Creates an Order

The frontend sends a request to the Order Service through the API Gateway.

```http
POST /api/orders
```

Example request:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }
]
```

The Order Service validates product availability and creates the order using a database transaction.

It then publishes an `OrderCreated` event to the `orders` topic.

### 2. Payment Is Processed

The Payment Service consumes the event and simulates payment.

On success, it publishes a `PaymentProcessed` event with `SUCCESS` status to the `payments` topic.

If all three simulated attempts fail, it publishes a dead-letter message to `order.dlq`, followed by a failed payment event.

### 3. Order Payment State Is Updated

The Order Service consumes the payment event and updates the persisted order record.

A successful payment generally transitions the order from `PENDING` to `PAID`.

Failed payments can move eligible orders to `FAILED`.

The Order Service broadcasts the updated state to connected frontend clients.

### 4. Delivery Is Simulated

The Delivery Service consumes successful payment events and publishes a series of status updates.

```text
PREPARING
    │
    │ 5 seconds
    ▼
SHIPPED
    │
    │ 5 seconds
    ▼
DELIVERED
```

Each event includes the order ID, current delivery stage, courier, and timestamp.

### 5. Search Documents Are Updated

The Search Service independently consumes relevant Kafka events and maintains an Elasticsearch document for each order.

This enables administrators to search orders without running full-text queries against the transactional database.

### 6. Analytics Are Updated

The Analytics Service processes relevant Kafka events and updates its operational metrics.

The frontend periodically refreshes the analytics dashboard to present current statistics.

### 7. The Customer Receives Live Updates

The Order Service broadcasts payment and delivery changes through SSE.

The React frontend receives these notifications and updates local order state without requiring continuous full-page refreshes.

## 📨 Kafka Topics

Kafka topic names are centrally defined in `shared/src/types/topics.ts`.

| Topic                  | Publisher / Source                        | Main Consumers                     |
| ---------------------- | ----------------------------------------- | ---------------------------------- |
| `orders`               | Order Service                             | Payment, Search, Analytics         |
| `payments`             | Payment Service                           | Order, Delivery, Search, Analytics |
| `order.status.updated` | Delivery Service                          | Order, Search, Analytics           |
| `order.dlq`            | Payment Service through shared DLQ helper | Order, Search                      |
| `order.stats`          | Defined in shared topic registry          | Depends on analytics integration   |

### Event Contracts

Common event types live in:

```text
shared/src/types/events.ts
```

**OrderCreated**

```typescript
type OrderCreated = {
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

**PaymentProcessed**

```typescript
type PaymentProcessed = {
  paymentId: string;
  orderId: string;
  status: "SUCCESS" | "FAILED";
  processedAt: string;
  failureReason: string | null;
};
```

**OrderStatusUpdated**

```typescript
type OrderStatusUpdated = {
  orderId: string;
  status: "PREPARING" | "SHIPPED" | "DELIVERED";
  courier: string;
  updatedAt: string;
};
```

**DeadLetterMessage**

```typescript
type DeadLetterMessage<T> = {
  originalMessage: T;
  error: string;
  retryCount: number;
  failedAt: string;
};
```

The actual shared DLQ topic is `order.dlq`, rather than the `orders.DLQ` name used in an earlier project specification.

Similarly, the shared statistics topic constant is `order.stats`, not `order-stats`.

These topic constants should be used when developing new producers and consumers.

## 🖥️ Frontend Application

KafkaShop includes a React frontend with customer and administrator experiences.

### Customer Pages

| Route             | Purpose                      |
| ----------------- | ---------------------------- |
| `/`               | Main storefront              |
| `/login`          | User authentication          |
| `/register`       | Account registration         |
| `/product-search` | Product search and filtering |
| `/products/:id`   | Product details              |
| `/orders`         | Personal order history       |

### Administrator Pages

| Route        | Purpose                        |
| ------------ | ------------------------------ |
| `/orders`    | View orders across users       |
| `/analytics` | Analytics dashboard            |
| `/search`    | Elasticsearch order search     |
| `/products`  | Product catalog administration |

### Frontend State Management

Zustand manages persistent client-side state, including authentication and the shopping cart.

TanStack Query manages server data, caching, pagination, and background refetching.

The storefront uses paginated product requests, while the analytics dashboard periodically refreshes metrics.

### Real-Time Order Tracking

The frontend uses the browser's `EventSource` API to subscribe to order events.

The backend emits the following SSE event names:

```text
order_update
order.status.updated
```

The active SSE controller filters broadcasts so ordinary users receive only their own order updates, while administrators can receive updates for all orders.

For the complete frontend architecture, see [Web Frontend README](web/README.md).

## 🔐 Authentication and Authorization

KafkaShop uses JWT-based authentication with two user roles:

| Role    | Access                                                                    |
| ------- | ------------------------------------------------------------------------- |
| `user`  | Storefront, product search, shopping cart, checkout, own orders           |
| `admin` | Platform-wide orders, analytics, Elasticsearch search, product management |

The Auth Service manages account authentication and refresh sessions.

The API Gateway verifies access tokens and forwards trusted identity information to downstream services through internal headers.

### Shared Identity Headers

The shared authentication middleware recognizes:

```text
x-user-id
x-user-role
x-user-email
```

Backend services use `requireUser` and `requireRole` middleware to authorize access.

### Security Boundaries

Frontend route guards improve navigation but are not a substitute for backend authorization.

Because downstream services trust identity headers, they should not be publicly accessible in a configuration that permits external clients to forge those headers.

The frontend stores its access token in persisted Zustand state. Its SSE integration also passes a token in a URL query parameter, so production environments should review token storage, log redaction, and SSE authentication carefully.

## 📡 API Overview

The API Gateway provides a unified `/api` namespace.

| Method   | Endpoint                   | Purpose                          |
| -------- | -------------------------- | -------------------------------- |
| `POST`   | `/api/auth/register`       | Register a new account           |
| `POST`   | `/api/auth/login`          | Authenticate a user              |
| `POST`   | `/api/auth/refresh`        | Refresh authentication           |
| `POST`   | `/api/auth/logout`         | Logout                           |
| `GET`    | `/api/auth/me`             | Retrieve current user            |
| `POST`   | `/api/orders`              | Create an order                  |
| `GET`    | `/api/orders`              | List accessible orders           |
| `GET`    | `/api/orders/:id`          | Retrieve an order                |
| `GET`    | `/api/events`              | Subscribe to SSE updates         |
| `GET`    | `/api/products`            | Browse and filter products       |
| `GET`    | `/api/products/categories` | List categories                  |
| `GET`    | `/api/products/:id`        | Retrieve product details         |
| `POST`   | `/api/products`            | Create product — admin           |
| `PUT`    | `/api/products/:id`        | Update product — admin           |
| `DELETE` | `/api/products/:id`        | Delete product — admin           |
| `GET`    | `/api/search`              | Search indexed orders — admin    |
| `GET`    | `/api/search/orders/:id`   | Retrieve indexed order — admin   |
| `GET`    | `/api/search/stats`        | Indexed order statistics — admin |
| `GET`    | `/api/analytics`           | Operational analytics — admin    |

The full HTTP contracts, request validation rules, and response structures are described in the individual service READMEs.

### Example: Browse Products

```bash
curl "http://localhost:8000/api/products?category=Electronics&inStock=true&page=1&limit=20"
```

### Example: Create an Order

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: checkout-123" \
  -d '[
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2
    }
  ]'
```

### Example: Search Orders

```bash
curl "http://localhost:8000/api/search?status=SHIPPED&page=1&limit=10" \
  -H "Authorization: Bearer <admin_access_token>"
```

## 🗄 Database Architecture

KafkaShop uses PostgreSQL with Prisma ORM.

The shared database schema is maintained in:

```text
shared/prisma/schema.prisma
```

### Core Models

| Model       | Responsibility                          |
| ----------- | --------------------------------------- |
| `User`      | Accounts, password hashes, roles        |
| `Category`  | Catalog categories                      |
| `Product`   | Product information, pricing, inventory |
| `Order`     | Orders, payment state, delivery state   |
| `OrderItem` | Individual products within orders       |

### Entity Relationships

```text
User ────────────< Order
                      │
                      │
                      ▼
                   OrderItem >──────────── Product
                                           │
                                           ▼
                                         Category
```

A user can have multiple orders.

Each order contains one or more order items. Each order item references a product, and every product belongs to a category.

### Database Integrity

The Order Service uses Prisma transactions and conditional stock updates to manage inventory during checkout.

The schema also defines a unique constraint on `(orderId, productId)` in `OrderItem`, preventing duplicate product references inside the same persisted order.

Order and product prices are represented using Prisma Decimal fields to preserve monetary precision in database storage.

## 🔎 Search and Analytics

KafkaShop separates transactional order processing from search and analytical workloads.

### Elasticsearch Search

The Search Service maintains a dedicated `orders` index.

Its API supports:

- Full-text searching across selected order fields.
- Order status filtering.
- Pagination.
- Individual order lookup.
- Total indexed order count.
- Sum of indexed order amounts.
- Average indexed order amount.

Elasticsearch documents are updated asynchronously, so search results may temporarily lag behind the primary database.

### Real-Time Analytics

The Analytics Service processes Kafka events and exposes operational business metrics.

The frontend analytics dashboard combines short-window operational data with historical aggregates from the Search Service.

**Important:** The Search Service's `totalRevenue` aggregation sums indexed order amounts without filtering for successfully paid orders. It should therefore be interpreted as an aggregate order value rather than guaranteed settled revenue.

## ⚙️ Getting Started

The repository uses npm workspaces to share packages and manage service dependencies.

### Prerequisites

For a local development setup, install:

- Node.js 20 or later and npm.
- Docker and Docker Compose, if using containerized infrastructure.
- PostgreSQL.
- Redis.
- Apache Kafka.
- Elasticsearch.

A complete container-based setup can simplify infrastructure management when the repository's Compose configuration is available.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create or configure the root `.env` file according to the repository's deployment configuration.

Example database variables used by the shared Prisma schema:

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/kafkashop
DIRECT_URL=postgresql://postgres:password@localhost:5432/kafkashop
```

Services also use configuration such as:

```dotenv
KAFKA_BROKERS=localhost:9092
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
```

These examples use local development addresses. Within Docker Compose, services typically need internal service hostnames rather than `localhost`.

Authentication secrets and service-specific settings must be configured according to their respective service READMEs.

Do not commit real credentials or production `.env` files to source control.

### 4. Prepare the Database

Generate the shared Prisma client:

```bash
npm run db:generate --workspace=@ecommerce/shared
```

Validate the schema:

```bash
npm run db:validate --workspace=@ecommerce/shared
```

Build the shared package:

```bash
npm run build --workspace=@ecommerce/shared
```

Database generation does not apply schema migrations. Ensure the database schema has been migrated using the project's migration workflow before running the application.

### 5. Seed Development Data

The shared package includes a seed script:

```bash
npm run db:seed --workspace=@ecommerce/shared
```

It populates development categories, products, demo users, and sample orders where applicable.

**Warning:** The seed script contains fixed demonstration accounts and resets the predefined products' stock and pricing when run again. Use it only against an intended development database.

### 6. Start Backend Services

Once the required infrastructure and shared package are ready, services can be started through their npm workspace scripts.

Examples:

```bash
npm run dev --workspace=auth-service
npm run dev --workspace=product-service
npm run dev --workspace=order-service
npm run dev --workspace=payment-service
npm run dev --workspace=delivery-service
npm run dev --workspace=search-service
npm run dev --workspace=analytics-service
npm run dev --workspace=api-gateway
```

Run each long-lived service in its own terminal or use the repository's orchestration configuration.

Services requiring Kafka must connect to a broker with their subscribed topics available.

### 7. Start the Web Frontend

Configure the frontend's API URL:

```dotenv
VITE_API_URL=http://localhost:8000
```

From the frontend workspace:

```bash
cd web
npm run dev
```

The frontend's exact script and development port should be verified against its package manifest, which was not included in the provided source subset.

## 🐳 Docker and Infrastructure

The microservice repositories include Dockerfiles for their individual services.

The original project specification describes a Docker Compose deployment containing the following infrastructure and application components:

| Component     | Typical Port | Purpose                                               |
| ------------- | -----------: | ----------------------------------------------------- |
| PostgreSQL    |       `5432` | Primary database                                      |
| Redis         |       `6379` | Refresh sessions and idempotency                      |
| Apache Kafka  |       `9092` | Event streaming                                       |
| ZooKeeper     |       `2181` | Kafka coordination in the specified deployment design |
| Kafka UI      |       `8080` | Kafka inspection                                      |
| Elasticsearch |       `9200` | Indexed order search                                  |
| Kibana        |       `5601` | Elasticsearch visualization                           |
| Prometheus    |       `9090` | Metrics collection                                    |
| Grafana       |       `3000` | Monitoring dashboards                                 |
| API Gateway   |       `8000` | Public backend API                                    |
| Web Frontend  |         `80` | Containerized frontend in the deployment design       |

The actual root `compose.yaml` or `docker-compose.yml` was not included in the source provided for this README, so the complete container list, health checks, volumes, and dependency configuration cannot be independently verified here.

### Compose Workflow

When using the root Compose configuration described in the project design:

```bash
docker compose up --build -d
```

Inspect running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop the stack:

```bash
docker compose down
```

Use `docker compose down -v` only when intentionally deleting managed volumes, because it may remove database and other persistent data.

### Dockerfile Notes

The supplied backend Dockerfiles use Node.js 20 Alpine and install workspace dependencies from the monorepo root.

Several currently start services with:

```dockerfile
CMD ["npm", "run", "dev"]
```

This is suitable for development-oriented images. Production builds should use compiled JavaScript, appropriately configured runtime dependencies, and verified startup commands.

## 📈 Monitoring and Observability

KafkaShop exposes operational metrics through the shared `@ecommerce/shared` package.

Most backend services register HTTP metrics middleware and expose a `/metrics` endpoint.

### Prometheus Metrics

| Metric                              | Type      | Description                            |
| ----------------------------------- | --------- | -------------------------------------- |
| `kafka_messages_produced_total`     | Counter   | Produced Kafka messages                |
| `kafka_messages_consumed_total`     | Counter   | Consumed Kafka messages                |
| `kafka_consumer_errors_total`       | Counter   | Kafka consumer processing errors       |
| `payment_success_total`             | Counter   | Published successful payment outcomes  |
| `payment_failure_total`             | Counter   | Published failed payment outcomes      |
| `order_processing_duration_seconds` | Histogram | Order processing duration observations |
| `http_requests_total`               | Counter   | Completed HTTP requests                |

The shared package also registers default Node.js process metrics through `prom-client`.

Example:

```bash
curl http://localhost:3001/metrics
```

The `/metrics` endpoint belongs to the service being queried, not the shared package itself.

### Health Checks

Individual services expose health endpoints, generally using:

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "service": "order-service"
}
```

These endpoints confirm that the service's HTTP server responds. They should not automatically be treated as full readiness checks for database, Kafka, Redis, or Elasticsearch dependencies.

### Monitoring Dashboard

The documented infrastructure design includes Prometheus and Grafana.

Prometheus can scrape the service metrics endpoints, while Grafana can visualize HTTP traffic, Kafka throughput, payment outcomes, and processing metrics.

Exact scraping intervals and dashboard configurations should be checked in the actual monitoring configuration files.

## 📂 Project Structure

The repository is organized as a TypeScript monorepo with independent services, a shared package, frontend, and supporting infrastructure.

```text
kafkashop/
├── services/
│   ├── api-gateway/
│   │   └── README.md
│   │
│   ├── auth-service/
│   │   └── README.md
│   │
│   ├── order-service/
│   │   └── README.md
│   │
│   ├── payment-service/
│   │   └── README.md
│   │
│   ├── delivery-service/
│   │   └── README.md
│   │
│   ├── analytics-service/
│   │   └── README.md
│   │
│   ├── search-service/
│   │   └── README.md
│   │
│   └── product-service/
│       └── README.md
│
├── shared/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── http/
│   │   ├── kafka/
│   │   ├── types/
│   │   ├── index.ts
│   │   └── prisma.ts
│   │
│   ├── test/
│   ├── package.json
│   └── README.md
│
├── web/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── router.tsx
│   │
│   └── README.md
│
├── postman/
│   └── README.md
│
├── package.json
└── README.md
```

The structure focuses on the directories and files identified through the supplied component source and README links. Root deployment files were not included in the provided source dumps.

## 🧪 Testing

The shared package contains tests for HTTP validation and error handling.

Examples include:

```text
shared/test/error.handler.test.ts
shared/test/validation.test.ts
shared/test/exports.typecheck.ts
```

These tests cover:

- Handling expected HTTP errors.
- Returning safe responses for malformed JSON.
- Hiding unexpected internal errors.
- Preserving Express 5 query parameter behavior.
- Returning validation errors before controllers run.
- Validating shared TypeScript exports.

The provided shared package does not define an `npm test` script. A TypeScript-compatible test runner configuration is needed before executing its test files as part of an automated test workflow.

### API Testing

The repository includes a dedicated Postman documentation path:

[Postman API Suite](postman/README.md)

Use the Postman resources to inspect and exercise the platform's HTTP endpoints where the collection files are available.

### Recommended Integration Checks

For end-to-end verification, cover the complete order lifecycle: register or authenticate a user, retrieve products, create an order, confirm Kafka payment processing, observe delivery status changes, and verify the resulting search index and analytics data.

Also test duplicate checkout requests, stock conflicts, unauthorized administrative requests, and failed payment events.

## ⚠️ Implementation Notes

KafkaShop is an event-driven demonstration platform with several deliberate simplifications and areas where production hardening would be beneficial.

**Payment Processing:** Payments are randomized simulations rather than real payment provider integrations.

**Delivery Processing:** Courier assignment and delivery stages are simulated. They do not represent actual logistics.

**Kafka Delivery Guarantees:** Kafka messages can be replayed or processed more than once. Consumers should be designed to handle duplicates safely.

**Order Creation Consistency:** The Order Service commits the database order before publishing its Kafka event. A transactional outbox would reduce the risk of persisted orders whose events are not published.

**Event Ordering:** The Order Service applies timestamp-aware delivery transitions, but the Search Service's Elasticsearch upserts do not currently prevent older events from overwriting newer indexed values.

**Consumer Recovery:** Some consumers catch and log processing failures inside their Kafka handlers. Those failures may not automatically trigger Kafka-level retries.

**SSE Scaling:** Order notifications are broadcast through an in-memory channel. Additional coordination would be required to guarantee consistent notifications across multiple Order Service instances.

**Database Ownership:** Several services share the same Prisma schema and database infrastructure. This simplifies the project but differs from strict database-per-service isolation.

**Security:** Internal identity headers must only be trusted when forwarded by authorized infrastructure. Access tokens and refresh sessions require appropriate secret management and transport security.

**Monitoring:** Prometheus metrics are available, but exposed metrics endpoints should be restricted in production.

**Deployment Verification:** The original technical specification describes Docker Compose, GitHub Actions, and EC2 deployment. The supplied source dumps confirm individual Dockerfiles but do not include the root Compose or GitHub Actions workflow, so those deployment details are not presented as verified runtime behavior.

## 🎯 What This Project Demonstrates

KafkaShop brings together several important distributed-system concepts in one application:

- REST APIs combined with asynchronous event streaming.
- Domain-specific microservices.
- Distributed order lifecycle orchestration.
- Transactional database updates.
- Idempotent client requests.
- Retry and dead-letter queue patterns.
- Eventual consistency and search read models.
- Real-time frontend notifications.
- Role-based security.
- Shared infrastructure packages.
- Containerized service architecture.
- Operational metrics and observability.

It is designed as a practical platform for exploring how independent services collaborate to support a complete e-commerce experience.

## 🧭 Quick Navigation

### Backend

[🚪 API Gateway](services/api-gateway/README.md) · [🔐 Auth Service](services/auth-service/README.md) · [🛒 Order Service](services/order-service/README.md) · [💳 Payment Service](services/payment-service/README.md)

[🚚 Delivery Service](services/delivery-service/README.md) · [📊 Analytics Service](services/analytics-service/README.md) · [🔎 Search Service](services/search-service/README.md) · [📦 Product Service](services/product-service/README.md)

### Frontend, Shared Code & Tools

[🖥️ Web Frontend](web/README.md) · [🧩 Shared Package](shared/README.md) · [🧪 Postman API Suite](postman/README.md)

---

**KafkaShop** — A full-stack, event-driven e-commerce platform demonstrating Kafka-powered microservices, transactional order processing, real-time delivery tracking, Elasticsearch search, and React-based administration.
