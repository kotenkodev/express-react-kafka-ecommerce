import { CalendarDays, CreditCard, Package, Truck, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import type { OrderStatus } from "@/features/orders/types";
import type { SearchOrderDocument } from "../types";

interface SearchOrderCardProps {
  order: SearchOrderDocument;
}

export default function SearchOrderCard({ order }: SearchOrderCardProps) {
  const itemCount = (order.items || []).reduce(
    (total, item) => total + (item.quantity || 1),
    0,
  );

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card p-0 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/40 bg-gradient-to-b from-muted/40 to-muted/10 p-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background/80 text-muted-foreground shadow-2xs">
            <Package className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              className="truncate text-xs font-semibold tracking-tight"
              title={order.orderId}
            >
              Order #{order.orderId}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} />
      </div>

      {/* Customer user row */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-3 py-2 sm:px-4 text-xs">
        <UserRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground">Customer ID:</span>
        <span className="font-mono text-[11px] text-foreground truncate">
          {order.userId || "—"}
        </span>
      </div>

      {/* Items list */}
      {order.items && order.items.length > 0 && (
        <div className="max-h-48 overflow-y-auto divide-y divide-border/30 px-3 sm:px-4 text-xs">
          {order.items.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className="flex items-center justify-between py-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                <span className="text-sm">📦</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  ID: {item.productId.slice(0, 14)}...
                </span>
              </div>
              <div className="shrink-0 text-right text-xs">
                <span className="font-medium text-foreground">
                  Qty {item.quantity} &times; ${Number(item.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/40 bg-muted/10 p-3 sm:px-4">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium">
            <CreditCard className="h-3 w-3" aria-hidden="true" />
            <span
              className={
                order.paymentStatus === "SUCCESS"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : order.paymentStatus === "FAILED"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
            >
              {order.paymentStatus
                ? `Payment: ${order.paymentStatus}`
                : "Payment pending"}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-[11px]">
            <Truck className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              {order.courier ? `Courier: ${order.courier}` : "Courier unassigned"}
            </span>
          </p>
          {order.createdAt && (
            <p className="flex items-center gap-1.5 text-[11px]">
              <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
              <time dateTime={order.createdAt}>
                {new Date(order.createdAt).toLocaleString()}
              </time>
            </p>
          )}
        </div>

        <div className="ml-auto text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total
          </p>
          <p className="text-base font-bold tracking-tight text-foreground tabular-nums">
            ${Number(order.totalAmount || 0).toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
}
