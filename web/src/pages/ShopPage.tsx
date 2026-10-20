import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getProducts } from "@/features/products/api/products.api";
import ProductGrid from "@/features/products/components/ProductGrid";
import { useCartStore } from "@/features/cart/store/cartStore";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { RefreshCw, PackageSearch } from "lucide-react";

const CatalogError = ({
  error,
  onRetry,
  isRetrying,
}: {
  error: Error | null;
  onRetry: () => void;
  isRetrying: boolean;
}) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
      <PackageSearch className="h-5 w-5" />
    </div>
    <h2 className="text-sm font-semibold text-foreground">
      Failed to load catalog
    </h2>
    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
      {getErrorMessage(error)}
    </p>
    <Button
      variant="outline"
      size="sm"
      className="mt-3 text-xs"
      onClick={onRetry}
      disabled={isRetrying}
    >
      <RefreshCw
        className={`h-3 w-3 mr-1.5 ${isRetrying ? "animate-spin" : ""}`}
      />
      Try again
    </Button>
  </div>
);

const LoadingMoreIndicator = () => (
  <div className="flex justify-center items-center py-4 text-xs text-muted-foreground">
    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2 text-primary" />
    Loading more products...
  </div>
);

const EndOfCatalogIndicator = () => (
  <p className="text-center text-xs text-muted-foreground pt-2">
    You've reached the end of the catalog.
  </p>
);

export default function ShopPage() {
  const { addItem } = useCartStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["shop-products"],
    queryFn: ({ pageParam = 1 }) => getProducts({ page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const products = data ? data.pages.flatMap((page) => page.products) : [];

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

      {error && products.length === 0 ? (
        <CatalogError
          error={error}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : (
        <>
          <ProductGrid
            products={products}
            isLoading={isLoading && products.length === 0}
            onAddToCart={addItem}
          />

          <div ref={loadMoreRef} className="h-4" aria-hidden="true" />

          {isFetchingNextPage && <LoadingMoreIndicator />}

          {!hasNextPage && products.length > 0 && <EndOfCatalogIndicator />}
        </>
      )}
    </div>
  );
}
