# 📦 Product Service

A product catalog management microservice built with **Node.js, TypeScript, Express.js, PostgreSQL, and Prisma ORM** for a distributed e-commerce platform.

The Product Service manages product information, categories, pricing, and inventory availability. It provides a REST API for browsing and filtering products, supports pagination and keyword search, and allows administrators to create, update, and delete products through role-protected endpoints.

The service integrates with the shared database infrastructure and exposes Prometheus-compatible metrics for operational monitoring.

## 🚀 Key Features

- **Product Catalog Management** — Provides CRUD operations for managing products.
- **Advanced Product Filtering** — Supports keyword search, category filtering, price ranges, and stock availability.
- **Case-Insensitive Search** — Searches product names and descriptions without case sensitivity.
- **Pagination** — Supports configurable page sizes with a maximum of 100 products per request.
- **Category Management Integration** — Associates products with existing categories and exposes a category listing endpoint.
- **Inventory Tracking** — Maintains product stock quantities for availability checks.
- **Role-Based Access Control** — Restricts product creation, modification, and deletion to administrators.
- **Request Validation** — Uses Zod schemas to validate product data, query parameters, and product identifiers.
- **Database Error Handling** — Handles missing records, invalid categories, and deletion conflicts.
- **Prometheus Monitoring** — Exposes HTTP request metrics for observability.
- **Docker Support** — Supports containerized deployment using Node.js 20 Alpine.

## 🛠 Tech Stack

| Technology        | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| Node.js 20        | JavaScript runtime                                           |
| TypeScript        | Type-safe backend development                                |
| Express.js 5      | REST API and middleware                                      |
| PostgreSQL        | Persistent product and category storage                      |
| Prisma ORM        | Database queries and product management                      |
| Zod               | Request and configuration validation                         |
| Prometheus        | HTTP monitoring                                              |
| dotenv            | Environment variable loading                                 |
| Docker            | Containerization                                             |
| @ecommerce/shared | Shared Prisma client, validation, authorization, and metrics |

## 🏗 Architecture

The Product Service is responsible for catalog data management within the e-commerce platform.

Client requests pass through the API Gateway, which handles token verification and forwards trusted user information to downstream services.

```text
                 ┌──────────────────────┐
                 │   Web Application    │
                 │     / API Client     │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     API Gateway      │
                 │      Port 8000       │
                 │                      │
                 │ • JWT Verification   │
                 │ • Request Routing    │
                 │ • User Identity      │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    Product Service   │
                 │      Port 3007       │
                 │                      │
                 │ • Product CRUD       │
                 │ • Catalog Filtering  │
                 │ • Pagination         │
                 │ • Category Lookup    │
                 │ • Admin Authorization│
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     PostgreSQL       │
                 │      via Prisma      │
                 │                      │
                 │ • Products           │
                 │ • Categories         │
                 │ • Inventory          │
                 └──────────────────────┘
```

The service uses the shared Prisma client from `@ecommerce/shared` to interact with the database.

Unlike the Order, Payment, and Delivery Services, the Product Service does not directly consume or produce Kafka events in the provided implementation.

## 📡 API Reference

The service registers its REST endpoints under `/products`.

When accessed through the API Gateway, the public prefix is `/api/products`.

| Method   | Gateway Endpoint           | Description                | Authentication |
| -------- | -------------------------- | -------------------------- | -------------- |
| `GET`    | `/api/products`            | List and filter products   | Optional       |
| `GET`    | `/api/products/categories` | List available categories  | Optional       |
| `GET`    | `/api/products/:id`        | Retrieve a product by ID   | Optional       |
| `POST`   | `/api/products`            | Create a product           | Admin only     |
| `PUT`    | `/api/products/:id`        | Update a product           | Admin only     |
| `DELETE` | `/api/products/:id`        | Delete a product           | Admin only     |
| `GET`    | `/health`                  | Basic service health check | No             |
| `GET`    | `/metrics`                 | Prometheus metrics         | No             |

