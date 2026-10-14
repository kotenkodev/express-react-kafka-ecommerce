# Payment Service

Asynchronous Kafka worker consuming from the `orders` topic. Simulates payment processing with 1–3s latency, 80% success rate, 3x exponential backoff retries (1s, 2s, 4s), and routing to `order.dlq` upon exhaustion.

**Port**: `3002` (Worker)

---

## 🧭 Navigation

- **[← Back to Root](../../README.md)**
- **Services**:
  - [API Gateway](../api-gateway/README.md)
  - [Auth Service](../auth-service/README.md)
  - [Order Service](../order-service/README.md)
  - [Delivery Service](../delivery-service/README.md)
  - [Product Service](../product-service/README.md)
  - [Search Service](../search-service/README.md)
  - [Analytics Service](../analytics-service/README.md)
- **Packages & Tools**:
  - [Shared Package](../../shared/README.md)
  - [Web Frontend](../../web/README.md)
  - [Postman API Suite](../../postman/README.md)
