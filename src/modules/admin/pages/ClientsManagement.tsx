import React, { useEffect, useState } from "react";
import { Plus, Search, Building2 } from "lucide-react";
import { api } from "@/core/config/api.config";
import { ENDPOINTS } from "@/core/config/endpoints";

interface Client {
  id: string;
  company_name: string;
  nit: string;
  city: string;
  phone: string;
  credit_limit: number;
  client_type: string;
  client_type_display: string;
  total_orders: number;
  total_spent: number;
  user_email: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  vip: "bg-yellow-100 text-yellow-800",
  regular: "bg-blue-100 text-blue-800",
  nuevo: "bg-gray-100 text-gray-600",
};

export const ClientsManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.CUSTOMERS.CLIENTS);
      setClients(data.results || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 }).format(n);

  const filtered = clients.filter((c) => {
    const matchSearch = !search ||
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nit || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || c.client_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Clientes Empresa B2B</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            placeholder="Buscar por nombre, NIT, ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-lg px-3 py-2 text-sm text-gray-600"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="vip">VIP</option>
          <option value="regular">Regular</option>
          <option value="nuevo">Nuevo</option>
        </select>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
          <p className="text-xs text-gray-500 mt-1">Clientes totales</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{clients.filter((c) => c.client_type === "vip").length}</p>
          <p className="text-xs text-gray-500 mt-1">Clientes VIP</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {fmt(clients.reduce((a, b) => a + (b.total_spent || 0), 0))}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ingresos totales</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">NIT</th>
              <th className="px-4 py-3 text-left">Ciudad</th>
              <th className="px-4 py-3 text-center">Tipo</th>
              <th className="px-4 py-3 text-right">Límite crédito</th>
              <th className="px-4 py-3 text-right">Pedidos</th>
              <th className="px-4 py-3 text-right">Total gastado</th>
              <th className="px-4 py-3 text-left">Email usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin clientes registrados</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400 shrink-0" />
                      <span className="font-medium truncate max-w-48">{c.company_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.nit || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.city || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.client_type] || "bg-gray-100 text-gray-600"}`}>
                      {c.client_type_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{fmt(c.credit_limit || 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.total_orders || 0}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(c.total_spent || 0)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-40">{c.user_email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
