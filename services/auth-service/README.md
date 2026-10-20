# 🔐 Auth Service

A secure, scalable authentication and user management microservice built with **Node.js, TypeScript, Express.js, PostgreSQL, Prisma, and Redis** for an event-driven e-commerce platform.

The Auth Service handles user registration, authentication, JWT access token generation, Redis-backed refresh sessions, and secure logout. It implements password hashing, request validation, distributed rate limiting, and role-aware authentication to provide a centralized identity management solution for the microservices architecture.

## 🚀 Key Features

- **User Registration** — Creates user accounts with validated credentials and securely hashed passwords.
- **JWT Authentication** — Issues short-lived access tokens containing verified user identity and role information.
- **Refresh Token Sessions** — Manages refresh sessions through Redis with automatic expiration and explicit revocation.
- **Secure Password Storage** — Uses bcrypt with configurable-in-code salt rounds to protect stored passwords.
- **HTTP-Only Cookies** — Stores refresh tokens in cookies inaccessible to client-side JavaScript.
- **Role-Based Identity** — Includes user roles in JWT payloads for authorization across microservices.
- **Distributed Rate Limiting** — Uses Redis-backed counters to restrict excessive authentication requests across multiple instances.
- **Brute-Force Protection** — Limits login attempts by client IP and normalized user identifier.
- **Input Validation** — Validates registration, login, and refresh token formats.
- **Timing-Resistance Measures** — Performs password verification even when a user account does not exist.
- **Prometheus Monitoring** — Exposes HTTP metrics for application observability.
- **Graceful Shutdown** — Closes the HTTP server and disconnects Redis during termination.
- **Automated Testing** — Includes authentication contract tests and Redis rate-limiting integration tests.
- **Docker Support** — Supports containerized deployment using Node.js 20 Alpine.

## 🛠 Tech Stack

| Technology            | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| Node.js 20            | JavaScript runtime                                        |
| TypeScript            | Type-safe backend development                             |
| Express.js 5          | HTTP server and REST API                                  |
| PostgreSQL            | Persistent user data storage                              |
| Prisma ORM            | Database access and user management                       |
| Redis                 | Refresh session storage and rate limiting                 |
| ioredis               | Redis client                                              |
| JSON Web Tokens       | Access token generation and verification                  |
| bcryptjs              | Password hashing and verification                         |
| rate-limiter-flexible | Distributed request rate limiting                         |
| Zod                   | Request and environment validation                        |
| cookie-parser         | HTTP cookie handling                                      |
| Prometheus            | HTTP monitoring                                           |
| Docker                | Containerization                                          |
| @ecommerce/shared     | Shared database client, types, validation, and middleware |

## 🏗 Architecture

The Auth Service operates as the authentication component of the e-commerce microservices ecosystem.

Client requests typically pass through the API Gateway before reaching the Auth Service.

```text
                  ┌────────────────────┐
                  │   Web Application  │
                  │    / API Client    │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │     API Gateway    │
                  │     Port 8000      │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │    Auth Service    │
                  │     Port 3006      │
                  │                    │
                  │  • Registration    │
                  │  • Authentication  │
                  │  • JWT Generation  │
                  │  • Refresh Tokens  │
                  │  • Rate Limiting   │
                  └─────────┬──────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
       ┌────────────────┐       ┌────────────────┐
       │   PostgreSQL   │       │     Redis      │
       │                │       │                │
       │ • User Records │       │ • Refresh      │
       │ • Credentials  │       │   Sessions     │
       │ • User Roles   │       │ • Rate Limits  │
       └────────────────┘       └────────────────┘
```

### Authentication Flow

```text
        User Login Request
                 │
                 ▼
        Request Validation
                 │
                 ▼
          Rate Limiting
                 │
                 ▼
       Find User via Prisma
                 │
                 ▼
      Verify Password (bcrypt)
                 │
                 ▼
         Valid Credentials?
                 │
          ┌──────┴──────┐
          │             │
         No            Yes
          │             │
          ▼             ▼
      HTTP 401     Generate JWT
                        │
                        ▼
                  Create Refresh
                   Token Session
                        │
                        ▼
                  Store SHA-256
                   Hash in Redis
                        │
                        ▼
                   Return JWT
                  + User Details
                  + Secure Cookie
```

## 📡 API Reference

The service registers its routes under `/auth`.

When accessed through the API Gateway, the public prefix is `/api/auth`.

