import { useAuthStore } from "@/features/auth/store/authStore";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
