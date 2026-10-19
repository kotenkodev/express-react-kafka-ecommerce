import { useAuthStore } from "@/features/auth/store/authStore";
import { Loader2Icon } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { accessToken, isLoading } = useAuthStore();
  const isAuthenticated = !!accessToken;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2Icon className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
