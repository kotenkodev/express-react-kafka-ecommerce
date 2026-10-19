import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "@/features/products/api/products.api";
import { ProductTable } from "@/features/products/components/ProductTable";
import { Category, Product } from "@/features/products/types";
import { useEffect, useState } from "react";
import AdminProductForm from "@/features/products/components/AdminProductForm";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(productsRes.products);
        setCategories(categoriesRes);
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    if (selectedProduct) {
      await updateProduct(selectedProduct.id, values);
    } else {
      await createProduct(values);
    }
  };

  async function handleDelete(product: Product): Promise<void> {
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted successfully!");
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      const errorMsg = err.response?.data?.error || "Failed to delete product.";
      toast.error(errorMsg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your store's catalog, stock levels, and product details.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-2 shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      <ProductTable
        products={products}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />
      <AdminProductForm
        categories={categories}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
