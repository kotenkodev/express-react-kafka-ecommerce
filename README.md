# Kafka Express E-Commerce Platform

Event-driven microservices e-commerce platform communicating asynchronously via Apache Kafka with JWT authentication, role-based access control, Elasticsearch full-text indexing, Prometheus analytics, and a React frontend.

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

---

## 📡 API & Postman Documentation

A fully documented, automated Postman test suite and specification is provided in the [`postman/`](./postman/) directory:

- **[Postman Master Guide](./postman/README.md)**: Architecture, quickstart, automated variable chaining, and Newman CI/CD.
- **[System Architecture & Overview](./postman/documents/01-Architecture-and-Overview.md)**: Service directory, ports, and data flow.
- **[Authentication & Security Guide](./postman/documents/02-Authentication-and-Security.md)**: JWT lifecycles, Redis sessions, and header injection.
- **[End-to-End Testing Workflows](./postman/documents/03-End-to-End-Testing-Workflows.md)**: Chained requests and collection runner instructions.
- **[Kafka Event Flow & SSE Stream](./postman/documents/04-Kafka-Event-Flow-and-SSE.md)**: Event schemas, retry backoff, DLQ, and Server-Sent Events.

### Run API Tests via Newman
```bash
npm run test:postman
```
