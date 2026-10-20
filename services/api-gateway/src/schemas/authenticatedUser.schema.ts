import { z } from "zod";
import type { AuthenticatedUser } from "@ecommerce/shared";

export const authenticatedUserSchema: z.ZodType<AuthenticatedUser> = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "user"]),
  email: z.string().email().optional(),
});
