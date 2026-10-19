import { useAuthStore } from "@/features/auth/store/authStore";
import ShopPage from "@/pages/ShopPage";
import { Navigate } from "react-router-dom";

export default function HomeRoute() {
  const { user } = useAuthStore();

  if (user?.role === "admin") {
    return <Navigate to="/orders" replace />;
  }

  return <ShopPage />;
}
