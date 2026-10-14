import {
  createKafkaConsumer,
  TOPICS,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
} from "@ecommerce/shared";
import type { PaymentProcessed } from "@ecommerce/shared";
import { env } from "../config/env";
import { processDelivery } from "../services/delivery.service";

export const paymentConsumer = createKafkaConsumer(
  {
    clientId: "delivery-service",
    brokers: env.kafkaBrokers,
  },
  "delivery-service",
);

export async function startPaymentConsumer(): Promise<void> {
  await paymentConsumer.connect();

  console.log("[Delivery] Payment consumer connected to Kafka");

  await paymentConsumer.subscribe({
    topic: TOPICS.PAYMENTS,
    fromBeginning: true,
  });

  await paymentConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      kafkaMessagesConsumed.inc({
        topic: TOPICS.PAYMENTS,
        groupId: "delivery-service",
      });

      if (!message.value) {
        return;
      }

      try {
        const payment = JSON.parse(
          message.value.toString(),
        ) as PaymentProcessed;

        if (payment.status !== "SUCCESS") {
          console.log(
            `[Delivery] Payment failed for order: ${payment.orderId}, skipping delivery.`,
          );
          return;
        }

        console.log(
          `[Delivery] Received successful payment for order: ${payment.orderId}. Starting delivery...`,
        );

        void processDelivery(payment.orderId).catch((err) => {
          console.error(
            `[Delivery] Error processing delivery for order: ${payment.orderId}`,
            err,
          );
        });
      } catch (error) {
        kafkaConsumerErrors.inc({ topic, groupId: "delivery-service" });
        console.error("[Delivery] Error parsing payment message:", error);
      }
    },
  });
}
