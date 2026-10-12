# Shared infrastructure and types

This package uses Prisma 5.22 with PostgreSQL. Models live in
`prisma/schema.prisma`.

Set `DATABASE_URL` in the service environment (or a `.env` file in its working
directory). From the repository root:

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

`db` is also exported as an alias of `prisma`. Generating the client and building
the package do not apply database migrations. Disconnect the client with
`await prisma.$disconnect()` when shutting down the service.

## Identity types

```ts
import type { AuthenticatedUser, UserRole } from "@ecommerce/shared/types";
```

`AuthenticatedUser.id` is a number, matching the Prisma `User.id` field, and
`UserRole` is `"user" | "admin"`. These types do not validate headers or JWT
claims at runtime. HTTP identity headers are still strings.

## Controller validation

```ts
import { z } from "zod";
import { validateBody, validateQuery } from "@ecommerce/shared/validation";

const bodySchema = z.object({ name: z.string().trim().min(1) });
router.post("/example", validateBody(bodySchema, async (body, req, res) => {
  res.json({ name: body.name });
}));

const querySchema = z.object({ page: z.coerce.number().int().positive().default(1) });
router.get("/example", validateQuery(querySchema, async (query, req, res) => {
  res.json({ page: query.page });
}));
```

The first controller argument is the parsed schema output, including defaults
and transformations. Invalid input returns HTTP 400 with validation details and
does not call the controller. Async refinements are supported; thrown errors
and rejected controller promises are passed to Express error middleware.
The wrappers do not modify `req.body` or `req.query`. If a schema wraps its body
in `z.object({ body: ... })`, pass `schema.shape.body` to `validateBody`.

Redis configuration stays local to auth-service.
