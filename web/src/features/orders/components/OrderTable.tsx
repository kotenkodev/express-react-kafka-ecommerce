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
        className="grid grid-cols-1 gap-5 md:gap-6"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border/40 bg-muted/20 p-4">
              <Skeleton className="h-10 w-1/2 rounded-xl" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-end justify-between border-t border-border/40 bg-muted/10 p-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 px-4 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <PackageSearch className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          No orders yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Orders will appear here once they have been placed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:gap-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
