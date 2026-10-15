import { z } from "@ecommerce/shared";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .min(0, "Price cannot be negative")
    .max(99999999.99, "Price exceeds database limit")
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      "Price can have at most 2 decimal places",
    ),
  category: z.string().trim().min(1, "Category cannot be empty"),
  description: z.string().trim().min(1, "Description cannot be empty"),
  stock: z
    .number({
      required_error: "Stock is required",
      invalid_type_error: "Stock must be a number",
    })
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .max(2147483647, "Stock exceeds 32-bit integer limit"),
});

export type ProductCreateInput = z.infer<typeof productSchema>;

export const productUpdateSchema = productSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
