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
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/error";

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

  // TanStack Query for categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // TanStack Query for products list
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

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Product Search</h1>
            {isFetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground">
            Showing {foundProducts} of {totalProducts} products
          </p>
        </div>

        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products by name..."
            className="w-full pl-9"
            value={q}
            onChange={(e) => updateFilter("q", e.target.value)}
          />
        </div>
      </header>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Filters</h3>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(val) => updateFilter("category", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Price Range</Label>
                  <span className="text-sm text-muted-foreground">
                    ${priceRange[0]} - ${priceRange[1]}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={priceCeiling}
                  step={10}
                  value={priceRange}
                  onValueChange={handlePriceChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={inStock}
                  onCheckedChange={(checked) => updateFilter("inStock", checked)}
                />
                <Label htmlFor="inStock" className="cursor-pointer">
                  In Stock Only
                </Label>
              </div>

              {(q ||
                category !== "all" ||
                minPrice ||
                maxPrice ||
                inStock ||
                page > 1) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSearchParams(new URLSearchParams())}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </aside>

          <main className="md:col-span-3 space-y-6">
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
          </main>
        </div>
      )}
    </div>
  );
}
