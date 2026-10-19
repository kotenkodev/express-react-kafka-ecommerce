import * as yup from "yup";

const emptyStringToUndefined = (value: any, originalValue: string) =>
  originalValue === "" ? undefined : value;

export const productQuerySchema = yup.object({
  q: yup.string().trim().optional(),

  category: yup.string().trim().min(1, "Category cannot be empty").optional(),

  minPrice: yup
    .number()
    .transform(emptyStringToUndefined)
    .typeError("minPrice must be a valid number")
    .min(0, "Price cannot be negative")
    .optional()
    .test(
      "is-less-or-equal",
      "minPrice cannot be greater than maxPrice",
      function (minPrice) {
        const { maxPrice } = this.parent;
        if (minPrice !== undefined && maxPrice !== undefined) {
          return minPrice <= maxPrice;
        }
        return true;
      },
    ),

  maxPrice: yup
    .number()
    .transform(emptyStringToUndefined)
    .typeError("maxPrice must be a valid number")
    .min(0, "Price cannot be negative")
    .optional(),

  inStock: yup
    .boolean()
    .transform((value, originalValue) => {
      if (originalValue === "true" || originalValue === "1") return true;
      if (originalValue === "false" || originalValue === "0") return false;
      if (originalValue === "") return undefined;
      return value;
    })
    .optional(),

  page: yup
    .number()
    .transform(emptyStringToUndefined)
    .integer("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1)
    .optional(),

  limit: yup
    .number()
    .transform(emptyStringToUndefined)
    .integer("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(50)
    .optional(),
});

export type ProductQueryInput = yup.InferType<typeof productQuerySchema>;
