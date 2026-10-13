import { z } from "@ecommerce/shared";

export const productParamsSchema = z.object({
  id: z.string().uuid("Invalid UUID"),
});

export type ProductParamsInput = z.infer<typeof productParamsSchema>;
