import { z } from "@ecommerce/shared";

export const ORDER_SEARCH_STATUSES = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "FAILED",
  "payment_failed",
  "CANCELED",
] as const;

export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, "Query must be at least 1 character long")
    .optional(),
  q: z.string().optional(),
  status: z.enum(ORDER_SEARCH_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
