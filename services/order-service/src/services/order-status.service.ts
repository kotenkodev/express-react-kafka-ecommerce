import { prisma } from "@ecommerce/shared";
import type { Order, OrderStatusUpdated } from "@ecommerce/shared";

type DeliveryStage = OrderStatusUpdated["status"];
type DatabaseStatus = Order["status"];

const allowedPreviousStatuses: Record<DeliveryStage, DatabaseStatus[]> = {
  PREPARING: ["PENDING", "PAID"],
  SHIPPED: ["PENDING", "PAID", "PREPARING", "PACKAGING"],
  DELIVERED: ["PENDING", "PAID", "PREPARING", "PACKAGING", "SHIPPED", "SHIPPING"],
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
