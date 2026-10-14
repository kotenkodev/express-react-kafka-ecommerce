import { z } from "@ecommerce/shared";
import type { OrderStatusUpdated } from "@ecommerce/shared";

export const orderStatusUpdatedSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["PREPARING", "SHIPPED", "DELIVERED"]),
  courier: z.string().trim().min(1),
  updatedAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<OrderStatusUpdated>;
