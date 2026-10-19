import { getOrders } from "@/features/orders/api/orders.api";
import OrderTable from "@/features/orders/components/OrderTable";
import type { Order } from "@/features/orders/types";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Button } from "@/components/ui/button";
import { PackageSearch, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/lib/error";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orders = await getOrders();
        if (!ignore) setOrders(orders);
      } catch (err) {
        const errorMsg = getErrorMessage(
          err,
          "Failed to load orders. Please try again.",
        );
        if (!ignore) {
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    void loadData();
    return () => {
      ignore = true;
    };
  }, [retry]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isAdmin ? "All Orders" : "My Orders"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "View customer orders and follow their payment and delivery status."
            : "View your purchases and follow their payment and delivery status."}
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border/70 bg-muted/20 px-4 py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PackageSearch className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold">Orders unavailable</h2>
          <p
            role="alert"
            className="mt-1 max-w-sm text-sm text-muted-foreground"
          >
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5 shadow-2xs"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              setRetry((value) => value + 1);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : (
        <OrderTable isAdmin={isAdmin} orders={orders} isLoading={isLoading} />
      )}
    </div>
  );
}
