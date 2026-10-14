# Shared Package

Common Prisma ORM models, database client singleton, Kafka clients, error handlers, and TypeScript contracts shared across all microservices.

---

## 🧭 Navigation

- **[← Back to Root](../README.md)**
- **Services**:
  - [API Gateway](../services/api-gateway/README.md)
  - [Auth Service](../services/auth-service/README.md)
  - [Order Service](../services/order-service/README.md)
  - [Payment Service](../services/payment-service/README.md)
  - [Delivery Service](../services/delivery-service/README.md)
  - [Product Service](../services/product-service/README.md)
  - [Search Service](../services/search-service/README.md)
  - [Analytics Service](../services/analytics-service/README.md)
- **Packages & Tools**:
  - [Web Frontend](../web/README.md)
  - [Postman API Suite](../postman/README.md)

---

## Setup & Build

This package uses Prisma 5.22 with PostgreSQL. Models live in `prisma/schema.prisma`.

Set `DATABASE_URL` in the service environment (or a `.env` file in its working directory). From the repository root:

```sh
npm run db:generate --workspace=@ecommerce/shared
npm run build --workspace=@ecommerce/shared
```

Use the shared client in a service:

```ts
import { prisma } from "@ecommerce/shared/prisma";

const user = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
});
```

`db` is also exported as an alias of `prisma`. Generating the client and building the package do not apply database migrations. Disconnect the client with `await prisma.$disconnect()` when shutting down the service.

## Identity types

```ts
import type { AuthenticatedUser, UserRole } from "@ecommerce/shared/types";
```

`AuthenticatedUser.id` is a string (UUID), matching the Prisma `User.id` field, and `UserRole` is `"user" | "admin"`. These types do not validate headers or JWT claims at runtime. HTTP identity headers are still strings.

## Controller validation

```ts
import { z } from "zod";
import { validate } from "@ecommerce/shared/validation";

const bodySchema = z.object({ name: z.string().trim().min(1) });
router.post("/example", validate({ body: bodySchema }), (req, res) => {
  res.json({ name: req.body.name });
});

const querySchema = z.object({ page: z.coerce.number().int().positive().default(1) });
router.get("/example", validate({ query: querySchema }), (req, res) => {
  const query = res.locals.query as z.infer<typeof querySchema>;
  res.json({ page: query.page });
});
```

Validated bodies and route parameters replace `req.body` and `req.params`.
Validated query values are stored in `res.locals.query` because Express 5 exposes
`req.query` as a getter-only property. Read `res.locals.query` to use schema defaults,
coercions, and transformations. Invalid input returns HTTP 400 before the controller runs.

Redis configuration stays local to auth-service.
