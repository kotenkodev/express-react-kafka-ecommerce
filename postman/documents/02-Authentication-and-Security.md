# Authentication, Security & Header Propagation

This document details the security architecture, token lifecycles, and role-based access control (RBAC) enforced across the platform and tested via Postman.

---

## 1. Authentication Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as Postman / Client
    participant GW as API Gateway (:8000)
    participant Auth as Auth Service (:3006)
    participant Redis as Redis (:6379)
    participant DB as PostgreSQL

    Note over Client, DB: Step 1: User Login
    Client->>GW: POST /api/auth/login { username, password }
    GW->>Auth: Forward request
    Auth->>DB: Query user by username or email
    Auth->>Auth: Verify bcrypt hash (12 rounds)
    Auth->>Redis: Set refresh_token:<userId> (7-day TTL)
    Auth-->>Client: 200 OK + JWT Access Token (15m) + Set-Cookie: refreshToken

    Note over Client, DB: Step 2: Authenticated API Call
    Client->>GW: GET /api/orders (Authorization: Bearer <token>)
    GW->>GW: Verify JWT signature & expiration
    GW->>GW: Strip spoofed x-user-* headers
    GW->>GW: Inject trusted headers: x-user-id, x-user-email, x-user-role
    GW->>Auth: Forward to downstream service with injected headers

    Note over Client, DB: Step 3: Token Refresh
    Client->>GW: POST /api/auth/refresh { refreshToken }
    GW->>Auth: Forward
    Auth->>Redis: Check refresh_token:<userId> exists
    Auth-->>Client: 200 OK + New JWT Access Token (15m)
```

---

## 2. Injected Security Headers

Downstream microservices (Order, Product, Search, Analytics) **never trust client-supplied identity**. The API Gateway strictly manages internal headers:

1. **Header Stripping**: The gateway strips incoming client headers `x-user-id`, `x-user-email`, and `x-user-role` on every request to prevent header spoofing.
2. **Signature Verification**: The gateway verifies the Bearer JWT against `JWT_SECRET`.
3. **Internal Header Injection**: Upon successful verification, the gateway injects:
   - `x-user-id`: Authenticated user UUID.
   - `x-user-email`: Authenticated user email address.
   - `x-user-role`: User role (`user` or `admin`).

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Required Role | Behavior / Restriction |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Creates `user` role account |
| `/api/auth/login` | `POST` | Public | Authenticates credentials, returns tokens |
| `/api/auth/refresh` | `POST` | Public | Refreshes access token via Redis check |
| `/api/auth/logout` | `POST` | Public | Deletes Redis session, clears cookie |
| `/api/auth/me` | `GET` | Authenticated | Returns current profile |
| `/api/products` | `GET` | Public | Browse catalog and apply filters |
| `/api/products/categories` | `GET` | Public | List categories |
| `/api/products/:id` | `GET` | Public | View single product |
| `/api/products` | `POST` | `admin` | Create product (403 if `user`) |
| `/api/products/:id` | `PUT` | `admin` | Update product (403 if `user`) |
| `/api/products/:id` | `DELETE` | `admin` | Delete product (403 if `user`) |
| `/api/orders` | `POST` | Authenticated | Places order, emits Kafka event |
| `/api/orders` | `GET` | Authenticated | `user` sees own orders; `admin` sees all |
| `/api/orders/:id` | `GET` | Authenticated | Access limited to order owner or admin |
| `/api/events` | `GET` | Authenticated | SSE stream filtered to user's orders |
| `/api/search` | `GET` | `admin` | Full-text Elasticsearch order search |
| `/api/search/orders/:id` | `GET` | `admin` | Retrieve single indexed order document |
| `/api/search/stats` | `GET` | `admin` | Elasticsearch index statistics |
| `/api/analytics` | `GET` | `admin` | Real-time sliding window stats |

---

## 4. Registration Request Schema

The `POST /api/auth/register` endpoint requires all five fields. Validation is enforced by Zod:

| Field | Type | Rules |
| :--- | :--- | :--- |
| `username` | string | 3–30 chars, alphanumeric + underscores only |
| `firstName` | string | 1–50 chars |
| `lastName` | string | 1–50 chars |
| `email` | string | Valid email, max 254 chars, lowercased |
| `password` | string | Min 8 chars, must contain uppercase, lowercase, digit, and special character; max 72 UTF-8 bytes |

```json
{
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Secret1!"
}
```

---

## 5. Redis-Backed Rate Limiting

All auth endpoints are protected by distributed rate limiting via `rate-limiter-flexible` backed by Redis. Limits are configurable via environment variables.

| Limiter | Scope | Default Window |
| :--- | :--- | :--- |
| `all` | Every request to `/api/auth/*` (per IP) | 60 s |
| `login` | `POST /api/auth/login` (per IP) | 60 s |
| `loginFailures` | Failed login attempts (per IP + identifier hash) | 15 min |
| `register` | `POST /api/auth/register` (per IP) | 60 min |
| `refresh` | `POST /api/auth/refresh` (per IP) | 60 s |

When a limit is exceeded the service responds with **`429 Too Many Requests`** and a `Retry-After` header indicating the seconds until the next allowed attempt. A successful login automatically refunds one point from the `loginFailures` counter.

---

## 6. Default Seed Credentials

- **Admin Account**:
  - Email: `admin@kafkashop.com`
  - Username: `admin`
  - Password: `admin123`
  - Role: `admin`
- **Dynamic Test Accounts**:
  - The `Auth/Register` request automatically utilizes Postman dynamic variables (`user_{{$timestamp}}@example.com`) to generate unique customer accounts for test runs.
