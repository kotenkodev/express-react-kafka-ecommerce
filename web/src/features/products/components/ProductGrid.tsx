import { PackageSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "../types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onAddToCart?: (product: Product) => void;
}

export default function ProductGrid({
  products,
  isLoading = false,
  onAddToCart,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl border border-border/60 overflow-hidden bg-card p-0 shadow-xs"
          >
            <Skeleton className="h-44 w-full rounded-none" />
            <div className="p-4 space-y-2.5">
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-2/3 rounded-md" />
            </div>
            <div className="mt-auto border-t border-border/40 p-4 flex items-center justify-between bg-muted/10">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border/70 rounded-3xl bg-muted/20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
          <PackageSearch className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          No products found
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          We couldn't find any products matching your criteria. Try adjusting
          your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
