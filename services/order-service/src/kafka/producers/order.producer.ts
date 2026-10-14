import { createKafkaProducer, TOPICS, kafkaMessagesProduced } from "@ecommerce/shared";
import type { OrderCreated } from "@ecommerce/shared";
import { env } from "../../config/env";

export const orderProducer = createKafkaProducer({
  clientId: "order-service",
  brokers: env.kafkaBrokers,
});

export async function publishOrderCreated(event: OrderCreated): Promise<void> {
  await orderProducer.send({
    topic: TOPICS.ORDERS,
    acks: -1,
    messages: [
      {
        key: event.orderId,
        value: JSON.stringify(event),
      },
    ],
  });

  kafkaMessagesProduced.inc({ topic: TOPICS.ORDERS });
}
