import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@core/store/auth.store";

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Accept either the normalized `rol_detalle` (from serialized user) or the
  // compact `rol` field (sometimes used elsewhere) to determine role.
  const isAdmin =
    user?.rol_detalle?.nombre === "Admin" ||
    (user as any)?.rol?.nombre === "Admin";
  const isEmpleado =
    user?.rol_detalle?.nombre === "Empleado" ||
    (user as any)?.rol?.nombre === "Empleado";

  if (!isAdmin && !isEmpleado) {
    // No autorizado para área admin → redirigir al catálogo (evita loop infinito)
    return <Navigate to="/" replace />;
  }

  // Authorized for admin area: render nested admin routes
  return <Outlet />;
};
