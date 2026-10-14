import {
  createKafkaConsumer,
  TOPICS,
  kafkaMessagesConsumed,
  kafkaConsumerErrors,
} from "@ecommerce/shared";
import { env } from "../../config/env";
import { orderStatusUpdatedSchema } from "../../schemas/order-status.schema";
import { applyOrderStatus } from "../../services/order-status.service";
import { orderSSEController } from "../../controllers/sse.controller";
import type { OrderStatusUpdated } from "@ecommerce/shared";
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
    topic: TOPICS.ORDER_STATUS_UPDATED,
    fromBeginning: true,
  });

  await statusConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      kafkaMessagesConsumed.inc({ topic, groupId: "order-service" });
      let event: OrderStatusUpdated;

      try {
        if (!message.value) {
          throw new Error("Order status event has no value");
        }

        const payload: unknown = JSON.parse(message.value.toString());
        event = orderStatusUpdatedSchema.parse(payload);

        if (message.key?.toString() !== event.orderId) {
          throw new Error("Order status message key must match orderId");
        }
      } catch (error) {
        kafkaConsumerErrors.inc({ topic, groupId: "order-service" });
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
                error: error instanceof Error ? error.message : String(error),
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

      orderSSEController.broadcastOrderStatus({
        id: order.id,
        userId: order.userId,
        status: order.status,
        courier: order.courier ?? undefined,
        updatedAt: order.statusUpdatedAt?.toISOString() ?? event.updatedAt,
      });
    },
  });
}
