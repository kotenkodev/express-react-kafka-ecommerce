import { prisma } from "@ecommerce/shared";
import type {
  Order,
  OrderStatusUpdated,
  PaymentProcessed,
} from "@ecommerce/shared";

type DeliveryStage = OrderStatusUpdated["status"];
type DatabaseStatus = Order["status"];

const allowedPreviousStatuses: Record<DeliveryStage, DatabaseStatus[]> = {
  PREPARING: ["PENDING", "PAID"],
  SHIPPED: ["PENDING", "PAID", "PREPARING"],
  DELIVERED: ["PENDING", "PAID", "PREPARING", "SHIPPED"],
};

export async function applyOrderStatus(
  event: OrderStatusUpdated,
): Promise<Order | null> {
  const eventTime = new Date(event.updatedAt);

  return prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: {
        id: event.orderId,
        status: {
          in: allowedPreviousStatuses[event.status],
        },
        OR: [{ statusUpdatedAt: null }, { statusUpdatedAt: { lt: eventTime } }],
      },
      data: {
        status: event.status,
        courier: event.courier,
        statusUpdatedAt: eventTime,
      },
    });

    const order = await tx.order.findUnique({
      where: { id: event.orderId },
    });

    if (!order) {
      throw new Error(`Order ${event.orderId} not found`);
    }

    return result.count === 0 ? null : order;
  });
}

export async function applyPaymentStatus(
  event: PaymentProcessed,
): Promise<Order | null> {
  const eventTime = new Date(event.processedAt);

  return prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id: event.orderId },
    });

    if (!existingOrder) {
      console.warn(`[Payment] Order ${event.orderId} not found`);
      return null;
    }

    if (event.status === "SUCCESS") {
      if (
        existingOrder.paymentStatus === "SUCCESS" &&
        existingOrder.status !== "PENDING"
      ) {
        return null;
      }

      const shouldAdvanceStatus = existingOrder.status === "PENDING";
      const newStatus = shouldAdvanceStatus ? "PAID" : existingOrder.status;

      const shouldUpdateTimestamp =
        !existingOrder.statusUpdatedAt ||
        (shouldAdvanceStatus && eventTime > existingOrder.statusUpdatedAt);

      return tx.order.update({
        where: { id: event.orderId },
        data: {
          paymentStatus: "SUCCESS",
          status: newStatus,
          ...(shouldUpdateTimestamp ? { statusUpdatedAt: eventTime } : {}),
        },
      });
    } else {
      const activeDeliveryStatuses: DatabaseStatus[] = [
        "PREPARING",
        "SHIPPED",
        "DELIVERED",
      ];

      if (
        existingOrder.paymentStatus === "SUCCESS" ||
        activeDeliveryStatuses.includes(existingOrder.status)
      ) {
        console.warn(
          `[Payment] Ignored payment failure for order ${event.orderId} because order is already paid or active in delivery (${existingOrder.status})`,
        );
        return null;
      }

      if (
        existingOrder.statusUpdatedAt &&
        existingOrder.statusUpdatedAt > eventTime
      ) {
        console.warn(
          `[Payment] Ignored stale payment failure for order ${event.orderId}`,
        );
        return null;
      }

      return tx.order.update({
        where: { id: event.orderId },
        data: {
          status: "FAILED",
          paymentStatus: "FAILED",
          statusUpdatedAt: eventTime,
        },
      });
    }
  });
}

export async function applyOrderDLQ(
  orderId: string,
  failedAt: string,
): Promise<Order | null> {
  const eventTime = new Date(failedAt);

  return prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      console.warn(`[DLQ] Order ${orderId} not found`);
      return null;
    }

    const protectedStatuses: DatabaseStatus[] = [
      "PAID",
      "PREPARING",
      "SHIPPED",
      "DELIVERED",
    ];

    if (
      existingOrder.paymentStatus === "SUCCESS" ||
      protectedStatuses.includes(existingOrder.status)
    ) {
      console.warn(
        `[DLQ] Ignored DLQ event for order ${orderId} because order is already paid or fulfillment is active (${existingOrder.status})`,
      );
      return null;
    }

    if (
      existingOrder.statusUpdatedAt &&
      existingOrder.statusUpdatedAt >= eventTime
    ) {
      console.warn(
        `[DLQ] Ignored stale DLQ event for order ${orderId} (eventTime: ${failedAt}, statusUpdatedAt: ${existingOrder.statusUpdatedAt.toISOString()})`,
      );
      return null;
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "FAILED",
        paymentStatus: "FAILED",
        statusUpdatedAt: eventTime,
      },
    });
  });
}
