import React, { useState } from "react";
import {
  Menu,
  X,
  Bell,
  LogOut,
  Settings,
  BarChart3,
  Users,
  Shield,
  Package,
  Tag,
  Store,
  FileText,
  Truck,
  TrendingUp,
  Sliders,
  Brain,
  LayoutDashboard,
  Warehouse,
  ClipboardList,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@core/store/auth.store";
import { label } from "framer-motion/client";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = "Panel de Administración",
  breadcrumb,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("mauve");
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const colors = [
    { name: "mauve", hex: "#87564B", label: "Mauve" },
    { name: "chocolate", hex: "#6D3222", label: "Chocolate" },
    { name: "rose", hex: "#CFA195", label: "Rose" },
    { name: "cream", hex: "#E2B8AD", label: "Cream" },
  ];

  const handleColorChange = (color: string) => {
    setAccentColor(color);
    const hex = colors.find((c) => c.name === color)?.hex || "#87564B";
    document.documentElement.style.setProperty(`--color-accent-selected`, hex);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
   /* { label: "Estadísticas", href: "/admin/analytics", icon: BarChart3 }, */
    { label: "Cotizaciones", href: "/admin/quotes", icon: ClipboardList },
    { label: "Pedidos", href: "/admin/orders", icon: FileText },
    { label: "Productos", href: "/admin/products", icon: Package },
    { label: "Categorías", href: "/admin/categories", icon: Tag },
    { label: "Marcas", href: "/admin/brands", icon: Store },
    { label: "Inventario", href: "/admin/inventory", icon: Warehouse },
    { label: "Clientes B2B", href: "/admin/clients", icon: Building2 },
    { label: "Usuarios", href: "/admin/users", icon: Users },
   /* { label: "Reportes", href: "/admin/reports", icon: TrendingUp }, */
   /* { label: "Roles", href: "/admin/roles", icon: Shield }, */
    { label: "Predicciones ML", href: "/admin/predictions", icon: Brain },
  ];

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — flex column para que el nav ocupe el espacio restante y sea scrollable */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-56 h-full flex flex-col bg-accent-cream text-gray-900 shadow-lg transform transition-transform duration-300 z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header fijo */}
        <div className="px-4 py-4 border-b border-neutral-300 shrink-0">
          <h1 className="text-base font-bold text-gray-900 leading-tight">TUMOMITO S.A.</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">ERP B2B · Importadora Mayorista</p>
        </div>

        {/* Nav scrollable — ocupa todo el espacio disponible */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = window.location.pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-accent-mauve text-gray-900 font-semibold"
                    : "text-gray-700 hover:bg-accent-mauve/60"
                }`}
              >
                <IconComponent size={16} className="shrink-0" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-4 py-3 border-t border-neutral-300 shrink-0 bg-accent-cream">
          <p className="text-[10px] text-gray-400 text-center">v1.0 · TUMOMITO ERP</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <header className="bg-white border-b border-neutral-300 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left: Menu Button + Breadcrumb */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <X size={24} className="text-neutral-700" />
                ) : (
                  <Menu size={24} className="text-neutral-700" />
                )}
              </button>

              <div className="flex-1">
                {breadcrumb && breadcrumb.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    {breadcrumb.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {item.href ? (
                          <a
                            href={item.href}
                            className="hover:text-primary-600 transition-colors"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <span className="text-neutral-900 font-medium">
                            {item.label}
                          </span>
                        )}
                        {idx < breadcrumb.length - 1 && <span>/</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <h1 className="text-xl font-bold text-neutral-900">
                    {title}
                  </h1>
                )}
              </div>
            </div>

            {/* Right: Notification + Color Selector + Avatar */}
            <div className="flex items-center gap-4">
              {/* Search (placeholder) */}
              <input
                type="text"
                placeholder="Buscar..."
                className="hidden md:block px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-48"
              />

              {/* Notification Bell */}
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative">
                <Bell size={20} className="text-neutral-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Color Selector Dropdown */}
              <div className="relative group">
                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-neutral-300"
                    style={{
                      backgroundColor:
                        colors.find((c) => c.name === accentColor)?.hex ||
                        "#87564B",
                    }}
                  />
                </button>
                <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 gap-2 hidden group-hover:grid grid-cols-2 w-48">
                  <p className="col-span-2 text-xs font-medium text-neutral-600 px-2">
                    Color de acento:
                  </p>
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(color.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        accentColor === color.name
                          ? "bg-neutral-100 font-medium"
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Avatar + Menu */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {user?.nombre?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-neutral-700">
                    {user?.nombre || "Usuario"}
                  </span>
                </button>
                <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg hidden group-hover:block w-48">
                  <div className="p-4 border-b border-neutral-200">
                    <p className="text-sm font-medium text-neutral-900">
                      {user?.nombre_completo || user?.email}
                    </p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Mi Perfil
                  </a>
                  <a
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Configuración
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-neutral-200"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};
