import { z } from "@ecommerce/shared";

export const productQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    category: z.string().trim().min(1, "Category cannot be empty").optional(),
    minPrice: z.coerce.number().min(0, "Price cannot be negative").optional(),
    maxPrice: z.coerce.number().min(0, "Price cannot be negative").optional(),
    inStock: z.preprocess((val) => {
      if (val === "true" || val === "1") return true;
      if (val === "false" || val === "0") return false;
      return val;
    }, z.boolean().optional()),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: "minPrice cannot be greater than maxPrice",
      path: ["minPrice"],
    },
  );

export type ProductQueryInput = z.infer<typeof productQuerySchema>;
