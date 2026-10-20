import {
  CalendarDays,
  CreditCard,
  Package,
  Truck,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Order, PaymentStatus } from "../types";
import { Link } from "react-router-dom";
import OrderStatusBadge from "./OrderStatusBadge";

interface OrderCardProps {
  order: Order;
  isAdmin: boolean;
}

const paymentStyles: Record<PaymentStatus, string> = {
  PENDING: "text-muted-foreground",
  SUCCESS: "text-emerald-600 dark:text-emerald-400",
  FAILED: "text-destructive",
};

const paymentLabels: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  SUCCESS: "Payment successful",
  FAILED: "Payment failed",
};

export default function OrderCard({ order, isAdmin }: OrderCardProps) {
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const customerName =
    [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
    order.user?.username ||
    "Customer unavailable";

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-0 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/40 bg-gradient-to-b from-muted/40 to-muted/10 p-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background/80 text-muted-foreground shadow-2xs">
            <Package className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              className="truncate text-xs font-semibold tracking-tight"
              title={order.id}
            >
              Order #{order.id}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2.5 border-b border-border/40 bg-muted/5 px-3 py-2 sm:px-4 text-xs">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customer
            </p>
            <p className="truncate text-xs font-medium text-foreground">
              {customerName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {order.user?.email || `User ID: ${order.userId}`}
            </p>
          </div>
        </div>
      )}

      <div className="max-h-56 overflow-y-auto divide-y divide-border/30 px-3 sm:px-4">
        {order.items.map((item) => (
          <Link
            key={item.id}
            to={`/products/${item.productId}`}
            className="group flex items-center gap-2.5 rounded-lg py-2.5 outline-none transition-colors hover:bg-muted/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/50 text-xl">
              {item.product?.emoji ? (
                <span aria-hidden="true">{item.product.emoji}</span>
              ) : (
                <Package
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium transition-colors group-hover:text-primary">
                {item.product?.name || "Product unavailable"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Qty {item.quantity} &times; ${Number(item.unitPrice).toFixed(2)}
              </p>
            </div>
            <p className="shrink-0 text-xs font-semibold tabular-nums">
              ${(item.quantity * Number(item.unitPrice)).toFixed(2)}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/40 bg-muted/10 p-3 sm:px-4">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p
            className={`flex items-center gap-1.5 font-medium ${paymentStyles[order.paymentStatus]}`}
          >
            <CreditCard className="h-3 w-3" aria-hidden="true" />
            {paymentLabels[order.paymentStatus]}
          </p>
          <p className="flex items-center gap-1.5 text-[11px]">
            <Truck className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {order.courier
                ? `Courier: ${order.courier}`
                : "Courier not assigned"}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-[11px]">
            <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
            <time dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleString()}
            </time>
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total
          </p>
          <p className="text-base font-bold tracking-tight text-foreground tabular-nums">
            ${Number(order.totalAmount).toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
}
