import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { searchOrders } from "@/features/search/api/search.api";
import SearchOrderCard from "@/features/search/components/SearchOrderCard";
import { Pagination } from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, PackageSearch, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error";

const ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "PENDING" },
  { value: "PAID", label: "PAID" },
  { value: "PREPARING", label: "PREPARING" },
  { value: "SHIPPED", label: "SHIPPED" },
  { value: "DELIVERED", label: "DELIVERED" },
  { value: "FAILED", label: "FAILED" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "CANCELED", label: "CANCELED" },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get("q") || "";
  const urlStatus = searchParams.get("status") || "ALL";
  const urlPage = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(urlQuery);
  const debouncedQuery = useDebounce(searchInput, 300);

  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [currentPage, setCurrentPage] = useState(urlPage);

  const updateUrlParams = useCallback(
    (q: string, status: string, page: number) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status && status !== "ALL") params.set("status", status);
      if (page > 1) params.set("page", String(page));
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    setCurrentPage(1);
    updateUrlParams(debouncedQuery, statusFilter, 1);
  }, [debouncedQuery, statusFilter, updateUrlParams]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["search-orders", debouncedQuery, statusFilter, currentPage],
    queryFn: () =>
      searchOrders({
        q: debouncedQuery,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      }),
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const errorMessage = error ? getErrorMessage(error) : null;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams(debouncedQuery, statusFilter, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearQuery = () => {
    setSearchInput("");
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Order Search
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Full-text Elasticsearch order search by Order ID, User ID, courier, or
          products with status filter.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Order ID, courier, User ID, product..."
            className="pl-8 pr-8 h-9 text-xs rounded-lg"
          />
          {searchInput && (
            <button
              onClick={clearQuery}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-52">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val || "ALL")}
          >
            <SelectTrigger className="h-9 text-xs rounded-lg">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <SelectValue placeholder="Status filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <span className="flex items-center gap-1.5">
          {isFetching && (
            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
          )}
          {isLoading ? "Searching..." : `Found: ${total} orders`}
        </span>
        {statusFilter !== "ALL" && (
          <span className="font-medium text-foreground">
            Filter: {statusFilter}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <PackageSearch className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Search Error
          </h2>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {errorMessage}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <PackageSearch className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            No orders found
          </h2>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {debouncedQuery || statusFilter !== "ALL"
              ? "Try adjusting your search terms or clearing status filters."
              : "No indexed orders found in Elasticsearch."}
          </p>
          {(debouncedQuery || statusFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => {
                setSearchInput("");
                setStatusFilter("ALL");
              }}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {orders.map((order) => (
              <SearchOrderCard key={order.orderId} order={order} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pt-1">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
