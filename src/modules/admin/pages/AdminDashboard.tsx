import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminLayout } from "@shared/components/layout/AdminLayout";

export const AdminDashboard: React.FC = () => {
  const location = useLocation();

  // Determinar el título basado en la ruta
  const getTitleFromPath = () => {
    const titles: Record<string, string> = {
      "/admin/dashboard": "Dashboard — TUMOMITO S.A.",
      "/admin/analytics": "Estadísticas",
      "/admin/reports": "Reportes Dinámicos",
      "/admin/predictions": "Predicciones con AI",
      "/admin/users": "Gestión de Usuarios",
      "/admin/roles": "Gestión de Roles",
      "/admin/products": "Gestión de Productos",
      "/admin/categories": "Gestión de Categorías",
      "/admin/brands": "Gestión de Marcas",
      "/admin/orders": "Gestión de Pedidos",
      "/admin/shipments": "Gestión de Envíos",
      "/admin/settings": "Configuración",
      "/admin/inventory": "Inventario",
      "/admin/quotes": "Cotizaciones B2B",
      "/admin/clients": "Clientes Empresa",
    };
    return titles[location.pathname] || "Panel de Administración TUMOMITO";
  };

  return (
    <AdminLayout title={getTitleFromPath()}>
      <Outlet />
    </AdminLayout>
  );
};