### GET `/api/products`

Returns a paginated collection of products with optional filtering.

Example request:

```bash
curl "http://localhost:8000/api/products?page=1&limit=10"
```

Example response:

```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Wireless Headphones",
      "emoji": "🎧",
      "price": "99.99",
      "description": "Wireless over-ear headphones",
      "stock": 25,
      "categoryId": "660e8400-e29b-41d4-a716-446655440000",
      "category": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Electronics"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

The example illustrates the response structure. Actual fields depend on the shared Prisma schema.

### Query Parameters

| Parameter  | Type    | Default | Description                                               |
| ---------- | ------- | ------- | --------------------------------------------------------- |
| `q`        | string  | —       | Search product names and descriptions                     |
| `category` | string  | —       | Filter by category name                                   |
| `minPrice` | number  | —       | Minimum price, inclusive                                  |
| `maxPrice` | number  | —       | Maximum price, inclusive                                  |
| `inStock`  | boolean | —       | Show only products with stock greater than zero when true |
| `page`     | integer | `1`     | Page number, minimum 1                                    |
| `limit`    | integer | `50`    | Number of products per page, maximum 100                  |

The API validates that `minPrice` is not greater than `maxPrice`.

### Filtering Examples

**Keyword Search**

```bash
curl "http://localhost:8000/api/products?q=headphones"
```

Searches product names and descriptions using case-insensitive substring matching.

**Category Filtering**

```bash
curl "http://localhost:8000/api/products?category=Electronics"
```

Filters products by category name without case sensitivity.

**Price Range**

```bash
curl "http://localhost:8000/api/products?minPrice=50&maxPrice=200"
```

Returns products priced between 50 and 200, inclusive.

**In-Stock Products**

```bash
curl "http://localhost:8000/api/products?inStock=true"
```

Returns products with a stock quantity greater than zero.

**Combined Filters**

```bash
curl "http://localhost:8000/api/products?q=wireless&category=Electronics&minPrice=50&maxPrice=200&inStock=true&page=1&limit=20"
```

Filters can be combined in a single request.

### GET `/api/products/categories`

Returns all categories from the database.

```bash
curl http://localhost:8000/api/products/categories
```

Example response:

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Electronics"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Clothing"
  }
]
```

The current implementation retrieves categories using `prisma.category.findMany()`.

Category creation, updating, and deletion are not exposed through this service's routes.

### GET `/api/products/:id`

Retrieves a single product using its UUID.

```bash
curl http://localhost:8000/api/products/550e8400-e29b-41d4-a716-446655440000
```

The response includes the product and its associated category.

If the product does not exist, the service returns HTTP `404 Not Found`.

### POST `/api/products`

Creates a new product.

**Authorization:** Requires the `admin` role.

```bash
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Headphones",
    "emoji": "🎧",
    "price": 99.99,
    "category": "Electronics",
    "description": "Wireless over-ear headphones",
    "stock": 25
  }'
```

Successful response: `201 Created`.

The service validates the request and resolves the category name to an existing category record before creating the product.

If the specified category does not exist, the request returns HTTP `400 Bad Request`.

### PUT `/api/products/:id`

Updates an existing product.

**Authorization:** Requires the `admin` role.

Although the endpoint uses `PUT`, the request schema supports partial updates.

```bash
curl -X PUT http://localhost:8000/api/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 89.99,
    "stock": 40
  }'
```

Successful response: `200 OK`.

Only supplied fields are updated.

If the category is included, the service verifies that the category exists before updating the product's category relationship.

If the product does not exist, it returns HTTP `404 Not Found`.

### DELETE `/api/products/:id`

Deletes an existing product.

**Authorization:** Requires the `admin` role.

```bash
curl -X DELETE http://localhost:8000/api/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin_access_token>"
```

Successful response: `204 No Content`.

If the product does not exist, the service returns HTTP `404 Not Found`.

If the product is referenced by existing orders and a foreign key constraint prevents deletion, it returns HTTP `409 Conflict`.

