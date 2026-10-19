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
import {
  Store,
  Package,
  PackageSearch,
  LineChart,
  Search,
  Boxes,
  ShoppingBag,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/features/auth/store/authStore";
import { logout as logoutApi } from "@/features/auth/api/auth.api";
import { toast } from "sonner";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setAccessToken, user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
    } finally {
      setUser(null);
      setAccessToken(null);
      toast.success("Signed out successfully");
      navigate("/login");
    }
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Account";

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.username?.[0] || "U").toUpperCase();

  const storeItems = [
    { title: "Storefront", url: "/", icon: Store },
    ...(!isAdmin
      ? [
          {
            title: "Search Products",
            url: "/product-search",
            icon: PackageSearch,
          },
        ]
      : []),
    {
      title: isAdmin ? "All Orders" : "My Orders",
      url: "/orders",
      icon: Package,
    },
  ];

  const adminItems = [
    { title: "Analytics", url: "/analytics", icon: LineChart },
    { title: "Order Search", url: "/search", icon: Search },
    { title: "Product Catalog", url: "/products", icon: Boxes },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-3.5 group-data-[collapsible=icon]:p-2">
        <Link
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-85 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm leading-tight tracking-tight text-sidebar-foreground truncate">
              KafkaShop
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              {isAdmin ? "Admin Console" : "E-Commerce"}
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
        <div
          title={`${displayName} (${user?.email || ""})`}
          className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent/50 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-sidebar-foreground truncate">
                {displayName}
              </span>
              {isAdmin && (
                <Badge
                  variant="secondary"
                  className="text-[9px] h-4 px-1 py-0 font-medium leading-none"
                >
                  Admin
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground truncate">
              {user?.email || user?.username}
            </span>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleLogout}
              className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
