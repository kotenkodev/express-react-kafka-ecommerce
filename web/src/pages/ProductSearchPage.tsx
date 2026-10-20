import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/features/cart/store/cartStore";
import {
  getCategories,
  getProducts,
} from "@/features/products/api/products.api";
import { Pagination } from "@/components/Pagination";
import ProductGrid from "@/features/products/components/ProductGrid";
import { ProductQueryInput } from "@/features/products/schemas/product-query.schema";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  AlertCircle,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/error";
import PageMeta from "@/components/PageMeta";

export default function ProductSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCartStore();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const inStock = searchParams.get("inStock") === "true";

  const parsePrice = (value: string, fallback: number) => {
    const parsed = Number(value);
    return value !== "" && Number.isFinite(parsed) && parsed >= 0
      ? parsed
      : fallback;
  };
  const minimumPrice = parsePrice(minPrice, 0);
  const maximumPrice = Math.max(minimumPrice, parsePrice(maxPrice, Infinity));
  const priceCeiling = Math.max(
    2000,
    Math.ceil(
      (Math.max(
        minimumPrice,
        Number.isFinite(maximumPrice) ? maximumPrice : 0,
      ) +
        1) /
        1000,
    ) * 1000,
  );
  const priceRange = [
    minimumPrice,
    Number.isFinite(maximumPrice) ? maximumPrice : priceCeiling,
  ];

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 12;

  const debouncedQ = useDebounce(q, 300);
  const debouncedPriceRange = useDebounce(
    `${minimumPrice}:${Number.isFinite(maximumPrice) ? maximumPrice : ""}`,
    300,
  );
  const [debouncedMinPrice, debouncedMaxPrice] = debouncedPriceRange.split(":");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: productsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "products",
      debouncedQ,
      category,
      debouncedMinPrice,
      debouncedMaxPrice,
      inStock,
      page,
      limit,
    ],
    queryFn: () =>
      getProducts({
        q: debouncedQ,
        category: category !== "all" ? category : undefined,
        minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
        maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
        inStock: inStock || undefined,
        page,
        limit,
      } as ProductQueryInput),
    placeholderData: keepPreviousData,
  });

  const products = productsData?.products || [];
  const totalPages = productsData?.pagination?.totalPages || 1;
  const totalProducts = productsData?.pagination?.total || 0;
  const foundProducts = products.length;

  const hasActiveFilters = Boolean(
    q || category !== "all" || minPrice || maxPrice || inStock || page > 1,
  );

  const updateFilter = (key: string, value: string | boolean | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      if (!value || value === "all") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }

      next.delete("page");
      return next;
    });
  };

  const handlePageChange = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(nextPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePriceChange = (value: number | readonly number[]) => {
    if (typeof value === "number" || value.length !== 2) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value[0] === 0) next.delete("minPrice");
        else next.set("minPrice", String(value[0]));
        if (value[1] === priceCeiling) next.delete("maxPrice");
        else next.set("maxPrice", String(value[1]));
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <PageMeta
        title={q.trim() ? `Search: "${q.trim()}"` : "Search Products"}
        description="Filter and search through our entire product catalog by keyword, category, price range, and in-stock availability."
      />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Product Search
            </h1>
            {isFetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Discover catalog items by name, category, price range, and stock
            availability.
          </p>
        </div>
      </div>

      <div className="sticky top-14 z-20 rounded-2xl border border-border/60 bg-background/95 p-3.5 shadow-xs backdrop-blur-md space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name..."
              className="pl-8 pr-8 h-9 text-xs rounded-xl"
              value={q}
              onChange={(e) => updateFilter("q", e.target.value)}
            />
            {q && (
              <button
                type="button"
                onClick={() => updateFilter("q", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear product search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-52">
            <Select
              value={category}
              onValueChange={(val) => updateFilter("category", val)}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all" className="text-xs">
                    All Categories
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/40 bg-muted/20 shrink-0">
            <Checkbox
              id="inStock"
              checked={inStock}
              onCheckedChange={(checked) => updateFilter("inStock", checked)}
            />
            <Label
              htmlFor="inStock"
              className="cursor-pointer text-xs font-medium select-none"
            >
              In Stock Only
            </Label>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground hover:text-foreground shrink-0"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border/30 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">Price:</span>
            <span className="tabular-nums font-semibold text-primary">
              ${priceRange[0]} - ${priceRange[1]}
            </span>
          </div>

          <div className="flex-1 max-w-md w-full px-2">
            <Slider
              min={0}
              max={priceCeiling}
              step={10}
              value={priceRange}
              onValueChange={handlePriceChange}
            />
          </div>

          <div className="text-[11px] text-muted-foreground shrink-0 text-right">
            Showing {foundProducts} of {totalProducts} products
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <h2 className="text-base font-semibold">Failed to load products</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {getErrorMessage(error)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-xs"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        /* Full width products grid */
        <div className="space-y-6">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onAddToCart={addItem}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
