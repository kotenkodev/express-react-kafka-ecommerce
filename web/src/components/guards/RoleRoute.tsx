import { Navigate, Outlet } from "react-router-dom";

interface RoleRouteProps {
  roles: ("user" | "admin")[];
}

export default function RoleRoute({ roles }: RoleRouteProps) {
  const userRole = "user"; // Replace with your actual user role retrieval logic

  if (!roles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
