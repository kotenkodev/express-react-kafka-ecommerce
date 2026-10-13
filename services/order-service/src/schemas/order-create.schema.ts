import { z } from "@ecommerce/shared";

export const orderItemSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const orderCreateSchema = z
  .array(orderItemSchema)
  .min(1, "Order must contain at least one item");

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
