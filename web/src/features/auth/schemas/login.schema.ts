import * as yup from "yup";

export const loginSchema = yup
  .object({
    username: yup
      .string()
      .trim()
      .typeError("Username must be a string")
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must not exceed 30 characters")
      .matches(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      )
      .optional(),
    email: yup
      .string()
      .trim()
      .typeError("Email must be a string")
      .email("Please enter a valid email address")
      .max(254, "Email must not exceed 254 characters")
      .lowercase()
      .optional(),
    password: yup
      .string()
      .typeError("Password must be a string")
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
  })
  .test(
    "username-or-email",
    "Provide exactly one of username or email",
    (data) =>
      Number(data?.username !== undefined && data?.username !== "") +
        Number(data?.email !== undefined && data?.email !== "") ===
      1,
  );

export type LoginInput = yup.InferType<typeof loginSchema>;
