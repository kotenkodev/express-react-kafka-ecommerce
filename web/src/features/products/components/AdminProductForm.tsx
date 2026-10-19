import { Category, Product } from "../types";
import { Button } from "@/components/ui/button";
import { useFormik } from "formik";
import {
  ProductCreateInput,
  productSchema,
  ProductUpdateInput,
} from "../schemas/product.schema";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmojiPicker } from "@/components/reui/emoji-picker";

interface AdminProductFormProps {
  open?: boolean;
  product: Product | null;
  onSubmit: (product: ProductCreateInput | ProductUpdateInput) => void;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  categories: Category[];
}

export default function AdminProductForm({
  open,
  categories,
  product,
  onSubmit,
  onOpenChange,
  isLoading,
}: AdminProductFormProps) {
  const isEdit = Boolean(product);

  const formik = useFormik({
    initialValues: {
      name: product?.name ?? "",
      emoji: product?.emoji ?? "📦",
      price: product ? Number(product.price) : 0,
      stock: product?.stock ?? 0,
      category:
        typeof product?.category === "object"
          ? product.category.name
          : (product?.category ?? ""),
      description: product?.description ?? "",
    },
    validationSchema: productSchema,
    onSubmit: async (values: ProductCreateInput | ProductUpdateInput) => {
      await onSubmit(values);
      onOpenChange?.(false);
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details and stock levels for this product."
              : "Fill in the details to add a new product to your catalog."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-4 overflow-hidden"
        >
          <div className="space-y-5 overflow-y-auto px-1 py-2 max-h-[60vh]">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.name && formik.errors.name
                      ? "border-destructive"
                      : ""
                  }
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs text-destructive">
                    {formik.errors.name as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <div>
                  <EmojiPicker
                    id="emoji"
                    name="emoji"
                    className="text-center text-xl h-10 w-16"
                    value={formik.values.emoji}
                    onEmojiSelect={(selection) =>
                      formik.setFieldValue("emoji", selection.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formik.values.category}
                onValueChange={(value) =>
                  formik.setFieldValue("category", value)
                }
              >
                <SelectTrigger
                  className={`w-full max-w-[200px] ${formik.touched.category && formik.errors.category ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Categories</SelectLabel>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {formik.touched.category && formik.errors.category && (
                <p className="text-xs text-destructive">
                  {formik.errors.category as string}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.price && formik.errors.price
                      ? "border-destructive"
                      : ""
                  }
                />
                {formik.touched.price && formik.errors.price && (
                  <p className="text-xs text-destructive">
                    {formik.errors.price as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formik.values.stock}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.stock && formik.errors.stock
                      ? "border-destructive"
                      : ""
                  }
                />
                {formik.touched.stock && formik.errors.stock && (
                  <p className="text-xs text-destructive">
                    {formik.errors.stock as string}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`resize-none ${formik.touched.description && formik.errors.description ? "border-destructive" : ""}`}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-xs text-destructive">
                  {formik.errors.description as string}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 mt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
