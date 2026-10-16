import { z } from "@ecommerce/shared";

export const searchIdSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

export type SearchIdInput = z.infer<typeof searchIdSchema>;
