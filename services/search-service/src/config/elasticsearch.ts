import { Client } from "@elastic/elasticsearch";
import { env } from "./env";

export const esClient = new Client({
  node: env.elasticsearchUrl,
});

export const ORDERS_INDEX = "orders";

export async function initElasticsearch(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: ORDERS_INDEX });

    if (!exists) {
      console.log(`[Search] Creating Elasticsearch index: ${ORDERS_INDEX}`);
      await esClient.indices.create({
        index: ORDERS_INDEX,
        mappings: {
          properties: {
            orderId: { type: "keyword" },
            userId: { type: "keyword" },
            status: { type: "keyword" },
            courier: {
              type: "text",
              fields: { keyword: { type: "keyword" } },
            },
            items: {
              properties: {
                productId: { type: "keyword" },
                quantity: { type: "integer" },
                price: { type: "double" },
              },
            },
            totalAmount: { type: "double" },
            paymentStatus: { type: "keyword" },
            processedAt: { type: "date" },
            failureReason: { type: "text" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
          },
        },
      });
      console.log(`[Search] Index '${ORDERS_INDEX}' created successfully`);
    } else {
      console.log(`[Search] Index '${ORDERS_INDEX}' already exists`);
    }
  } catch (error) {
    console.error(`[Search] Failed to initialize Elasticsearch index:`, error);
    throw error;
  }
}
