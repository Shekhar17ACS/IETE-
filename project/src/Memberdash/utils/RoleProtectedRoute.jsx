

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PERMISSION_MAP} from "./permissionMap";
import { hasPermission } from "./permissions";

export default function RoleProtectedRoute() {
  const location = useLocation();
  const currentPath = location.pathname;

  const requiredPermission = PERMISSION_MAP[currentPath];

  // If route doesn't have a permission mapped, allow by default
  if (!requiredPermission) return <Outlet />;

  // If user lacks required permission, deny access
  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <Outlet />;
}
