import * as yup from "yup";

export const loginSchema = yup
  .object({
    username: yup
      .string()
      .trim()
      .min(3)
      .max(30)
      .matches(/^[a-zA-Z0-9_]+$/)
      .optional(),
    email: yup.string().trim().email().max(254).lowercase().optional(),
    password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
  })
  .test(
    "username-or-email",
    "Provide exactly one of username or email",
    (data) =>
      Number(data?.username !== undefined) +
        Number(data?.email !== undefined) ===
      1,
  );

export type LoginInput = yup.InferType<typeof loginSchema>;