| Method | Gateway Endpoint     | Description                       | Authentication                |
| ------ | -------------------- | --------------------------------- | ----------------------------- |
| `POST` | `/api/auth/register` | Register a new user               | Not required                  |
| `POST` | `/api/auth/login`    | Authenticate and create a session | Not required                  |
| `POST` | `/api/auth/refresh`  | Generate a new access token       | Valid refresh token           |
| `POST` | `/api/auth/logout`   | Revoke the refresh session        | Optional refresh token        |
| `GET`  | `/api/auth/me`       | Retrieve current user information | Required                      |
| `GET`  | `/health`            | Service health check              | Not required                  |
| `GET`  | `/metrics`           | Prometheus metrics                | Not required at service level |

### POST `/api/auth/register`

Creates a new user account.

Example request:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Successful response (`201 Created`):

```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2026-10-20T12:00:00.000Z",
  "updatedAt": "2026-10-20T12:00:00.000Z"
}
```

The response includes only public user fields. Passwords and password hashes are never returned.

If the email or username already exists, the service returns HTTP `409 Conflict`.

### POST `/api/auth/login`

Authenticates a user using either an email address or a username.

Exactly one identifier must be provided.

Example using email:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Successful response (`200 OK`):

```json
{
  "accessToken": "<jwt_access_token>",
  "user": {
    "id": "user-uuid",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2026-10-20T12:00:00.000Z",
    "updatedAt": "2026-10-20T12:00:00.000Z"
  }
}
```

The refresh token is issued separately through a `Set-Cookie` response header.

Cookie properties:

| Property | Value                             |
| -------- | --------------------------------- |
| Name     | `refreshToken`                    |
| HttpOnly | `true`                            |
| Secure   | `true` in production              |
| SameSite | `Lax`                             |
| Path     | `/api/auth`                       |
| Max-Age  | Configured refresh token lifetime |

The cookie is scoped to the Gateway's authentication path.

### POST `/api/auth/refresh`

Generates a new JWT access token using an existing refresh session.

The refresh token can be provided through the `refreshToken` cookie or request body.

Example using a cookie:

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Cookie: refreshToken=<refresh_token>"
```

Successful response:

```json
{
  "accessToken": "<new_jwt_access_token>"
}
```

The service validates the refresh token format, hashes it, and looks up the corresponding Redis session.

If the session is valid, it retrieves the associated user and generates a new access token using the user's current role and email.

**Note:** Refresh requests issue a new access token without rotating the existing refresh token.

### POST `/api/auth/logout`

Invalidates the current refresh session and clears the refresh token cookie.

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Cookie: refreshToken=<refresh_token>"
```

Response:

```json
{
  "message": "User logged out"
}
```

When a refresh token is provided, its corresponding Redis session is deleted.

Logout also succeeds when no refresh token is supplied.

Revoking a refresh session prevents future refreshes using that token. Previously issued JWT access tokens remain valid until expiration unless another service implements additional revocation checks.

### GET `/api/auth/me`

Returns information about the authenticated user.

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

Example response:

```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2026-10-20T12:00:00.000Z",
  "updatedAt": "2026-10-20T12:00:00.000Z"
}
```

The route uses the shared `requireUser` middleware and expects authenticated user information to be provided by trusted infrastructure.

### GET `/health`

Returns a basic health check.

```bash
curl http://localhost:3006/health
```

Response:

```json
{
  "status": "ok",
  "service": "auth-service"
}
```

The health endpoint confirms that the HTTP application is responding. It does not independently verify database and Redis health.

### GET `/metrics`

Exposes Prometheus-compatible HTTP metrics through the shared metrics handler.

```bash
curl http://localhost:3006/metrics
```

The endpoint is registered without application-level authentication, so production access should be restricted through trusted infrastructure.

## 🔑 JWT Authentication

The Auth Service issues signed JWT access tokens containing the authenticated user's identity.

Example JWT payload:

```json
{
  "id": "user-uuid",
  "role": "user",
  "email": "john@example.com",
  "iat": 1792497600,
  "exp": 1792498500
}
```

The timestamps above are illustrative.

JWT tokens are signed using the configured `JWT_SECRET` and `jsonwebtoken`.

### Token Lifetimes

| Token         | Default Lifetime | Configurable |
| ------------- | ---------------- | ------------ |
| Access Token  | 15 minutes       | Yes          |
| Refresh Token | 7 days           | Yes          |

Supported duration values:

```text
15m, 30m, 1h, 7d, 30d
```

