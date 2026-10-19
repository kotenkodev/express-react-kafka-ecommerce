import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Category, Product } from "@/features/products/types";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

export default function ProductSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCartStore();
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const inStock = searchParams.get("inStock") === "true";

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 12;

  const debouncedQ = useDebounce(q, 300);
  const debouncedMinPrice = useDebounce(minPrice, 300);
  const debouncedMaxPrice = useDebounce(maxPrice, 300);

  const foundProducts = products.length > 0 ? products.length : 0;

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
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          getProducts({
            q: debouncedQ,
            category: category !== "all" ? category : undefined,
            minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
            maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
            inStock: inStock || undefined,
            page: page,
            limit: limit,
          } as ProductQueryInput),
          getCategories(),
        ]);
        setProducts(productsRes.products);
        setTotalPages(productsRes.pagination.totalPages);
        setTotalProducts(productsRes.pagination.total);
        setCategories(categoriesRes);
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [
    debouncedQ,
    category,
    debouncedMinPrice,
    debouncedMaxPrice,
    inStock,
    page,
    limit,
  ]);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Product Search</h1>
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

      <section className="bg-muted/40 border rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(val) => updateFilter("category", val)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="minPrice"
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              Min Price ($)
            </Label>
            <Input
              id="minPrice"
              type="number"
              min="0"
              placeholder="0.00"
              className="bg-background"
              value={minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="maxPrice"
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              Max Price ($)
            </Label>
            <Input
              id="maxPrice"
              type="number"
              min="0"
              placeholder="999.00"
              className="bg-background"
              value={maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
            />
          </div>

          <div className="flex items-center h-10 px-2 lg:col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={inStock}
                onCheckedChange={(checked) =>
                  updateFilter("inStock", checked === true)
                }
              />
              <Label
                htmlFor="inStock"
                className="cursor-pointer text-sm font-medium"
              >
                Only show in-stock items
              </Label>
            </div>
          </div>
        </div>
      </section>

      <main className="min-h-100">
        <ProductGrid
          isLoading={isLoading}
          onAddToCart={addItem}
          products={products}
        />

        {!isLoading && products.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <Search className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">
              Try adjusting your filters or search term.
            </p>
          </div>
        )}
      </main>

      {totalPages > 1 && (
        <footer className="pt-6 border-t mt-auto">
          <Pagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        </footer>
      )}
    </div>
  );
}