## 🔍 Product Search & Filtering

The Product Service builds dynamic Prisma queries based on the supplied query parameters.

### Keyword Search

Keyword search matches the product's `name` or `description` using case-insensitive substring matching.

```typescript
whereStatement.OR = [
  {
    name: {
      contains: query.q,
      mode: "insensitive",
    },
  },
  {
    description: {
      contains: query.q,
      mode: "insensitive",
    },
  },
];
```

### Category Filtering

Products can be filtered by the name of their associated category.

```typescript
whereStatement.category = {
  name: {
    equals: query.category,
    mode: "insensitive",
  },
};
```

The lookup is case-insensitive for listing products.

### Price Filtering

Minimum and maximum prices are applied through Prisma range filters.

```typescript
whereStatement.price = {
  ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
  ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
};
```

### Stock Filtering

When `inStock=true`, only products with available inventory are included.

```typescript
whereStatement.stock = {
  gt: 0,
};
```

All provided filters are combined into a single Prisma query.

## 📄 Pagination

The service implements offset-based pagination for product listings.

The default page size is 50 products, with a maximum of 100.

Pagination is calculated using:

```typescript
const page = query.page ?? 1;
const limit = Math.min(query.limit ?? 50, 100);
const skip = (page - 1) * limit;
```

The service retrieves the total matching product count and requested page using `Promise.all`.

Example pagination metadata:

```json
{
  "page": 2,
  "limit": 20,
  "total": 125,
  "totalPages": 7
}
```

Products are ordered by creation date in descending order, with product ID as a secondary ascending sort key.

## 🗂 Category Management

Products are associated with existing category records through the Prisma database schema.

During product creation, the service looks up the requested category by its exact name.

```typescript
const existingCategory = await prisma.category.findUnique({
  where: { name: category },
});
```

If no matching category exists, the service rejects the request.

Example error:

```json
{
  "error": "Category \"Electronics\" not found"
}
```

The same category validation is performed when updating a product's category.

Categories must already exist in the database before they can be assigned to products.

## ✅ Request Validation

The Product Service uses Zod validation schemas imported through `@ecommerce/shared`.

### Product Creation Rules

| Field         | Validation                                             |
| ------------- | ------------------------------------------------------ |
| `name`        | Required, nonempty string                              |
| `emoji`       | Optional, nullable, nonempty when supplied as a string |
| `price`       | Required number between 0 and 99,999,999.99            |
| `category`    | Required, nonempty string                              |
| `description` | Required, nonempty string                              |
| `stock`       | Required integer between 0 and 2,147,483,647           |

Prices may have at most two decimal places.

### Product Updates

The update schema is generated using:

```typescript
export const productUpdateSchema = productSchema.partial();
```

This allows partial updates while maintaining the same validation constraints for supplied fields.

### Product Identifiers

Product ID parameters must be valid UUIDs.

```typescript
export const productParamsSchema = z.object({
  id: z.string().uuid("Invalid UUID"),
});
```

Invalid identifiers are rejected before product lookup.

## 🔐 Authentication & Authorization

Product browsing is publicly accessible at the route level.

Administrative operations use the shared `requireRole("admin")` middleware.

### Access Control

| Operation                  | Guest | User | Admin |
| -------------------------- | ----- | ---- | ----- |
| List products              | Yes   | Yes  | Yes   |
| Search and filter products | Yes   | Yes  | Yes   |
| View categories            | Yes   | Yes  | Yes   |
| View product details       | Yes   | Yes  | Yes   |
| Create products            | No    | No   | Yes   |
| Update products            | No    | No   | Yes   |
| Delete products            | No    | No   | Yes   |

The API Gateway optionally validates access tokens for product routes and forwards verified identity information to downstream services.

The Product Service enforces its own administrative role checks for write operations.

**Important:** In production, direct access to the Product Service should be restricted so clients cannot forge internal identity headers.

## 🗄 Database Integration

The Product Service uses Prisma ORM through the shared `@ecommerce/shared` package.

