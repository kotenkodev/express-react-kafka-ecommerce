import {
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  ArrowRight,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "../store/cartStore";

export function SidebarCart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, clear, total, count, setIsOpen } =
    useCartStore();

  const totalCount = count();
  const totalPrice = total();

  const handleCheckout = () => {
    navigate("/orders");
  };

  return (
    <Sidebar
      side="right"
      collapsible="none"
      className="fixed inset-y-0 right-0 z-40 md:sticky md:top-0 h-svh w-80 sm:w-88 border-l border-sidebar-border bg-sidebar flex flex-col shrink-0 shadow-xl md:shadow-none"
    >
      {/* 1. Header */}
      <SidebarHeader className="border-b border-sidebar-border p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight text-sidebar-foreground">
                Your Cart
              </span>
              <span className="text-[11px] text-muted-foreground">
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={clear}
                className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground h-7 w-7"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[280px] p-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground mb-3 shadow-2xs">
              <ShoppingBag className="h-7 w-7 stroke-[1.5]" />
            </div>
            <p className="font-semibold text-sm text-foreground">
              Your cart is empty
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
              Looks like you haven't added anything yet. Explore our products to
              get started!
            </p>
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/" />}
              className="mt-4 gap-1.5 text-xs shadow-2xs"
            >
              <span>Browse Catalog</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3 p-2.5 rounded-xl border border-border/50 bg-background/60 hover:bg-background transition-colors shadow-2xs"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-2xl border border-border/40 select-none">
                  {product.emoji || "📦"}
                </div>

                <div className="flex flex-col flex-1 min-w-0 justify-between">
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className="font-medium text-xs text-foreground truncate"
                      title={product.name}
                    >
                      {product.name}
                    </span>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors p-0.5 rounded cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-foreground">
                      ${(Number(product.price) * quantity).toFixed(2)}
                    </span>

                    <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-muted/30">
                      <button
                        onClick={() => updateQty(product.id, quantity - 1)}
                        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors disabled:opacity-30 cursor-pointer"
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-[11px] font-semibold px-1 min-w-[16px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQty(product.id, quantity + 1)}
                        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors disabled:opacity-30 cursor-pointer"
                        disabled={quantity >= product.stock}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3.5 space-y-3 bg-muted/20">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="text-emerald-600 font-medium">Free</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-foreground pt-1.5 border-t border-border/40">
            <span>Total</span>
            <span className="tracking-tight">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full gap-2 shadow-sm font-medium"
          disabled={items.length === 0}
          onClick={handleCheckout}
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
