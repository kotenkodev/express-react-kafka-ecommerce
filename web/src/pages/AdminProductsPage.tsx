import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminProductForm from "@/features/products/components/AdminProductForm";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "@/features/products/api/products.api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/features/products/types";
import { ProductTable } from "@/features/products/components/ProductTable";
import { DeleteProductConfirmation } from "@/features/products/components/DeleteProductConfirmation";
import PageMeta from "@/components/PageMeta";

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  const [isFormOpen, setIsDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getProducts(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const products = productsData?.products || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsConfirmationOpen(false);
      setProductToDelete(null);
      toast.success("Product deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete product. Please try again.");
    },
  });

  function handleDelete(product: Product) {
    setProductToDelete(product);
    setIsConfirmationOpen(true);
  }

  async function handleConfirmDelete() {
    if (!productToDelete || deleteMutation.isPending) return;
    deleteMutation.mutate(productToDelete.id);
  }

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, values);
      } else {
        await createProduct(values);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
      toast.success(
        `Product ${selectedProduct ? "updated" : "created"} successfully!`,
      );
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(
        err,
        "Failed to perform product action. Please try again.",
      );
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title="Product Catalog Management (Admin)"
        description="Add, update, or remove products from the catalog, adjust inventory stock, and configure categories."
      />
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
        isLoading={isProductsLoading}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <DeleteProductConfirmation
        open={isConfirmationOpen}
        productName={productToDelete?.name ?? ""}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          setIsConfirmationOpen(open);
          if (!open) setProductToDelete(null);
        }}
      />

      <AdminProductForm
        categories={categories}
        open={isFormOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