The service works with two primary database models.

### Product

The Product model stores catalog information, including product identifiers, names, descriptions, prices, stock quantities, emoji representations, and category associations.

### Category

The Category model stores category information used to organize products.

Products are associated with categories through a `categoryId` relationship.

### Database Operations

| Operation       | Prisma Method                  |
| --------------- | ------------------------------ |
| List products   | `prisma.product.findMany()`    |
| Count products  | `prisma.product.count()`       |
| Get product     | `prisma.product.findUnique()`  |
| Create product  | `prisma.product.create()`      |
| Update product  | `prisma.product.update()`      |
| Delete product  | `prisma.product.delete()`      |
| List categories | `prisma.category.findMany()`   |
| Find category   | `prisma.category.findUnique()` |

The service uses Prisma's generated database types to maintain type safety during queries and updates.

## ⚙️ Environment Variables

Environment variables are loaded using `dotenv` and validated with Zod.

| Variable   | Default       | Description              |
| ---------- | ------------- | ------------------------ |
| `NODE_ENV` | `development` | Application environment  |
| `PORT`     | `3007`        | Express HTTP server port |

### Example `.env`

```dotenv
NODE_ENV=development
PORT=3007
```

Database connectivity is managed by the shared Prisma package.

Configure the required database connection settings according to the root monorepo's shared environment configuration.

## 💻 Getting Started

### Prerequisites

The service requires Node.js 20 or later, npm, an accessible PostgreSQL database, and the internal `@ecommerce/shared` package.

Docker is optional for containerized execution.

### Local Development

Install dependencies from the monorepo root:

```bash
npm install
```

Ensure PostgreSQL is running and the shared Prisma client has been generated and configured.

Start the service:

```bash
npm run dev --workspace=product-service
```

Alternatively, from the service directory:

```bash
cd services/product-service
npm run dev
```

The development server uses `tsx watch` for automatic reloading when source files change.

The service listens on:

```text
http://localhost:3007
```

### Production Build

Compile the TypeScript source:

```bash
npm run build --workspace=product-service
```

Start the compiled application:

```bash
npm run start --workspace=product-service
```

The production script executes:

```bash
node dist/index.js
```

Ensure the shared package and Prisma client are built and generated as required by the monorepo.

### Docker

The repository includes a Dockerfile based on Node.js 20 Alpine.

Build the image from the **monorepo root**:

```bash
docker build \
  -f services/product-service/Dockerfile \
  -t product-service .
```

Run the container:

```bash
docker run -p 3007:3007 \
  --env-file services/product-service/.env \
  product-service
```

Ensure database connectivity is correctly configured from inside the container.

The provided Dockerfile currently starts the service using `npm run dev`, making it development-oriented.

A production deployment should build the application and execute the compiled output using the production startup command.

## 📂 Project Structure

