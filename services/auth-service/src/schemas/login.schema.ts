import { z } from "@ecommerce/shared";

export const loginSchema = z
  .object({
    username: z.string().trim().min(3).max(50).optional(),
    email: z.string().trim().email().optional(),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must not exceed 100 characters"),
  })
  .refine((data) => Boolean(data.username || data.email), {
    message: "Either username or email is required",
  });

export type LoginInput = z.infer<typeof loginSchema>;
