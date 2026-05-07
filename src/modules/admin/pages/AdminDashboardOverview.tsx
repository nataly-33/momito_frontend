import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, Package, Users, AlertTriangle, ShoppingCart,
  TrendingUp, TrendingDown, RefreshCw, Plus,
} from "lucide-react";
import { api } from "@/core/config/api.config";
import { ENDPOINTS } from "@/core/config/endpoints";

// ---------- Types ----------
interface DashboardData {
  total_revenue: number;
  revenue_this_month: number;
  revenue_change_pct: number;
  pending_orders: number;
  active_products: number;
  active_clients: number;
  low_stock_products: number;
  stock_alerts: StockAlert[];
}
interface StockAlert { id: string; nombre: string; code: string; stock: number; stock_min: number; }
interface MonthlyData { month: string; confirmed_revenue: number; pending_revenue: number; order_count: number; }
interface OrderStatus { estado: string; count: number; total: number; }
interface TopProduct { product_name: string; brand: string; total_units: number; total_revenue: number; }
interface TopClient { company_name: string; city: string; client_type: string; total_orders: number; total_spent: number; }
interface LowStockItem { id: string; nombre: string; code: string; stock: number; stock_min: number; brand: string; deficit: number; }
interface ActivityEvent { type: string; description: string; amount: number | null; date: string; }

// ---------- Colors ----------
const PRIMARY = "#1e3a5f";
const COLORS_STATUS: Record<string, string> = {
  pendiente: "#f59e0b",
  confirmado: "#3b82f6",
  en_preparacion: "#f97316",
  despachado: "#8b5cf6",
  entregado: "#10b981",
  cancelado: "#ef4444",
  pago_recibido: "#06b6d4",
  preparando: "#fb923c",
  enviado: "#a78bfa",
  reembolsado: "#6b7280",
};

