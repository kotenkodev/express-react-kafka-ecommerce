import { publishToDLQ } from "@ecommerce/shared";
import type { OrderCreated } from "@ecommerce/shared";
import { paymentProducer } from "./payment.producer";

export async function publishPaymentToDLQ(
  order: OrderCreated,
  error: unknown,
  retryCount: number = 3,
): Promise<void> {
  await publishToDLQ(paymentProducer, order, error, retryCount);
}
