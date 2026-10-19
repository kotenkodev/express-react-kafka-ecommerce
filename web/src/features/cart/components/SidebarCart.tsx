import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { LogOut, ShieldCheck, ShoppingCartIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleClearCart(
    event: MouseEvent<HTMLButtonElement, MouseEvent>,
  ): void {
    throw new Error("Function not implemented.");
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-3.5 group-data-[collapsible=icon]:p-2">
        <Link
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-85 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShoppingCartIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm leading-tight tracking-tight text-sidebar-foreground truncate">
              Cart
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Cart Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase px-2">
            Store
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {storeItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link to={item.url} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase px-2 flex items-center justify-between">
                <span>Management</span>
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          render={<Link to={item.url} />}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2.5 group-data-[collapsible=icon]:p-1.5 gap-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent/50 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:justify-center">
          Checkout: items in cart <Badge variant="secondary">0</Badge>
          total $0.00
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Clear Cart"
              onClick={handleClearCart}
              className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Clear Cart</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
