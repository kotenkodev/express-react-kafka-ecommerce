import client from "prom-client";

client.collectDefaultMetrics({ register: client.register });

export const metricsRegistry = client.register;

export const kafkaMessagesProduced =
  (client.register.getSingleMetric(
    "kafka_messages_produced_total",
  ) as client.Counter<"topic">) ||
  new client.Counter({
    name: "kafka_messages_produced_total",
    help: "Total messages produced to Kafka",
    labelNames: ["topic"],
  });

export const kafkaMessagesConsumed =
  (client.register.getSingleMetric(
    "kafka_messages_consumed_total",
  ) as client.Counter<"topic" | "groupId">) ||
  new client.Counter({
    name: "kafka_messages_consumed_total",
    help: "Total messages consumed from Kafka",
    labelNames: ["topic", "groupId"],
  });

export const kafkaConsumerErrors =
  (client.register.getSingleMetric(
    "kafka_consumer_errors_total",
  ) as client.Counter<"topic" | "groupId">) ||
  new client.Counter({
    name: "kafka_consumer_errors_total",
    help: "Total Kafka consumer errors",
    labelNames: ["topic", "groupId"],
  });

export const orderProcessingDuration =
  (client.register.getSingleMetric(
    "order_processing_duration_seconds",
  ) as client.Histogram<string>) ||
  new client.Histogram({
    name: "order_processing_duration_seconds",
    help: "End-to-end order processing duration in seconds",
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  });

export const paymentSuccessTotal =
  (client.register.getSingleMetric(
    "payment_success_total",
  ) as client.Counter<string>) ||
  new client.Counter({
    name: "payment_success_total",
    help: "Total successful payments",
  });

export const paymentFailureTotal =
  (client.register.getSingleMetric(
    "payment_failure_total",
  ) as client.Counter<string>) ||
  new client.Counter({
    name: "payment_failure_total",
    help: "Total failed payments",
  });

export const httpRequestsTotal =
  (client.register.getSingleMetric("http_requests_total") as client.Counter<
    "route" | "status_code"
  >) ||
  new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["route", "status_code"],
  });

export { client as promClient };