// ---------- Sub-components ----------
function KpiCard({
  icon: Icon, label, value, change, badge, color = PRIMARY,
}: {
  icon: React.ElementType; label: string; value: string | number; change?: number; badge?: boolean; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4 border-l-4" style={{ borderColor: color }}>
      <div className="rounded-full p-3" style={{ backgroundColor: `${color}22` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800 truncate">{value}</p>
        {change !== undefined && (
          <p className={`text-xs flex items-center gap-1 mt-0.5 ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change >= 0 ? "+" : ""}{change}% vs mes ant.
          </p>
        )}
      </div>
      {badge && <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">!</span>}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ---------- Main Component ----------
export const AdminDashboardOverview: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<OrderStatus[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [period, setPeriod] = useState(12);
  const [loading, setLoading] = useState(true);
  const [inventoryModal, setInventoryModal] = useState<{ open: boolean; productId?: string; productName?: string }>({ open: false });
  const [movementForm, setMovementForm] = useState({ movement_type: "entrada", quantity: "", notes: "" });
  const [savingMovement, setSavingMovement] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, mon, sts, prods, clients, ls, act] = await Promise.all([
        api.get(ENDPOINTS.REPORTS.DASHBOARD),
        api.get(`${ENDPOINTS.REPORTS.MONTHLY}?months=${period}`),
        api.get(ENDPOINTS.REPORTS.ORDERS_STATUS),
        api.get(ENDPOINTS.REPORTS.SALES),
        api.get(ENDPOINTS.REPORTS.TOP_CLIENTS),
        api.get(ENDPOINTS.REPORTS.LOW_STOCK),
        api.get(ENDPOINTS.REPORTS.RECENT_ACTIVITY),
      ]);
      setDashboard(dash.data);
      setMonthly(mon.data);
      setStatusData(sts.data);
      setTopProducts(prods.data.slice(0, 10));
      setTopClients(clients.data.slice(0, 5));
      setLowStock(ls.data);
      setActivity(act.data);
    } catch (e) {
      console.error("Error cargando dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRegisterMovement = async () => {
    if (!inventoryModal.productId || !movementForm.quantity) return;
    setSavingMovement(true);
    try {
      await api.post(ENDPOINTS.INVENTORY.MOVEMENTS, {
        product: inventoryModal.productId,
        movement_type: movementForm.movement_type,
        quantity: Number(movementForm.quantity),
        notes: movementForm.notes,
      });
      setInventoryModal({ open: false });
      setMovementForm({ movement_type: "entrada", quantity: "", notes: "" });
      fetchAll();
    } catch (e) {
      alert("Error al registrar movimiento");
    } finally {
      setSavingMovement(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 }).format(n);

  const totalOrders = statusData.reduce((a, b) => a + b.count, 0);

  // ---------- Render ----------
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard — TUMOMITO S.A.</h1>
          <p className="text-sm text-gray-500">ERP B2B · Importadora Mayorista</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* A — KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard icon={DollarSign} label="Ingresos totales" value={fmt(dashboard?.total_revenue || 0)} change={dashboard?.revenue_change_pct} color="#1e3a5f" />
          <KpiCard icon={ShoppingCart} label="Pedidos pendientes" value={dashboard?.pending_orders || 0} badge={(dashboard?.pending_orders || 0) > 10} color="#f59e0b" />
          <KpiCard icon={Package} label="Productos activos" value={dashboard?.active_products || 0} color="#3b82f6" />
          <KpiCard icon={Users} label="Clientes activos" value={dashboard?.active_clients || 0} color="#10b981" />
          <KpiCard icon={AlertTriangle} label="Stock bajo" value={dashboard?.low_stock_products || 0} badge={(dashboard?.low_stock_products || 0) > 0} color="#ef4444" />
        </div>
      )}

      {/* B + C — Charts row */}
      <div className="grid grid-cols-12 gap-4">
        {/* B — Area chart ventas por mes */}
        <div className="col-span-12 xl:col-span-7 bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Ventas por mes (Bs.)</h2>
            <div className="flex gap-1 text-xs">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setPeriod(m)}
                  className={`px-3 py-1 rounded-full border ${period === m ? "bg-blue-600 text-white border-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
          {loading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="confirmed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="confirmed_revenue" name="Confirmados" stroke={PRIMARY} fill="url(#confirmed)" strokeWidth={2} />
                <Area type="monotone" dataKey="pending_revenue" name="Pendientes" stroke="#f59e0b" fill="url(#pending)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* C — Donut estados pedidos */}
        <div className="col-span-12 xl:col-span-5 bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Estado de pedidos</h2>
          {loading ? <Skeleton className="h-52" /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="estado" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={COLORS_STATUS[entry.estado] || "#9ca3af"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v} (${((v / totalOrders) * 100).toFixed(1)}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {statusData.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS_STATUS[s.estado] || "#9ca3af" }} />
                    {s.estado} ({s.count})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* D — Low stock table */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          Alertas de stock bajo
        </h2>
        {loading ? <Skeleton className="h-40" /> : lowStock.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin alertas de stock — ¡todo en orden!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-left">Marca</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Mínimo</th>
                  <th className="px-3 py-2 text-right">Déficit</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStock.map((item) => {
                  const pct = item.stock_min > 0 ? Math.min((item.stock / item.stock_min) * 100, 100) : 0;
                  const isCritical = item.stock === 0;
                  return (
                    <tr
                      key={item.id}
                      className={isCritical ? "bg-red-50" : "bg-yellow-50"}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{item.code || "-"}</td>
                      <td className="px-3 py-2 font-medium">{item.nombre}</td>
                      <td className="px-3 py-2 text-gray-500">{item.brand}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${isCritical ? "bg-red-500" : "bg-yellow-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${isCritical ? "text-red-600" : "text-yellow-600"}`}>{item.stock}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">{item.stock_min}</td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">{item.deficit}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCritical ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {isCritical ? "Sin stock" : "Bajo"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => setInventoryModal({ open: true, productId: item.id, productName: item.nombre })}
                          className="text-xs flex items-center gap-1 mx-auto px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Plus size={11} /> Entrada
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* E + F row — Top products + Top clients */}
      <div className="grid grid-cols-12 gap-4">
        {/* E — Top products bar chart */}
        <div className="col-span-12 xl:col-span-7 bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top 10 productos por ingresos</h2>
          {loading ? <Skeleton className="h-56" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="product_name" tick={{ fontSize: 9 }} width={110} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total_revenue" name="Ingresos (Bs.)" fill={PRIMARY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* F — Top clients */}
        <div className="col-span-12 xl:col-span-5 bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top 5 clientes</h2>
          {loading ? <Skeleton className="h-56" /> : (
            <div className="space-y-3">
              {topClients.map((c, i) => {
                const maxSpent = topClients[0]?.total_spent || 1;
                const pct = (c.total_spent / maxSpent) * 100;
                const badge = c.client_type === "vip" ? "bg-yellow-100 text-yellow-800" : c.client_type === "regular" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-700 truncate">{c.company_name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge}`}>{c.client_type}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>{c.city}</span>
                        <span>{fmt(c.total_spent || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* H — Actividad reciente */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Actividad reciente</h2>
        {loading ? <Skeleton className="h-40" /> : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activity.map((ev, i) => {
              const icon = ev.type === "order" ? "📦" : ev.type === "inventory" ? "🏭" : "📄";
              const time = new Date(ev.date).toLocaleString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{ev.description}</p>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                  {ev.amount !== null && (
                    <span className="text-xs font-semibold text-green-600 whitespace-nowrap">{fmt(ev.amount)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal — Registrar entrada de inventario */}
      {inventoryModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-gray-800 mb-1">Registrar movimiento</h3>
            <p className="text-sm text-gray-500 mb-4">{inventoryModal.productName}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Tipo</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={movementForm.movement_type}
                  onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste (establecer)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Cantidad</label>
                <input
                  type="number" min="1"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Notas</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="Motivo del movimiento..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setInventoryModal({ open: false })}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterMovement}
                disabled={savingMovement || !movementForm.quantity}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {savingMovement ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
