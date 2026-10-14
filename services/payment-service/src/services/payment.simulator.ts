import { PaymentProcessed, sleep } from "@ecommerce/shared";
import { randomUUID } from "node:crypto";

export async function simulatePayment(
  orderId: string,
): Promise<PaymentProcessed> {
  await sleep(Math.floor(1000 + Math.random() * 2000));

  const isSuccess = Math.random() < 0.8;

  return {
    orderId,
    paymentId: randomUUID(),
    status: isSuccess ? "SUCCESS" : "FAILED",
    processedAt: new Date().toISOString(),
    failureReason: isSuccess ? null : "Insufficient funds",
  };
}
