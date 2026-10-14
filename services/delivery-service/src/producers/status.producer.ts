import {
  createKafkaProducer,
  TOPICS,
  kafkaMessagesProduced,
} from "@ecommerce/shared";
import type { OrderStatusUpdated } from "@ecommerce/shared";
import { env } from "../config/env";

export const statusProducer = createKafkaProducer({
  clientId: "delivery-service",
  brokers: env.kafkaBrokers,
});

export async function publishOrderStatusUpdate(
  event: OrderStatusUpdated,
): Promise<void> {
  await statusProducer.send({
    topic: TOPICS.ORDER_STATUS_UPDATED,
    acks: -1,
    messages: [
      {
        key: event.orderId,
        value: JSON.stringify(event),
      },
    ],
  });

  kafkaMessagesProduced.inc({ topic: TOPICS.ORDER_STATUS_UPDATED });
}
