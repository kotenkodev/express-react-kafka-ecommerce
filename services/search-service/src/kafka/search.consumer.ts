import {
  createKafkaConsumer,
  TOPICS,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
} from "@ecommerce/shared";
import type {
  DeadLetterMessage,
  OrderCreated,
  OrderStatusUpdated,
  PaymentProcessed,
} from "@ecommerce/shared";
import { env } from "../config/env";
import { indexerService } from "../services/indexer.service";

export const eventConsumer = createKafkaConsumer(
  {
    clientId: "search-service",
    brokers: env.kafkaBrokers,
  },
  "search-service",
);

export async function startEventConsumer(): Promise<void> {
  await eventConsumer.connect();

  console.log("[Search] Search consumer connected to Kafka");

  await eventConsumer.subscribe({
    topics: [
      TOPICS.ORDERS,
      TOPICS.ORDER_STATUS_UPDATED,
      TOPICS.PAYMENTS,
      TOPICS.ORDER_DLQ,
    ],
    fromBeginning: true,
  });

  await eventConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      kafkaMessagesConsumed.inc({ topic, groupId: "search-service" });

      if (!message.value) {
        return;
      }

      try {
        const rawEvent = message.value.toString();

        switch (topic) {
          case TOPICS.ORDERS: {
            const event = JSON.parse(rawEvent) as OrderCreated;
            await indexerService.upsertOrderCreated(event);
            break;
          }
          case TOPICS.PAYMENTS: {
            const event = JSON.parse(rawEvent) as PaymentProcessed;
            await indexerService.upsertPaymentProcessed(event);
            break;
          }
          case TOPICS.ORDER_STATUS_UPDATED: {
            const event = JSON.parse(rawEvent) as OrderStatusUpdated;
            await indexerService.upsertOrderStatusUpdated(event);
            break;
          }
          case TOPICS.ORDER_DLQ: {
            const dlq = JSON.parse(rawEvent) as DeadLetterMessage<{
              orderId?: string;
            }>;

            const orderId =
              message.key?.toString() || dlq.originalMessage?.orderId;

            if (orderId) {
              const failedAt = dlq.failedAt || new Date().toISOString();
              const error = dlq.error || "Payment failed after retries";
              await indexerService.upsertOrderDLQ(orderId, error, failedAt);
            }
            break;
          }
          default:
            console.warn(`[Search Consumer] Unhandled topic: ${topic}`);
        }
      } catch (error) {
        kafkaConsumerErrors.inc({
          topic: topic,
          groupId: "search-service",
        });
        console.error("[Search] Error parsing event message:", error);
      }
    },
  });
}
