# Auth Service

User registration, authentication, 15-minute JWT access token issuance, and Redis-backed 7-day refresh token management (`refresh_token:<userId>`).

**Port**: `3006`

## Rate limiting

Authentication routes use `rate-limiter-flexible` with Redis counters shared across
auth-service instances. Exhausted limits return HTTP 429 and a `Retry-After` header
in seconds. Redis errors return HTTP 503; requests do not bypass the limiter.

| Environment variable | Default | Scope |
| --- | --- | --- |
| `AUTH_RATE_LIMIT_PER_MINUTE` | 120 | All `/auth` requests per IP |
| `LOGIN_RATE_LIMIT_PER_MINUTE` | 30 | Login requests per IP, including invalid bodies |
| `LOGIN_FAILURE_LIMIT` | 10 | Attempts per normalized identifier/IP pair over 15 minutes |
| `REGISTER_RATE_LIMIT_PER_HOUR` | 5 | Registration requests per IP |
| `REFRESH_RATE_LIMIT_PER_MINUTE` | 30 | Refresh requests per IP |

Login reserves a point before checking credentials, bounding concurrent attempts.
Successful login refunds only its own point; failed and in-flight attempts remain
counted. This is a fixed-window limit, not an account-wide lockout. Email and
username are separate identifiers. Identifier/IP pairs are hashed in Redis keys.
IPv4-mapped IPv6 addresses normalize to IPv4; native IPv6 addresses share a /64
counter to prevent bypass by switching addresses within that subnet.

`TRUST_PROXY` is a comma-separated list of trusted proxy IP addresses or CIDRs
(Express named ranges are supported). It defaults to no trusted proxies. The
gateway overwrites `X-Forwarded-For` with its resolved client IP, and Nginx replaces
incoming forwarding headers with the connection's client IP.

Compose trusts loopback/private addresses for the internal Nginx → gateway → auth
chain. Production auth and gateway ports are not published. Keep that internal
network restricted to trusted workloads; use exact proxy addresses/CIDRs if other
clients share it. For local runs, configure trust for your actual gateway address.
If adding a CDN or load balancer before Nginx, configure its trusted real-IP ranges
before relying on client-specific limits. Health checks are outside the limiter.

Run `npm test --workspace auth-service` for HTTP regression tests. These use the
library's in-memory counters in place of Redis and mocked database/session calls.
Run `npm run test:redis --workspace auth-service` for real Redis counter tests
(defaults to `redis://127.0.0.1:6379`; override with `RATE_LIMIT_TEST_REDIS_URL`).
The test uses a unique key prefix and cleans up its own keys.

---

## 🧭 Navigation

- **[← Back to Root](../../README.md)**
- **Services**:
  - [API Gateway](../api-gateway/README.md)
  - [Order Service](../order-service/README.md)
  - [Payment Service](../payment-service/README.md)
  - [Delivery Service](../delivery-service/README.md)
  - [Product Service](../product-service/README.md)
  - [Search Service](../search-service/README.md)
  - [Analytics Service](../analytics-service/README.md)
- **Packages & Tools**:
  - [Shared Package](../../shared/README.md)
  - [Web Frontend](../../web/README.md)
  - [Postman API Suite](../../postman/README.md)
