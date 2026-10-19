import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "../types";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "border-border/60 bg-muted/60 text-muted-foreground",
  PAID: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PREPARING: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  SHIPPED: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DELIVERED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "border-destructive/20 bg-destructive/10 text-destructive",
  CANCELED: "border-border/60 bg-muted/60 text-muted-foreground",
  PACKAGING: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  SHIPPING: "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 text-[11px] font-medium ${statusColors[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
