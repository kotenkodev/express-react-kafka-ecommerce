import { Outlet } from "react-router-dom";
import { AppSidebar } from "./Sidebar";
import { SidebarCart } from "@/features/cart/components/SidebarCart";
import OrderForm from "@/features/orders/components/OrderForm";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { ShoppingCartIcon } from "lucide-react";
import { useCartStore } from "@/features/cart/store/cartStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export default function MainLayout() {
  const { user } = useAuthStore();
  const { count, toggleCart, isOpen } = useCartStore();

  const isCustomer = user?.role !== "admin";
  const cartCount = count();

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/80">
          <SidebarTrigger className="-ml-1" />

          {isCustomer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCart}
              className="relative gap-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle shopping cart"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="default"
                  className="h-5 min-w-5 px-1 text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          )}
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>

      {isCustomer && (
        <>
          {isOpen && (
            <>
              <div
                onClick={() => useCartStore.getState().setIsOpen(false)}
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
                aria-hidden="true"
              />
              <SidebarCart />
            </>
          )}
          <OrderForm />
        </>
      )}
    </SidebarProvider>
  );
}
