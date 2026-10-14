import {
  createKafkaProducer,
  TOPICS,
  kafkaMessagesProduced,
  paymentSuccessTotal,
  paymentFailureTotal,
} from "@ecommerce/shared";
import type { PaymentProcessed } from "@ecommerce/shared";
import { env } from "../config/env";

export const paymentProducer = createKafkaProducer({
  clientId: "payment-service",
  brokers: env.kafkaBrokers,
});

export async function publishPaymentProcessed(event: PaymentProcessed) {
  await paymentProducer.send({
    topic: TOPICS.PAYMENTS,
    acks: -1,
    messages: [
      {
        key: event.orderId,
        value: JSON.stringify(event),
      },
    ],
  });

  kafkaMessagesProduced.inc({ topic: TOPICS.PAYMENTS });

  if (event.status === "SUCCESS") {
    paymentSuccessTotal.inc();
  } else {
    paymentFailureTotal.inc();
  }
}
