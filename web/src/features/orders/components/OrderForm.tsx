import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/features/cart/store/cartStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOrdersStore } from "../store/ordersStore";
import { createOrder } from "../api/orders.api";
import type { Order } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Truck,
  CheckCircle,
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error";
import { generateUUID } from "@/lib/utils";

export default function OrderForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { items, total, clear, isCheckoutOpen, setCheckoutOpen, setIsOpen } =
    useCartStore();
  const { addOrder } = useOrdersStore();

  const idempotencyKeyRef = useRef(generateUUID());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = total();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const customerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Customer";

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = items.map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
      }));

      const newOrder = await createOrder(payload, idempotencyKeyRef.current);

      idempotencyKeyRef.current = generateUUID();

      queryClient.setQueryData<Order[]>(["orders"], (oldOrders = []) => {
        return [newOrder, ...oldOrders.filter((o) => o.id !== newOrder.id)];
      });

      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["search-orders"] });

      addOrder(newOrder);
      clear();
      setCheckoutOpen(false);
      setIsOpen(false);

      toast.success("Order placed successfully! Tracking live updates...");
      navigate("/orders");
    } catch (err) {
      const msg = getErrorMessage(
        err,
        "Failed to place order. Please try again.",
      );
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl bg-card border border-border/60 shadow-xl">
        <DialogHeader className="border-b border-border/40 px-4 py-3.5 pr-12 text-left">
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Package className="h-4 w-4 text-primary" />
            Checkout Confirmation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Review your order items and confirm placement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Recipient:</span>
              <span className="font-medium text-foreground">
                {customerName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-[11px] text-foreground">
                {user?.email || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-border/30">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                Delivery:
              </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Standard Courier (Free)
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              <span>Items</span>
              <span>{totalItems} total</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-border/30 rounded-xl border border-border/40 bg-background/50 px-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm border border-border/30">
                      {item.product.emoji || "📦"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Qty {item.quantity} &times; $
                        {Number(item.product.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">
                    ${(item.quantity * Number(item.product.price)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="text-emerald-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between font-bold text-xs text-foreground pt-1.5 border-t border-border/30">
              <span>Total to Pay</span>
              <span className="text-sm tracking-tight tabular-nums text-foreground">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/40 bg-muted/10 px-4 py-3 flex-row justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => setCheckoutOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={handlePlaceOrder}
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                Place Order
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
