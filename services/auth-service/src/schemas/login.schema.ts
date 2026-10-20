import { z } from "@ecommerce/shared";

export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    email: z.string().trim().email().max(254).toLowerCase().optional(),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters")
      .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
        message: "Password must not exceed 72 UTF-8 bytes",
      }),
  })
  .refine(
    (data) =>
      Number(data.username !== undefined) + Number(data.email !== undefined) ===
      1,
    {
      message: "Provide exactly one of username or email",
    },
  );

export type LoginInput = z.infer<typeof loginSchema>;
