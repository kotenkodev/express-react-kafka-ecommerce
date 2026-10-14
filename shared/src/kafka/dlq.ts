import type { Producer } from "kafkajs";
import type { DeadLetterMessage } from "../types/events";
import { TOPICS } from "../types";

export async function publishToDLQ<T extends { orderId: string }>(
  producer: Producer,
  originalMessage: T,
  error: unknown,
  retryCount: number,
): Promise<void> {
  const message: DeadLetterMessage<T> = {
    originalMessage,
    error: error instanceof Error ? error.message : String(error),
    retryCount,
    failedAt: new Date().toISOString(),
  };

  await producer.send({
    topic: TOPICS.ORDER_DLQ,
    acks: -1,
    messages: [
      {
        key: originalMessage.orderId,
        value: JSON.stringify(message),
      },
    ],
  });
}
