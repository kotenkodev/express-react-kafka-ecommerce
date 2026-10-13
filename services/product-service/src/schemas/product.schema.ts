import { z } from "@ecommerce/shared";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  category: z.string().trim().min(1, "Category cannot be empty"),
  description: z.string().trim().min(1, "Description cannot be empty"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
});

export type ProductCreateInput = z.infer<typeof productSchema>;

export const productUpdateSchema = productSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
