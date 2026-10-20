import { z } from "@ecommerce/shared";

const timestamp = z.string().datetime({ offset: true }).refine(
  value => Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now(),
  "Timestamp must be valid and not in the future",
);
export const orderSchema = z.object({
  orderId: z.string().min(1),
  userId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().finite().nonnegative(),
  })),
  totalAmount: z.number().finite().nonnegative(),
  createdAt: timestamp,
});
export const paymentSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED"]),
  processedAt: timestamp,
  failureReason: z.string().nullable(),
});