The same JWT secret must be configured in the Auth Service and API Gateway for compatible verification.

## 🔄 Refresh Token Management

Refresh sessions are stored in Redis rather than being managed as long-lived JWTs.

Each refresh token is generated using 32 cryptographically secure random bytes and encoded as a 64-character hexadecimal string.

Before storage, the token is hashed using SHA-256.

Redis record format:

```text
Key:   refresh:<sha256_token_hash>
Value: <user_id>
TTL:   Configured refresh token lifetime
```

For example:

```text
refresh:4d7c...e9a2 → user-uuid
```

The refresh session automatically expires when its Redis TTL reaches zero.

This design provides server-side session invalidation, avoids storing raw refresh tokens in Redis, and supports multiple refresh sessions per user.

## 🔒 Password Security

Passwords are hashed using `bcryptjs` before being stored in the database.

The implementation currently uses **10 bcrypt salt rounds**.

Password verification uses bcrypt comparison rather than comparing plaintext credentials.

To reduce differences between valid and nonexistent usernames, authentication performs password verification against a generated dummy bcrypt hash when the requested account does not exist.

Invalid credentials always produce the same error response:

```json
{
  "error": "Invalid credentials."
}
```

HTTP Status: `401 Unauthorized`

## ✅ Input Validation

Request validation is implemented using Zod schemas from the shared package.

### Registration Rules

| Field       | Validation                                         |
| ----------- | -------------------------------------------------- |
| `username`  | 3–30 characters; letters, numbers, and underscores |
| `firstName` | 1–50 characters                                    |
| `lastName`  | 1–50 characters                                    |
| `email`     | Valid email address; maximum 254 characters        |
| `password`  | Minimum 8 characters; maximum 72 UTF-8 bytes       |

Registration passwords must include at least one lowercase letter, uppercase letter, number, and special character.

Emails are normalized to lowercase and surrounding whitespace is removed from username, first name, last name, and email fields.

### Login Rules

Login accepts exactly one of `username` or `email`, together with a password.

Login passwords must be at least 6 characters and no more than 72 UTF-8 bytes.

### Refresh Token Validation

Refresh tokens must be 64-character lowercase hexadecimal strings.

Malformed tokens are rejected before Redis lookups.

## 🛡 Distributed Rate Limiting

The Auth Service implements Redis-backed rate limiting using `rate-limiter-flexible`.

The rate limiters share counters across service instances, helping prevent excessive authentication attempts in distributed deployments.

Rate limiting can be enabled or disabled using the `ENABLE_RATE_LIMIT` environment variable.

### Default Limits

| Scope                            | Limit      | Window     |
| -------------------------------- | ---------- | ---------- |
| All `/auth` requests             | 120 per IP | 1 minute   |
| Login requests                   | 30 per IP  | 1 minute   |
| Login attempts per identifier/IP | 10         | 15 minutes |
| Registration requests            | 5 per IP   | 1 hour     |
| Refresh requests                 | 30 per IP  | 1 minute   |

The login attempt limiter uses a SHA-256 hash of the normalized login identifier and client IP.

For IPv4 clients, counters are keyed by normalized IP address. IPv4-mapped IPv6 addresses are normalized to IPv4, while native IPv6 clients share counters by `/64` subnet.

Successful login attempts refund one point from their corresponding identifier/IP counter.

### Rate Limit Responses

When a rate limit is exceeded:

```json
{
  "error": "Too many requests. Please try again later."
}
```

HTTP Status: `429 Too Many Requests`

A `Retry-After` header indicates the number of seconds before another attempt is permitted.

If an active limiter cannot access Redis, authentication requests fail with HTTP `503` rather than bypassing rate limits.

### Development Configuration

To explicitly disable rate limiting during local development:

```dotenv
ENABLE_RATE_LIMIT=false
```

To enable it:

```dotenv
ENABLE_RATE_LIMIT=true
```

The current source defaults to disabled rate limiting when the variable is absent, due to the Zod schema default. Set the value explicitly in production.

## ⚙️ Environment Variables

Configuration is validated through Zod during application initialization.

