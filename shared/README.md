# Shared Prisma client

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
