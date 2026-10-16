import type {
  OrderCreated,
  OrderStatusUpdated,
  PaymentProcessed,
} from "@ecommerce/shared";
import { esClient, ORDERS_INDEX } from "../config/elasticsearch";

export interface OrderDocument {
  orderId: string;
  userId?: string;
  items?: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount?: number;
  status: string;
  courier?: string;
  paymentStatus?: "SUCCESS" | "FAILED";
  processedAt?: string;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt: string;
}

export class IndexerService {
  async upsertOrderCreated(event: OrderCreated): Promise<void> {
    const doc: Partial<OrderDocument> = {
      orderId: event.orderId,
      userId: event.userId,
      items: event.items,
      totalAmount: event.totalAmount,
      status: "PENDING",
      createdAt: event.createdAt,
      updatedAt: event.createdAt,
    };

    await esClient.update({
      index: ORDERS_INDEX,
      id: event.orderId,
      doc,
      doc_as_upsert: true,
    });

    console.log(`[Search Indexer] Indexed OrderCreated: ${event.orderId}`);
  }

  async upsertPaymentProcessed(event: PaymentProcessed): Promise<void> {
    const doc: Partial<OrderDocument> = {
      orderId: event.orderId,
      paymentStatus: event.status,
      processedAt: event.processedAt,
      failureReason: event.failureReason,
      updatedAt: event.processedAt,
    };

    if (event.status === "FAILED") {
      doc.status = "FAILED";
    }

    await esClient.update({
      index: ORDERS_INDEX,
      id: event.orderId,
      doc,
      doc_as_upsert: true,
    });

    console.log(`[Search Indexer] Indexed PaymentProcessed: ${event.orderId}`);
  }

  async upsertOrderStatusUpdated(event: OrderStatusUpdated): Promise<void> {
    const doc: Partial<OrderDocument> = {
      orderId: event.orderId,
      status: event.status,
      courier: event.courier,
      updatedAt: event.updatedAt,
    };

    await esClient.update({
      index: ORDERS_INDEX,
      id: event.orderId,
      doc,
      doc_as_upsert: true,
    });
    console.log(
      `[Search Indexer] Indexed OrderStatusUpdated: ${event.orderId} (${event.status})`,
    );
  }

  async upsertOrderDLQ(
    orderId: string,
    error: string,
    failedAt: string,
  ): Promise<void> {
    const doc: Partial<OrderDocument> = {
      orderId,
      status: "payment_failed",
      paymentStatus: "FAILED",
      failureReason: error,
      updatedAt: failedAt,
    };

    await esClient.update({
      index: ORDERS_INDEX,
      id: orderId,
      doc,
      doc_as_upsert: true,
    });
    console.log(
      `[Search Indexer] Indexed OrderDLQ: ${orderId} (payment_failed)`,
    );
  }
}

export const indexerService = new IndexerService();
