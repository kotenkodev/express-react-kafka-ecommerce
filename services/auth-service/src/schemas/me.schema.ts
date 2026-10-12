import { z } from "@ecommerce/shared";

export const meQuerySchema = z.object({}).strict();

export type MeQuery = z.output<typeof meQuerySchema>;
