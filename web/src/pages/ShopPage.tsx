import { getProducts } from "@/features/products/api/products.api";
import ProductGrid from "@/features/products/components/ProductGrid";
import { Product } from "@/features/products/types";
import { useCartStore } from "@/features/cart/store/cartStore";
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/error";
import { toast } from "sonner";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCartStore();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const limit = 12;

  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getProducts({ page, limit });

        if (ignore) return;

        setProducts((previous) =>
          page === 1 ? data.products : [...previous, ...data.products],
        );

        setHasMore(page < data.pagination.totalPages);
      } catch (err: any) {
        if (!ignore) {
          const errorMsg = getErrorMessage(
            err,
            "Failed to load products. Please try again.",
          );
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void fetchProducts();

    return () => {
      ignore = true;
    };
  }, [page, retry]);

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || isLoading || !hasMore || error) return;

    let triggered = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || triggered) return;

        triggered = true;
        observer.disconnect();

        setIsLoading(true);
        setPage((previous) => previous + 1);
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isLoading, hasMore, error]);

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
        isLoading={isLoading && products.length === 0}
        onAddToCart={addItem}
      />

      <div ref={loadMoreRef} className="h-1" aria-hidden="true" />

      {isLoading && products.length > 0 && (
        <p role="status" className="text-center text-muted-foreground">
          Loading more products...
        </p>
      )}

      {error && (
        <div className="text-center">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              setRetry((previous) => previous + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p className="text-center text-muted-foreground">
          You’ve reached the end.
        </p>
      )}
    </div>
  );
}
