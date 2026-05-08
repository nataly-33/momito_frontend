import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Brain, TrendingUp, TrendingDown, RefreshCw, Calendar,
  Target, AlertCircle, CheckCircle, Sparkles,
} from "lucide-react";
import aiService from "../services/ai.service";
import type { DashboardResponse } from "../services/ai.service";

// Categorías y colores TUMOMITO
const TUMOMITO_CATEGORIES = [
  "Juguetes", "Iluminación", "Ropa y Accesorios", "Bazar", "Ferretería", "Decoración",
];
const CATEGORY_COLORS: Record<string, string> = {
  "Juguetes":          "#3B82F6",
  "Iluminación":       "#F59E0B",
  "Ropa y Accesorios": "#EC4899",
  "Bazar":             "#10B981",
  "Ferretería":        "#6B7280",
  "Decoración":        "#8B5CF6",
};
const FALLBACK_COLORS = ["#3B82F6","#F59E0B","#EC4899","#10B981","#6B7280","#8B5CF6","#EF4444"];

// ── Tooltip personalizado ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-700">{entry.name}:</span>
          </div>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === "number"
              ? new Intl.NumberFormat("es-BO").format(Math.round(entry.value))
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────
const AdminPredictions: React.FC = () => {
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [dashboard, setDashboard]   = useState<DashboardResponse | null>(null);
  const [monthsBack, setMonthsBack]       = useState(24);
  const [monthsForward, setMonthsForward] = useState(6);

  const loadDashboard = async (
    back = monthsBack,
    forward = monthsForward,
    forceRefresh = false,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getDashboard(back, forward, forceRefresh);
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  // Categorías presentes en los datos devueltos por el backend (dinámico)
  const categoriesInData = useMemo(() => {
    if (!dashboard?.predictions_by_category.length) return TUMOMITO_CATEGORIES;
    const cats = Array.from(new Set(dashboard.predictions_by_category.map((p) => p.categoria)));
    return cats.length ? cats : TUMOMITO_CATEGORIES;
  }, [dashboard?.predictions_by_category]);

  // ── Datos para gráfico combinado histórico + predicciones ──────────────
  const combinedChartData = useMemo(() => {
    if (!dashboard) return [];
    const out: any[] = [];

    dashboard.historical.forEach((item) => {
      out.push({
        periodo: aiService.formatPeriodo(item.periodo),
        Histórico: item.cantidad_vendida,
        Predicción: null,
      });
    });

    // Punto de transición
    const lastH = dashboard.historical[dashboard.historical.length - 1];
    if (lastH && dashboard.predictions.length) {
      out.push({
        periodo: aiService.formatPeriodo(lastH.periodo),
        Histórico: null,
        Predicción: lastH.cantidad_vendida,
      });
    }

    dashboard.predictions.forEach((item) => {
      out.push({
        periodo: aiService.formatPeriodo(item.periodo),
        Histórico: null,
        Predicción: Math.round(item.ventas_predichas),
      });
    });

    return out;
  }, [dashboard]);

  // ── Datos para gráfico por categoría (todos los meses juntos) ──────────
  const categoryChartData = useMemo(() => {
    if (!dashboard) return [];
    const grouped: Record<string, any> = {};
    dashboard.predictions_by_category.forEach((pred) => {
      const key = aiService.formatPeriodo(pred.periodo);
      if (!grouped[key]) grouped[key] = { periodo: key };
      grouped[key][pred.categoria] = Math.round(pred.ventas_predichas);
    });
    return Object.values(grouped);
  }, [dashboard]);

  // ── Métricas ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!dashboard || !dashboard.predictions.length) return null;
    const total = dashboard.predictions_by_category.reduce(
      (s, p) => s + p.ventas_predichas, 0
    );
    const avg = total / Math.max(monthsForward, 1);
    const lastH = dashboard.historical[dashboard.historical.length - 1]?.cantidad_vendida || 0;
    const growth = aiService.calculateGrowth(avg, lastH);
    const r2 = dashboard.model_info.r2_score;
    const confidence: "Alta" | "Media" | "Baja" =
      r2 >= 0.8 ? "Alta" : r2 >= 0.6 ? "Media" : "Baja";
    return { total, avg, growth, confidence };
  }, [dashboard, monthsForward]);

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando predicciones…</p>
          <p className="text-xs text-gray-400 mt-1">Usando predicciones guardadas si existen</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={() => loadDashboard()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header con controles */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              Dashboard de Predicciones
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Modelo: {dashboard?.model_info.version} ·{" "}
              R² {((dashboard?.model_info.r2_score ?? 0) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-600">Histórico:</label>
              <select
                value={monthsBack}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMonthsBack(v);
                  loadDashboard(v, monthsForward);
                }}
                className="border rounded-lg px-2 py-1.5 text-sm"
              >
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
                <option value={24}>24 meses</option>
                <option value={48}>48 meses</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-600">Predicción:</label>
              <select
                value={monthsForward}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMonthsForward(v);
                  loadDashboard(monthsBack, v);
                }}
                className="border rounded-lg px-2 py-1.5 text-sm"
              >
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </div>

            <button
              onClick={async () => {
                setGenerating(true);
                try {
                  await loadDashboard(monthsBack, monthsForward, true);
                } finally {
                  setGenerating(false);
                }
              }}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generando…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generar Predicciones</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total predicho</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {new Intl.NumberFormat("es-BO").format(Math.round(metrics.total))}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">unidades ({monthsForward} meses)</p>
            <Target className="w-8 h-8 text-blue-500 opacity-20 mt-2" />
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Promedio mensual</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {new Intl.NumberFormat("es-BO").format(Math.round(metrics.avg))}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">unidades/mes</p>
            <Calendar className="w-8 h-8 text-purple-500 opacity-20 mt-2" />
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tendencia</p>
            <p className={`text-2xl font-bold mt-1 ${aiService.getGrowthColor(metrics.growth)}`}>
              {metrics.growth > 0 ? "+" : ""}{metrics.growth.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-0.5">vs último mes hist.</p>
            {metrics.growth >= 0
              ? <TrendingUp className="w-8 h-8 text-green-500 opacity-20 mt-2" />
              : <TrendingDown className="w-8 h-8 text-red-500 opacity-20 mt-2" />
            }
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Confianza</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.confidence}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              R² = {((dashboard?.model_info.r2_score ?? 0) * 100).toFixed(1)}%
            </p>
            <CheckCircle className={`w-8 h-8 opacity-20 mt-2 ${
              metrics.confidence === "Alta" ? "text-green-500"
              : metrics.confidence === "Media" ? "text-yellow-500"
              : "text-red-500"
            }`} />
          </div>
        </div>
      )}

      {/* Gráfico histórico + predicciones */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Ventas históricas y predicciones</h3>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={combinedChartData}>
            <defs>
              <linearGradient id="gHistorico" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gPrediccion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: 13 }} />
            <Area type="monotone" dataKey="Histórico" stroke="#3B82F6" strokeWidth={2}
              fill="url(#gHistorico)" connectNulls={false} />
            <Area type="monotone" dataKey="Predicción" stroke="#10B981" strokeWidth={2}
              strokeDasharray="5 5" fill="url(#gPrediccion)" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Predicciones por categoría — todas las categorías en el mismo gráfico */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Predicciones por categoría — próximos {monthsForward} meses
        </h3>
        {categoryChartData.length === 0 ? (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            No hay predicciones disponibles. Haz clic en "Generar Predicciones" o
            re-entrena el modelo con <code className="bg-yellow-100 px-1 rounded">python manage.py train_model</code>.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 12 }} />
                {categoriesInData.map((cat, i) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    fill={CATEGORY_COLORS[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>

            {/* Leyenda resumen */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categoriesInData.map((cat, i) => {
                const color = CATEGORY_COLORS[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const total = (dashboard?.predictions_by_category ?? [])
                  .filter((p) => p.categoria === cat)
                  .reduce((s, p) => s + p.ventas_predichas, 0);
                return (
                  <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-gray-700">{cat}:</span>
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat("es-BO").format(Math.round(total))}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Tabla detallada */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Desglose por mes y categoría</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs text-gray-500 uppercase">
                <th className="text-left py-2 px-3">Categoría</th>
                <th className="text-right py-2 px-3">Predicción (unid.)</th>
                <th className="text-center py-2 px-3">Confianza</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const grouped: Record<string, typeof dashboard.predictions_by_category> = {};
                dashboard?.predictions_by_category.forEach((pred) => {
                  if (!grouped[pred.periodo]) grouped[pred.periodo] = [];
                  grouped[pred.periodo].push(pred);
                });
                return Object.entries(grouped).map(([periodo, preds]) => (
                  <React.Fragment key={periodo}>
                    <tr>
                      <td colSpan={3} className="py-2 px-3 font-semibold text-gray-800 bg-blue-50 border-t-2 border-blue-100">
                        {aiService.formatPeriodo(periodo)}
                      </td>
                    </tr>
                    {preds.map((pred) => (
                      <tr key={pred.prediccion_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 pl-7 text-gray-800">
                          <span className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ background: CATEGORY_COLORS[pred.categoria] || "#9ca3af" }} />
                          {pred.categoria}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-gray-900">
                          {new Intl.NumberFormat("es-BO").format(Math.round(pred.ventas_predichas))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${aiService.getConfidenceColor(pred.confianza)}`}>
                            {pred.confianza}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info modelo */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-600">
        <div><span className="font-medium">Versión:</span> {dashboard?.model_info.version}</div>
        <div>
          <span className="font-medium">Entrenado:</span>{" "}
          {new Date(dashboard?.model_info.trained_at || "").toLocaleDateString("es-ES")}
        </div>
        <div><span className="font-medium">R²:</span> {((dashboard?.model_info.r2_score ?? 0) * 100).toFixed(2)}%</div>
        <div><span className="font-medium">MAE:</span> {dashboard?.model_info.mae.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default AdminPredictions;
