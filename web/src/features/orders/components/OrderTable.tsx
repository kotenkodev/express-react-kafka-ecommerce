import type { Order } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import OrderCard from "./OrderCard";
import { PackageSearch } from "lucide-react";

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  isAdmin: boolean;
}

export default function OrderTable({
  orders,
  isLoading,
  isAdmin,
}: OrderTableProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading orders"
        className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2.5">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="flex items-end justify-between border-t border-border/40 pt-2.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <PackageSearch className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">No orders yet</h2>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Orders will appear here once they have been placed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
