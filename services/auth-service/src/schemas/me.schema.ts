import { z } from "zod";

export const meQuerySchema = z.object({}).strict();

export type MeQuery = z.output<typeof meQuerySchema>;
