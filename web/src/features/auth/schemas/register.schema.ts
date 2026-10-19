import * as yup from "yup";

export const registerSchema = yup
  .object({
    username: yup
      .string()
      .typeError("Username must be a string")
      .required("Username is required")
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must not exceed 30 characters")
      .matches(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),

    firstName: yup
      .string()
      .typeError("First name must be a string")
      .required("First name is required")
      .trim()
      .min(1, "First name is required")
      .max(50, "First name must not exceed 50 characters"),

    lastName: yup
      .string()
      .typeError("Last name must be a string")
      .required("Last name is required")
      .trim()
      .min(1, "Last name is required")
      .max(50, "Last name must not exceed 50 characters"),

    email: yup
      .string()
      .typeError("Email must be a string")
      .required("Email is required")
      .trim()
      .email("Please enter a valid email address")
      .max(254, "Email must not exceed 254 characters")
      .lowercase(),

    password: yup
      .string()
      .typeError("Password must be a string")
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-z]/, "Password must contain a lowercase letter")
      .matches(/[A-Z]/, "Password must contain an uppercase letter")
      .matches(/[0-9]/, "Password must contain a number")
      .matches(/[^a-zA-Z0-9]/, "Password must contain a special character"),
    passwordConfirm: yup
      .string()
      .required("Please confirm your password")
      .oneOf([yup.ref("password")], "Passwords do not match"),
  })
  .required();

export type RegisterInput = yup.InferType<typeof registerSchema>;