| Variable                        | Default                  | Description                                      |
| ------------------------------- | ------------------------ | ------------------------------------------------ |
| `NODE_ENV`                      | `development`            | Application environment                          |
| `PORT`                          | `3006`                   | HTTP server port                                 |
| `JWT_SECRET`                    | Required                 | JWT signing secret, minimum 16 characters        |
| `JWT_EXPIRES_IN`                | `15m`                    | Access token lifetime                            |
| `REFRESH_TOKEN_EXPIRES_IN`      | `7d`                     | Refresh session lifetime                         |
| `REDIS_URL`                     | `redis://localhost:6379` | Redis connection URL                             |
| `REDIS_PASSWORD`                | Optional                 | Redis authentication password                    |
| `TRUST_PROXY`                   | Empty                    | Trusted proxy addresses or ranges                |
| `ENABLE_RATE_LIMIT`             | `false`                  | Enable Redis-backed rate limiting                |
| `AUTH_RATE_LIMIT_PER_MINUTE`    | `120`                    | Global auth requests per minute                  |
| `LOGIN_RATE_LIMIT_PER_MINUTE`   | `30`                     | Login requests per minute                        |
| `LOGIN_FAILURE_LIMIT`           | `10`                     | Login attempts per identifier/IP over 15 minutes |
| `REGISTER_RATE_LIMIT_PER_HOUR`  | `5`                      | Registration requests per hour                   |
| `REFRESH_RATE_LIMIT_PER_MINUTE` | `30`                     | Refresh requests per minute                      |

### Example `.env`

```dotenv
NODE_ENV=development
PORT=3006

JWT_SECRET=replace_with_a_secure_secret_at_least_16_characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379

TRUST_PROXY=
ENABLE_RATE_LIMIT=true

AUTH_RATE_LIMIT_PER_MINUTE=120
LOGIN_RATE_LIMIT_PER_MINUTE=30
LOGIN_FAILURE_LIMIT=10
REGISTER_RATE_LIMIT_PER_HOUR=5
REFRESH_RATE_LIMIT_PER_MINUTE=30
```

Database connectivity is managed through the shared Prisma package. Configure the database connection according to the root monorepo's environment settings.

## 💻 Getting Started

### Prerequisites

The service requires Node.js 20 or later, npm, Redis, the platform's configured database, and the internal `@ecommerce/shared` package.

### Local Development

Install workspace dependencies from the monorepo root:

```bash
npm install
```

Start Redis locally or ensure an existing Redis instance is accessible.

Configure environment variables, including `JWT_SECRET` and `REDIS_URL`.

Start the Auth Service from the repository root:

```bash
npm run dev --workspace=auth-service
```

Alternatively, from the service directory:

```bash
npm run dev
```

The service listens on:

```text
http://localhost:3006
```

The development server uses `tsx watch` for automatic reloads.

### Production Build

Compile TypeScript:

```bash
npm run build --workspace=auth-service
```

Start the compiled application:

```bash
npm run start --workspace=auth-service
```

The production script executes `node dist/index.js`. Ensure the shared package and database client have been built or generated as required by the monorepo.

### Docker

The Dockerfile uses Node.js 20 Alpine and installs OpenSSL for Prisma compatibility.

Build the image from the **monorepo root**, since the Dockerfile references workspace-level paths:

```bash
docker build -f services/auth-service/Dockerfile -t auth-service .
```

Run the container with the required environment variables:

```bash
docker run -p 3006:3006 \
  --env-file services/auth-service/.env \
  auth-service
```

Ensure the database and Redis URLs are accessible from the container.

The provided Dockerfile currently launches the development server using `npm run dev`. Production deployments should use compiled artifacts and the production startup script.

## 🧪 Testing

The repository includes automated tests using Node.js's built-in test runner and `tsx`.

### Authentication Tests

Run the HTTP contract tests:

```bash
npm test --workspace=auth-service
```

These tests use mocked database and Redis operations and cover registration, login, validation, authentication responses, refresh token handling, logout, rate limiting, and response-field safety.

### Redis Integration Tests

Run the Redis rate-limiting tests:

```bash
npm run test:redis --workspace=auth-service
```

A running Redis instance is required.

By default, the integration test connects to:

```text
redis://127.0.0.1:6379
```

To use a different Redis instance:

```bash
RATE_LIMIT_TEST_REDIS_URL=redis://localhost:6379 \
npm run test:redis --workspace=auth-service
```

The integration test verifies atomic counter behavior, shared limits across instances, point refunds, and automatic counter expiration.

The test uses a unique Redis key prefix to avoid interference with ordinary application counters.

## 📂 Project Structure

