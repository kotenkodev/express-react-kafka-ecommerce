# Delivery Service

Asynchronous Kafka worker consuming from the `payments` topic. Skips failed payments, assigns couriers, and advances delivery stages every 5 seconds (PREPARING -> SHIPPED -> DELIVERED) by publishing to `order.status.updated`.

**Port**: `3003` (Worker)

---

## 🧭 Navigation

- **[← Back to Root](../../README.md)**
- **Services**:
  - [API Gateway](../api-gateway/README.md)
  - [Auth Service](../auth-service/README.md)
  - [Order Service](../order-service/README.md)
  - [Payment Service](../payment-service/README.md)
  - [Product Service](../product-service/README.md)
  - [Search Service](../search-service/README.md)
  - [Analytics Service](../analytics-service/README.md)
- **Packages & Tools**:
  - [Shared Package](../../shared/README.md)
  - [Web Frontend](../../web/README.md)
  - [Postman API Suite](../../postman/README.md)
