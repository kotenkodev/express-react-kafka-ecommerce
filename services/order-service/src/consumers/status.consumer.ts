import {
  createKafkaConsumer,
  TOPICS,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
} from "@ecommerce/shared";
import { env } from "../config/env";
import { orderStatusUpdatedSchema } from "../schemas/order-status.schema";
import {
  applyOrderDLQ,
  applyOrderStatus,
  applyPaymentStatus,
} from "../services/order-status.service";
import { orderSSEController } from "../controllers/sse.controller";
import type {
  Order,
  OrderStatusUpdated,
  PaymentProcessed,
} from "@ecommerce/shared";
import { orderProducer } from "../producers/order.producer";

export const statusConsumer = createKafkaConsumer(
  {
    clientId: "order-service",
    brokers: env.kafkaBrokers,
  },
  "order-service",
);

export async function startStatusConsumer(): Promise<void> {
  await statusConsumer.connect();

  await statusConsumer.subscribe({
    topics: [TOPICS.ORDER_STATUS_UPDATED, TOPICS.PAYMENTS, TOPICS.ORDER_DLQ],
    fromBeginning: true,
  });

  await statusConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      kafkaMessagesConsumed.inc({ topic, groupId: "order-service" });

      if (!message.value) return;

      try {
        switch (topic) {
          case TOPICS.ORDER_STATUS_UPDATED: {
            let event: OrderStatusUpdated;
            try {
              const payload: unknown = JSON.parse(message.value.toString());
              event = orderStatusUpdatedSchema.parse(payload);

              if (message.key?.toString() !== event.orderId) {
                throw new Error("Order status message key must match orderId");
              }
            } catch (error) {
              const sourceId = `${topic}:${partition}:${message.offset}`;
              await orderProducer.send({
                topic: "order.status.updated.dlq",
                acks: -1,
                messages: [
                  {
                    key: sourceId,
                    value: JSON.stringify({
                      sourceTopic: topic,
                      sourcePartition: partition,
                      sourceOffset: message.offset,
                      originalKey: message.key?.toString() ?? null,
                      originalValue: message.value?.toString() ?? null,
                      error:
                        error instanceof Error ? error.message : String(error),
                      failedAt: new Date().toISOString(),
                    }),
                  },
                ],
              });
              console.warn(`Invalid status event quarantined: ${sourceId}`);
              return;
            }

            const order = await applyOrderStatus(event);

            if (!order) return;

            if (order) broadcastOrder(order, event.updatedAt);

            break;
          }
          case TOPICS.PAYMENTS: {
            const payment = JSON.parse(
              message.value.toString(),
            ) as PaymentProcessed;
            const order = await applyPaymentStatus(payment);
            if (!order) return;

            if (order) broadcastOrder(order, payment.processedAt);
            break;
          }
          case TOPICS.ORDER_DLQ: {
            const dlq = JSON.parse(message.value.toString()) as {
              originalMessage?: { orderId?: string };
              failedAt?: string;
            };
            const orderId =
              message.key?.toString() || dlq.originalMessage?.orderId;
            if (!orderId) return;

            const failedAt = dlq.failedAt || new Date().toISOString();
            const order = await applyOrderDLQ(orderId, failedAt);

            if (order) broadcastOrder(order, failedAt);

            break;
          }
          default:
            console.warn(`[Order Consumer] Unhandled topic: ${topic}`);
        }
      } catch (error) {
        kafkaConsumerErrors.inc({ topic, groupId: "order-service" });
        console.error(
          `[Order Consumer] Error processing topic ${topic}:`,
          error,
        );
      }
    },
  });
}

function broadcastOrder(order: Order, updatedAt: string) {
  orderSSEController.broadcastOrderStatus({
    id: order.id,
    userId: order.userId,
    status: order.status,
    courier: order.courier ?? undefined,
    updatedAt,
  });
}
