# Kafka Express E-Commerce Platform

Event-driven microservices e-commerce platform communicating asynchronously via Apache Kafka.

---

## 🧭 Navigation

| Component | Path | Role / Port |
| :--- | :--- | :--- |
| **API Gateway** | [services/api-gateway](./services/api-gateway/README.md) | Single entrypoint, JWT verify & reverse proxy (:8000) |
| **Auth Service** | [services/auth-service](./services/auth-service/README.md) | User auth, JWT & Redis refresh tokens (:3006) |
| **Order Service** | [services/order-service](./services/order-service/README.md) | Order management, Kafka producer & SSE stream (:3001) |
| **Payment Service** | [services/payment-service](./services/payment-service/README.md) | Kafka payment simulation worker (:3002) |
| **Delivery Service** | [services/delivery-service](./services/delivery-service/README.md) | Courier delivery stage pipeline (:3003) |
| **Product Service** | [services/product-service](./services/product-service/README.md) | Catalog management & categories (:3007) |
| **Search Service** | [services/search-service](./services/search-service/README.md) | Elasticsearch full-text order indexing (:3005) |
| **Analytics Service** | [services/analytics-service](./services/analytics-service/README.md) | Real-time sliding window stats & Prometheus (:3004) |
| **Shared Package** | [shared](./shared/README.md) | Prisma schema, singleton DB client & utilities |
| **Web Frontend** | [web](./web/README.md) | React 18 + Vite SPA (:5173 / :80) |
| **Postman API Suite** | [postman](./postman/README.md) | API collection, environment & automated tests |

---

## 🚀 Quick Start

```bash
# 1. Start all infrastructure and microservices with Docker Compose
npm run dev

# 2. Push database schema and seed initial data
npm run db:push
npm run db:seed
```

Default Admin Credentials: `admin@kafkashop.com` / `admin123`.

### Run API Tests via Newman
```bash
npm run test:postman
```
