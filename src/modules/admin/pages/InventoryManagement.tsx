import React, { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { api } from "@/core/config/api.config";
import { ENDPOINTS } from "@/core/config/endpoints";

interface Movement {
  id: string;
  product: string;
  product_name: string;
  product_code: string;
  user_name: string;
  movement_type: string;
  movement_type_display: string;
  quantity: number;
  notes: string;
  created_at: string;
}

interface Product {
  id: string;
  nombre: string;
  code: string;
  stock: number;
}

export const InventoryManagement: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    product: "", movement_type: "entrada", quantity: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [mov, prods] = await Promise.all([
        api.get(ENDPOINTS.INVENTORY.MOVEMENTS),
        api.get(`${ENDPOINTS.PRODUCTS.BASE}?page_size=100`),
      ]);
      setMovements(mov.data.results || mov.data);
      setProducts(prods.data.results || prods.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.product || !form.quantity) return;
    setSaving(true);
    try {
      await api.post(ENDPOINTS.INVENTORY.MOVEMENTS, {
        product: form.product,
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        notes: form.notes,
      });
      setForm({ product: "", movement_type: "entrada", quantity: "", notes: "" });
      setShowForm(false);
      load();
    } catch (e) {
      alert("Error al registrar movimiento");
    } finally {
      setSaving(false);
    }
  };

  const filtered = movements.filter((m) =>
    !search ||
    m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.product_code?.toLowerCase().includes(search.toLowerCase())
  );

  const typeBadge = (t: string) => {
    if (t === "entrada") return "bg-green-100 text-green-700";
    if (t === "salida") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Inventario — Movimientos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus size={14} /> Registrar movimiento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-700 mb-4">Nuevo movimiento de inventario</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Producto *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
              >
                <option value="">Seleccionar producto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code || "—"}] {p.nombre} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Tipo *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                value={form.movement_type}
                onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
              >
                <option value="entrada">Entrada (suma stock)</option>
                <option value="salida">Salida (resta stock)</option>
                <option value="ajuste">Ajuste (establece stock)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Cantidad *</label>
              <input
                type="number" min="1"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notas</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Motivo del movimiento..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.product || !form.quantity}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            placeholder="Buscar por producto o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-center">Tipo</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-left">Notas</th>
              <th className="px-4 py-3 text-left">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin movimientos registrados</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 font-medium">{m.product_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.product_code || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge(m.movement_type)}`}>
                      {m.movement_type_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{m.quantity}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{m.notes || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{m.user_name || "Sistema"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
