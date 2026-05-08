import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, Package, Users, AlertTriangle, ShoppingCart,
  TrendingUp, TrendingDown, RefreshCw, Plus, Calendar, X, Filter,
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

// ---------- Helpers ----------
function fmtShort(n: number): string {
  if (n >= 1_000_000) return `Bs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Bs ${(n / 1_000).toFixed(1)}k`;
  return `Bs ${n.toLocaleString("es-BO")}`;
}

function buildQuery(params: Record<string, string>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

// ---------- Sub-components ----------
function KpiCard({
  icon: Icon, label, value, change, badge, color = PRIMARY,
}: {
  icon: React.ElementType; label: string; value: string | number; change?: number; badge?: boolean; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3 border-l-4" style={{ borderColor: color }}>
      <div className="rounded-full p-2.5 shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-xl font-bold text-gray-800 leading-tight mt-0.5 break-all">{value}</p>
        {change !== undefined && change !== 0 && (
          <p className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
            {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change >= 0 ? "+" : ""}{change}% mes ant.
          </p>
        )}
      </div>
      {badge && (
        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">!</span>
      )}
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
  const [period, setPeriod] = useState(48);
  const [loading, setLoading] = useState(true);

  // --- Filtro de fecha (local = lo que el usuario está escribiendo, applied = lo que se envía a la API) ---
  const [localFrom, setLocalFrom] = useState("");
  const [localTo, setLocalTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [inventoryModal, setInventoryModal] = useState<{ open: boolean; productId?: string; productName?: string }>({ open: false });
  const [movementForm, setMovementForm] = useState({ movement_type: "entrada", quantity: "", notes: "" });
  const [savingMovement, setSavingMovement] = useState(false);

  const hasDateFilter = !!(dateFrom || dateTo);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const dateParams: Record<string, string> = {};
      if (dateFrom) dateParams.fecha_inicio = dateFrom;
      if (dateTo) dateParams.fecha_fin = dateTo;

      const dq = buildQuery(dateParams);
      const withDate = (base: string) => `${base}${dq}`;

      // El monthly combina el período de meses con el rango de fechas cuando aplica
      const monthlyQ = buildQuery({
        ...(hasDateFilter ? dateParams : { months: String(period) }),
      });

      const [dash, mon, sts, prods, clients, ls, act] = await Promise.all([
        api.get(withDate(ENDPOINTS.REPORTS.DASHBOARD)),
        api.get(`${ENDPOINTS.REPORTS.MONTHLY}${monthlyQ}`),
        api.get(withDate(ENDPOINTS.REPORTS.ORDERS_STATUS)),
        api.get(withDate(ENDPOINTS.REPORTS.SALES)),
        api.get(withDate(ENDPOINTS.REPORTS.TOP_CLIENTS)),
        api.get(ENDPOINTS.REPORTS.LOW_STOCK), // stock siempre es estado actual
        api.get(withDate(ENDPOINTS.REPORTS.RECENT_ACTIVITY)),
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
  }, [period, dateFrom, dateTo]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleApplyDates = () => {
    setDateFrom(localFrom);
    setDateTo(localTo);
  };

  const handleClearDates = () => {
    setLocalFrom("");
    setLocalTo("");
    setDateFrom("");
    setDateTo("");
  };

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

  const PERIOD_OPTIONS = [
    { label: "6m", value: 6 },
    { label: "12m", value: 12 },
    { label: "24m", value: 24 },
    { label: "48m", value: 48 },
  ];

  const totalOrders = statusData.reduce((a, b) => a + b.count, 0);

  // ---------- Render ----------
  return (
    <div className="space-y-6 pb-10">

      {/* ── Filtro de fecha + Botón Actualizar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 text-gray-700 shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>

        <div className="bg-white rounded-xl shadow px-5 py-4 flex-1">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 shrink-0">
            <Filter size={15} className="text-blue-600" />
            Filtrar por período:
          </div>

          <div className="flex flex-wrap items-end gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Desde</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  max={localTo || undefined}
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Hasta</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  min={localFrom || undefined}
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleApplyDates}
              disabled={!localFrom && !localTo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Aplicar
            </button>

            {(hasDateFilter || localFrom || localTo) && (
              <button
                onClick={handleClearDates}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X size={13} />
                Limpiar filtro
              </button>
            )}
          </div>

          {/* Indicador de filtro activo */}
          {hasDateFilter && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {dateFrom && dateTo
                ? `${dateFrom} → ${dateTo}`
                : dateFrom
                ? `Desde ${dateFrom}`
                : `Hasta ${dateTo}`}
            </div>
          )}
        </div>
        </div>
      </div>
      {/* ──────────────────────────────────────────────────────────────── */}

      {/* A — KPI Cards */}
      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              icon={DollarSign}
              label={hasDateFilter ? "Ingresos en período" : "Ingresos totales"}
              value={fmtShort(dashboard?.total_revenue || 0)}
              change={hasDateFilter ? undefined : dashboard?.revenue_change_pct}
              color="#1e3a5f"
            />
            <KpiCard
              icon={ShoppingCart} label="Pedidos pendientes"
              value={dashboard?.pending_orders ?? 0}
              badge={(dashboard?.pending_orders || 0) > 10} color="#f59e0b"
            />
            <KpiCard
              icon={Package} label="Productos activos"
              value={dashboard?.active_products ?? 0} color="#3b82f6"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              icon={Users} label="Clientes activos"
              value={dashboard?.active_clients ?? 0} color="#10b981"
            />
            <KpiCard
              icon={AlertTriangle} label="Stock bajo"
              value={dashboard?.low_stock_products ?? 0}
              badge={(dashboard?.low_stock_products || 0) > 0} color="#ef4444"
            />
            <KpiCard
              icon={ShoppingCart} label={hasDateFilter ? "Pedidos en período" : "Total pedidos"}
              value={totalOrders} color="#8b5cf6"
            />
          </div>
        </div>
      )}

      {/* B — Ventas por mes */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">
            Ventas por mes (Bs.)
            {hasDateFilter && (
              <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                período filtrado
              </span>
            )}
          </h2>
          {/* Selector de período solo cuando no hay filtro de fecha */}
          {!hasDateFilter && (
            <div className="flex gap-1 text-xs">
              {PERIOD_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    period === value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
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
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                  return String(v);
                }}
                width={45}
              />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Area type="monotone" dataKey="confirmed_revenue" name="Confirmados" stroke={PRIMARY} fill="url(#confirmed)" strokeWidth={2} />
              <Area type="monotone" dataKey="pending_revenue" name="Pendientes" stroke="#f59e0b" fill="url(#pending)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* C — Top 10 productos */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">
          Top 10 productos por ingresos
          {hasDateFilter && (
            <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">período filtrado</span>
          )}
        </h2>
        {loading ? <Skeleton className="h-64" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="product_name" tick={{ fontSize: 9 }} width={120} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="total_revenue" name="Ingresos (Bs.)" fill={PRIMARY} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* D — Estado de pedidos + Top 5 clientes */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-4 bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">
            Estado de pedidos
            {hasDateFilter && (
              <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">filtrado</span>
            )}
          </h2>
          {loading ? <Skeleton className="h-52" /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData as any[]} dataKey="count" nameKey="estado" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={COLORS_STATUS[entry.estado] || "#9ca3af"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v} (${totalOrders > 0 ? ((v / totalOrders) * 100).toFixed(1) : 0}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                {statusData.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS_STATUS[s.estado] || "#9ca3af" }} />
                    {s.estado} ({s.count})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="col-span-12 xl:col-span-8 bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Top 5 clientes
            {hasDateFilter && (
              <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">filtrado</span>
            )}
          </h2>
          {loading ? <Skeleton className="h-52" /> : (
            <div className="space-y-4">
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

      {/* E — Alertas de stock bajo */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          Alertas de stock bajo
          <span className="text-xs font-normal text-gray-400">(estado actual, sin filtro de fecha)</span>
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
                    <tr key={item.id} className={isCritical ? "bg-red-50" : "bg-yellow-50"}>
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

      {/* F — Actividad reciente */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">
          Actividad reciente
          {hasDateFilter && (
            <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">filtrado</span>
          )}
        </h2>
        {loading ? <Skeleton className="h-40" /> : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin actividad en el período seleccionado</p>
            ) : activity.map((ev, i) => {
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