```text
product-service/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   └── product.controller.ts
│   │
│   ├── lib/
│   │   └── error.ts
│   │
│   ├── routes/
│   │   └── product.routes.ts
│   │
│   ├── schemas/
│   │   ├── product-params.schema.ts
│   │   ├── product-query.schema.ts
│   │   └── product.schema.ts
│   │
│   ├── services/
│   │   └── product.service.ts
│   │
│   └── index.ts
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

| File                                    | Responsibility                                             |
| --------------------------------------- | ---------------------------------------------------------- |
| `src/index.ts`                          | Express initialization, middleware, routes, and monitoring |
| `src/config/env.ts`                     | Environment configuration validation                       |
| `src/controllers/product.controller.ts` | HTTP request and response handling                         |
| `src/services/product.service.ts`       | Product catalog business logic and database queries        |
| `src/routes/product.routes.ts`          | REST endpoints and authorization                           |
| `src/schemas/product.schema.ts`         | Product creation and update validation                     |
| `src/schemas/product-query.schema.ts`   | Filtering and pagination validation                        |
| `src/schemas/product-params.schema.ts`  | Product UUID validation                                    |
| `src/lib/error.ts`                      | Product-specific HTTP errors                               |
| `Dockerfile`                            | Container image configuration                              |
| `package.json`                          | Dependencies and npm scripts                               |
| `tsconfig.json`                         | TypeScript compilation settings                            |

## 📊 Monitoring & Observability

The Product Service integrates Prometheus HTTP monitoring through `@ecommerce/shared`.

### GET `/metrics`

Exposes HTTP metrics in Prometheus-compatible format.

```bash
curl http://localhost:3007/metrics
```

The application registers the shared `httpMetricsMiddleware` and `metricsHandler`.

These utilities provide a consistent monitoring interface across the e-commerce platform.

### GET `/health`

Returns a basic health check.

```bash
curl http://localhost:3007/health
```

Response:

```json
{
  "status": "ok",
  "service": "product-service"
}
```

HTTP Status: `200 OK`

The health endpoint confirms that the HTTP application is responding but does not independently validate database connectivity.

## ⚠️ Error Handling

The Product Service uses a custom `ProductError` class extending the shared `HttpError`.

It handles expected product-management errors with appropriate HTTP status codes.

| HTTP Status        | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| `400 Bad Request`  | Invalid category or product input                                     |
| `401 Unauthorized` | Authentication required for a protected operation                     |
| `403 Forbidden`    | User lacks administrator permissions                                  |
| `404 Not Found`    | Requested product does not exist                                      |
| `409 Conflict`     | Product cannot be deleted because it is referenced by existing orders |

### Missing Product

```json
{
  "error": "Product with ID 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

### Invalid Category

```json
{
  "error": "Category \"Unknown\" not found"
}
```

### Product Deletion Conflict

```json
{
  "error": "Cannot delete product with ID 550e8400-e29b-41d4-a716-446655440000 because it is referenced in existing orders"
}
```

The service maps Prisma `P2025` errors to HTTP `404` and `P2003` foreign key violations to HTTP `409` during deletion.

Unexpected application errors are handled by the shared Express error handler.

## 🔒 Production Considerations

**Authorization:** Administrative routes require the `admin` role. The Product Service should remain behind trusted infrastructure that prevents spoofing of authenticated user headers.

**Database Access:** Prisma provides structured database access. Database credentials should be managed through secure environment configuration.

**Product Deletion:** Products referenced by existing order records cannot be deleted when database constraints prevent it. Soft deletion or product archival may be preferable for historical order integrity.

**Inventory Consistency:** Product stock can be modified through administrative updates, while the Order Service also decrements stock during checkout. Coordinated inventory rules are important when multiple services modify the same records.

**Pagination:** Offset-based pagination is suitable for moderate catalog sizes. Cursor-based pagination may be preferable for very large datasets.

**Search Performance:** The service currently performs database-backed substring searches. Large catalogs may benefit from dedicated indexes or integration with the platform's Search Service.

**Category Management:** Category names must already exist before products can reference them. The current API only provides category listing, not category creation or modification.

**Metrics Security:** The `/metrics` endpoint is exposed without application-level authentication and should be restricted to trusted monitoring infrastructure.

**Container Deployment:** Production images should use compiled output rather than running the development watch process.

## 📦 Shared Dependencies

The Product Service relies on the internal `@ecommerce/shared` package for common functionality across the e-commerce platform.

The shared package provides the Prisma database client, generated database types, Zod integration, validation middleware, role-based authorization, HTTP error classes, and Prometheus monitoring utilities.

This promotes consistent validation, authorization, database access, and observability across services.

## 📝 Notes

The Product Service is responsible for product catalog management, category relationships, pricing, and stock visibility.

It does not directly process orders, payments, or deliveries. Those responsibilities belong to other microservices.

The Order Service accesses product information and updates inventory during checkout through the shared database infrastructure.

The Product Service exposes the catalog API used by client applications and supports administrative workflows for maintaining product information.

---

**Product Service** — Product catalog management with advanced filtering, pagination, role-based access control, and Prisma-powered persistence.
