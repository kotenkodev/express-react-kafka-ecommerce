import * as yup from "yup";

const emptyStringToUndefined = (value: any, originalValue: string) =>
  originalValue === "" ? undefined : value;

export const productSchema = yup.object({
  name: yup.string().trim().required("Name cannot be empty"),
  emoji: yup.string().trim().optional(),
  price: yup
    .number()
    .transform(emptyStringToUndefined)
    .typeError("Price must be a number")
    .required("Price is required")
    .min(0, "Price cannot be negative")
    .max(99999999.99, "Price exceeds database limit")
    .test(
      "max-decimals",
      "Price can have at most 2 decimal places",
      (val) =>
        val === undefined || val === null || Number(val.toFixed(2)) === val,
    ),

  category: yup.string().trim().required("Category cannot be empty"),

  description: yup.string().trim().required("Description cannot be empty"),

  stock: yup
    .number()
    .transform(emptyStringToUndefined)
    .typeError("Stock must be a number")
    .required("Stock is required")
    .integer("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .max(2147483647, "Stock exceeds 32-bit integer limit"),
});

export type ProductCreateInput = yup.InferType<typeof productSchema>;

export const productUpdateSchema = yup.object({
  name: yup.string().trim().min(1, "Name cannot be empty").optional(),
  emoji: yup.string().trim().optional(),
  price: yup
    .number()
    .transform(emptyStringToUndefined)
    .typeError("Price must be a number")
    .min(0, "Price cannot be negative")
    .max(99999999.99, "Price exceeds database limit")
    .test(
      "max-decimals",
      "Price can have at most 2 decimal places",
      (val) =>
        val === undefined || val === null || Number(val.toFixed(2)) === val,
    )
    .optional(),

  category: yup.string().trim().min(1, "Category cannot be empty").optional(),

  description: yup
    .string()
    .trim()
    .min(1, "Description cannot be empty")
    .optional(),

  stock: yup
    .number()
    .transform(emptyStringToUndefined)
    .typeError("Stock must be a number")
    .integer("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .max(2147483647, "Stock exceeds 32-bit integer limit")
    .optional(),
});

export type ProductUpdateInput = yup.InferType<typeof productUpdateSchema>;
