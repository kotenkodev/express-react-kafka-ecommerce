import { Kafka } from "kafkajs";
import type { Consumer, Producer } from "kafkajs";

type KafkaClientOptions = {
  clientId: string;
  brokers: string[];
};

export function createKafkaClient(options: KafkaClientOptions) {
  if (!options.clientId) {
    throw new Error("Kafka clientId is required");
  }

  if (
    options.brokers.length === 0 ||
    options.brokers.some((broker) => !broker.trim())
  ) {
    throw new Error("At least one non-empty Kafka broker is required");
  }

  return new Kafka({
    clientId: options.clientId,
    brokers: options.brokers,
    retry: {
      initialRetryTime: 300,
      retries: 5,
    },
  });
}

export function createKafkaProducer(options: KafkaClientOptions): Producer {
  return createKafkaClient(options).producer({ allowAutoTopicCreation: false });
}

export function createKafkaConsumer(
  options: KafkaClientOptions,
  groupId: string,
): Consumer {
  if (!groupId) {
    throw new Error("Kafka groupId is required");
  }
  return createKafkaClient(options).consumer({
    allowAutoTopicCreation: false,
    groupId,
  });
}
