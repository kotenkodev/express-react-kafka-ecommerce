import { useAuthStore } from "@/features/auth/store/authStore";
import { UserRole } from "@/features/auth/types";
import { Navigate, Outlet } from "react-router-dom";

interface RoleRouteProps {
  roles: UserRole[];
}

export default function RoleRoute({ roles }: RoleRouteProps) {
  const { user } = useAuthStore();

  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
