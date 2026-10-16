import {
  createKafkaProducer,
  TOPICS,
  kafkaMessagesProduced,
} from "@ecommerce/shared";
import type { OrderStats } from "@ecommerce/shared";
import { env } from "../config/env";

export const statsProducer = createKafkaProducer({
  clientId: "analytics-service",
  brokers: env.kafkaBrokers,
});

export async function publishOrderStats(stats: OrderStats): Promise<void> {
  await statsProducer.send({
    topic: TOPICS.ORDER_STATS,
    acks: -1,
    messages: [
      {
        key: stats.windowStart,
        value: JSON.stringify(stats),
      },
    ],
  });

  kafkaMessagesProduced.inc({ topic: TOPICS.ORDER_STATS });
}
