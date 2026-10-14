import {
  createKafkaConsumer,
  TOPICS,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
  sleep,
} from "@ecommerce/shared";
import type { OrderCreated, PaymentProcessed } from "@ecommerce/shared";
import { env } from "../config/env";
import { simulatePayment } from "../services/payment.simulator";
import { publishPaymentProcessed } from "../producers/payment.producer";
import { publishPaymentToDLQ } from "../producers/dlq.producer";

export const orderConsumer = createKafkaConsumer(
  {
    clientId: "payment-service",
    brokers: env.kafkaBrokers,
  },
  "payment-service",
);

export async function startOrderConsumer(): Promise<void> {
  await orderConsumer.connect();

  await orderConsumer.subscribe({ topic: TOPICS.ORDERS, fromBeginning: true });

  await orderConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      kafkaMessagesConsumed.inc({
        topic: TOPICS.ORDERS,
        groupId: "payment-service",
      });

      if (!message.value) {
        return;
      }

      let order: OrderCreated;
      try {
        order = JSON.parse(message.value.toString()) as OrderCreated;
      } catch (err) {
        kafkaConsumerErrors.inc({ topic, groupId: "payment-service" });
        console.error("Failed to parse order message:", err);
        return;
      }

      console.log(`[Payment] Processing payment for order: ${order.orderId}`);

      const maxRetries = 3;
      const backoffTimes = [1000, 2000, 4000];
      let lastResult: PaymentProcessed | null = null;
      let attempt = 0;

      for (attempt = 0; attempt < maxRetries; attempt++) {
        lastResult = await simulatePayment(order.orderId);

        if (lastResult.status === "SUCCESS") {
          console.log(
            `[Payment] Payment successful for order: ${order.orderId}, paymentId: ${lastResult.paymentId}`,
          );
          await publishPaymentProcessed(lastResult);
          return;
        }

        console.warn(
          `[Payment] Order ${order.orderId} payment FAILED on attempt ${attempt + 1}: ${lastResult.failureReason}`,
        );

        if (attempt < maxRetries - 1) {
          const delay = backoffTimes[attempt];
          console.log(`[Payment] Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }

      console.error(
        `[Payment] Order ${order.orderId} failed after ${maxRetries} retries. Routing to DLQ.`,
      );

      const errorMessage =
        lastResult?.failureReason ?? "Payment failed after maximum retries";

      await publishPaymentToDLQ(order, errorMessage, attempt);

      if (lastResult) {
        await publishPaymentProcessed(lastResult);
      }
    },
  });
}
