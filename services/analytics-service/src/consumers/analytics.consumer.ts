import {
  createKafkaConsumer,
  TOPICS,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
  paymentSuccessTotal,
  paymentFailureTotal,
} from "@ecommerce/shared";
import { orderSchema, paymentSchema } from "./eventValidation";
import { env } from "../config/env";
import { slidingWindowService } from "../services/analyticsWindow";

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
        let event: unknown;
        try {
          event = JSON.parse(message.value.toString());
        } catch {
          kafkaConsumerErrors.inc({ topic, groupId: "analytics-service" });
          console.error("[Analytics Consumer] Rejected invalid JSON", { topic, partition, offset: message.offset });
          return;
        }
        const result = (topic === TOPICS.ORDERS ? orderSchema : paymentSchema).safeParse(event);
        if (!result.success) {
          kafkaConsumerErrors.inc({ topic, groupId: "analytics-service" });
          console.error("[Analytics Consumer] Rejected invalid event", { topic, partition, offset: message.offset, issues: result.error.issues });
          return;
        }

        switch (topic) {
          case TOPICS.ORDERS: {
            const order = orderSchema.parse(result.data);

            slidingWindowService.recordOrder(order);

            break;
          }
          case TOPICS.PAYMENTS: {
            const payment = paymentSchema.parse(result.data);
            const { accepted } =
              slidingWindowService.recordPayment(payment);

            if (!accepted) break;

            if (payment.status === "SUCCESS") {
              paymentSuccessTotal.inc();
            } else if (payment.status === "FAILED") {
              paymentFailureTotal.inc();
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
        throw error;
      }
    },
  });
}
