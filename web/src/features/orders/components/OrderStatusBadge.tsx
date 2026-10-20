import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "../types";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300",
  PAID: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  PREPARING: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  SHIPPED: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400",
  DELIVERED: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  FAILED: "border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-400",
  CANCELED: "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300",
  PACKAGING: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  SHIPPING: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const colorClass =
    statusColors[status] ||
    "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300";

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${colorClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </Badge>
  );
}
