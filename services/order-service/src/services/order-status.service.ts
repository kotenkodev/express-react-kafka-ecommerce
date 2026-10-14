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
  SHIPPED: ["PENDING", "PAID", "PREPARING", "PACKAGING"],
  DELIVERED: [
    "PENDING",
    "PAID",
    "PREPARING",
    "PACKAGING",
    "SHIPPED",
    "SHIPPING",
  ],
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
    if (event.status === "FAILED") {
      await tx.order.updateMany({
        where: {
          id: event.orderId,
          status: { in: ["PENDING", "PAID"] },
        },
        data: {
          status: "FAILED",
          paymentStatus: "FAILED",
          statusUpdatedAt: eventTime,
        },
      });
    } else {
      await tx.order.updateMany({
        where: {
          id: event.orderId,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          paymentStatus: "SUCCESS",
          statusUpdatedAt: eventTime,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: event.orderId },
    });
  });
}

export async function applyOrderDLQ(
  orderId: string,
  failedAt: string,
): Promise<Order | null> {
  const eventTime = new Date(failedAt);

  return prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: {
        id: orderId,
        status: { not: "DELIVERED" },
      },
      data: {
        status: "FAILED",
        paymentStatus: "FAILED",
        statusUpdatedAt: eventTime,
      },
    });

    return tx.order.findUnique({
      where: { id: orderId },
    });
  });
}
