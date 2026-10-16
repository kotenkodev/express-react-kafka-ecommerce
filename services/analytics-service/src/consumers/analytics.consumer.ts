import {
  createKafkaConsumer,
  TOPICS,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
  paymentSuccessTotal,
  paymentFailureTotal,
  orderProcessingDuration,
} from "@ecommerce/shared";
import type { Order, OrderCreated, PaymentProcessed } from "@ecommerce/shared";
import { env } from "../config/env";
import { slidingWindowService } from "../services/slidingWindow";

export const analyticsConsumer = createKafkaConsumer(
  {
    clientId: "analytics-service",
    brokers: env.kafkaBrokers,
  },
  "analytics-service",
);

export async function startAnalyticsConsumer() {
  await analyticsConsumer.connect();

  await analyticsConsumer.subscribe({
    topics: [TOPICS.ORDERS, TOPICS.PAYMENTS],
    fromBeginning: true,
  });

  await analyticsConsumer.run({
    eachMessage: async ({ message, partition, topic }) => {
      kafkaMessagesConsumed.inc({ topic, groupId: "analytics-service" });

      if (!message.value) {
        return;
      }

      try {
        const rawEvent = message.value.toString();

        switch (topic) {
          case TOPICS.ORDERS: {
            const order = JSON.parse(rawEvent) as OrderCreated;

            slidingWindowService.recordOrder(order);

            break;
          }
          case TOPICS.PAYMENTS: {
            const payment = JSON.parse(rawEvent) as PaymentProcessed;
            const { processingMs } =
              slidingWindowService.recordPayment(payment);

            if (payment.status === "SUCCESS") {
              paymentSuccessTotal.inc();
            } else if (payment.status === "FAILED") {
              paymentFailureTotal.inc();
            }

            if (typeof processingMs === "number") {
              orderProcessingDuration.observe(processingMs / 1000);
            }

            break;
          }
          default:
            console.warn(`[Analytics Consumer] Unhandled topic: ${topic}`);
        }
      } catch (error) {
        kafkaConsumerErrors.inc({ topic, groupId: "analytics-service" });
        console.error(
          `[Analytics Consumer] Error processing event from ${topic}:`,
          error,
        );
      }
    },
  });
}