```text
auth-service/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   └── auth.controller.ts
│   │
│   ├── lib/
│   │   ├── error.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── redis.ts
│   │   └── tokens.ts
│   │
│   ├── middlewares/
│   │   └── rateLimit.ts
│   │
│   ├── routes/
│   │   └── auth.routes.ts
│   │
│   ├── schemas/
│   │   ├── login.schema.ts
│   │   ├── refresh-token.schema.ts
│   │   └── register.schema.ts
│   │
│   ├── services/
│   │   └── auth.service.ts
│   │
│   └── index.ts
│
├── test/
│   ├── auth.test.ts
│   └── rate-limit.redis.test.ts
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

| File                                 | Responsibility                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `src/index.ts`                       | Application initialization, middleware, Redis startup, and graceful shutdown |
| `src/config/env.ts`                  | Environment configuration validation                                         |
| `src/controllers/auth.controller.ts` | HTTP request and response handling                                           |
| `src/services/auth.service.ts`       | Authentication and user management business logic                            |
| `src/lib/jwt.ts`                     | Access token generation and refresh token cryptography                       |
| `src/lib/password.ts`                | bcrypt password hashing and verification                                     |
| `src/lib/redis.ts`                   | Redis connection lifecycle                                                   |
| `src/lib/tokens.ts`                  | Refresh session creation, lookup, and revocation                             |
| `src/middlewares/rateLimit.ts`       | Redis-backed rate limiting                                                   |
| `src/routes/auth.routes.ts`          | Authentication endpoint routing                                              |
| `src/schemas/`                       | Request validation schemas                                                   |
| `test/`                              | HTTP and Redis integration tests                                             |

## 📊 Observability

The Auth Service integrates Prometheus monitoring through `@ecommerce/shared`.

The shared `httpMetricsMiddleware` instruments HTTP traffic, and the `metricsHandler` exposes collected metrics through `/metrics`.

Monitoring can be integrated with Prometheus and Grafana to track service activity and HTTP performance.

The service also records startup, Redis connectivity, and shutdown events through application logs.

## 🛑 Graceful Shutdown

The service supports graceful termination using `SIGTERM` and `SIGINT`.

On shutdown, it stops accepting new HTTP connections, closes the HTTP server, and disconnects from Redis.

A 10-second timeout forces process termination if graceful shutdown does not complete.

This behavior supports containerized environments where services may be stopped or replaced during deployments.

## 🔒 Security Considerations

**Password Protection:** Passwords are stored as bcrypt hashes and excluded from API responses.

**Refresh Token Storage:** Refresh tokens are cryptographically generated and stored as SHA-256 hashes in Redis.

**Session Revocation:** Logout removes the corresponding Redis refresh session, preventing further access token issuance through that session.

**Cookie Security:** Refresh tokens are stored in HttpOnly cookies with `SameSite=Lax` and production-only `Secure` configuration.

**Rate Limiting:** Redis-backed counters provide distributed protection against excessive authentication attempts when enabled.

**User Enumeration:** Login uses generic invalid-credential responses and dummy password verification to reduce account enumeration signals.

**Trusted Proxy Configuration:** `TRUST_PROXY` should include only trusted infrastructure. Misconfigured proxy trust can undermine IP-based rate limiting.

**Service Isolation:** The Auth Service should be accessed through the API Gateway or trusted internal services. In particular, the `/auth/me` route relies on trusted user identity information.

**Production Credentials:** JWT secrets, Redis credentials, and database connection strings should never be committed to version control.

**CORS and CSRF:** The service currently enables broad CORS at its own Express layer and uses cookies for refresh sessions. Production deployments should enforce trusted origins and review cross-site request protections.

## 📦 Shared Dependencies

The service depends on the internal `@ecommerce/shared` package.

Shared functionality includes the Prisma database client, authenticated user types, validation helpers, HTTP error handling, authorization middleware, and Prometheus instrumentation.

This ensures consistent behavior and interfaces across the e-commerce microservices architecture.

## 📝 Notes

The Auth Service is responsible for user identity and authentication rather than application-specific authorization policies. Access restrictions for administrative endpoints are enforced by the API Gateway and relevant downstream services.

User records are persisted through Prisma, while Redis provides temporary refresh-session storage and distributed rate-limiting counters.

The service supports multiple refresh sessions per user, allowing users to remain authenticated across multiple browser sessions or devices.

Short-lived JWT access tokens reduce the duration of exposure if a token is compromised, while Redis-backed refresh sessions provide server-side revocation capabilities.

---

**Auth Service** — Secure identity management, JWT authentication, and Redis-backed session handling for the e-commerce microservices platform.
