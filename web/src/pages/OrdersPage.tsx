import { useQuery } from "@tanstack/react-query";
import OrderTable from "@/features/orders/components/OrderTable";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOrderSSE } from "@/features/orders/hooks/useOrderSSE";
import { getOrders } from "@/features/orders/api/orders.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageSearch, RefreshCw, Radio } from "lucide-react";
import { getErrorMessage } from "@/lib/error";

export default function OrdersPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");

  // Subscribe to live SSE updates which keep TanStack Query cache updated in real time
  useOrderSSE();

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const errorMessage = error ? getErrorMessage(error) : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isAdmin ? "All Orders (Admin)" : "My Orders"}
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px]"
            >
              <Radio className="h-3 w-3 animate-pulse" />
              Live SSE
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isAdmin
              ? "Real-time platform orders monitoring and automatic status updates via SSE."
              : "Track your purchases and courier delivery in real time."}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 self-start sm:self-auto text-xs h-8"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <PackageSearch className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-semibold">Failed to load orders</h2>
          <p role="alert" className="mt-1 max-w-sm text-xs text-muted-foreground">
            {errorMessage}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Try again
          </Button>
        </div>
      ) : (
        <OrderTable isAdmin={isAdmin} orders={orders} isLoading={isLoading} />
      )}
    </div>
  );
}
