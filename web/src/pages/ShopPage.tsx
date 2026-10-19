import { getProducts } from "@/features/products/api/products.api";
import ProductGrid from "@/features/products/components/ProductGrid";
import { Product } from "@/features/products/types";
import { useCartStore } from "@/features/cart/store/cartStore";
import { useEffect, useState } from "react";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getProducts();
        setProducts(data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse our collection of curated items and add them to your cart.
        </p>
      </div>

      <ProductGrid
        products={products}
        isLoading={isLoading}
        onAddToCart={addItem}
      />
    </div>
  );
}
