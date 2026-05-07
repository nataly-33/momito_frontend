import React, { useEffect, useState } from "react";
import { Plus, Download, Search, FileText } from "lucide-react";
import { api } from "@/core/config/api.config";
import { ENDPOINTS } from "@/core/config/endpoints";

interface Quote {
  id: string;
  numero_cotizacion: string;
  client_name: string;
  seller_name: string;
  status: string;
  status_display: string;
  total: number;
  valid_until: string;
  notes: string;
  created_at: string;
  items: QuoteItem[];
}

interface QuoteItem {
  product: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Client {
  id: string;
  company_name: string;
}

interface Product {
  id: string;
  nombre: string;
  code: string;
  price_wholesale: number;
}

const STATUS_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-600",
  enviada: "bg-blue-100 text-blue-700",
  aceptada: "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-700",
};

export const QuotesManagement: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client: "", valid_until: "", notes: "", items: [] as QuoteItem[],
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [q, c, p] = await Promise.all([
        api.get(ENDPOINTS.QUOTES.BASE),
        api.get(ENDPOINTS.CUSTOMERS.CLIENTS),
        api.get(`${ENDPOINTS.PRODUCTS.BASE}?page_size=100`),
      ]);
      setQuotes(q.data.results || q.data);
      setClients(c.data.results || c.data);
      setProducts(p.data.results || p.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { product: "", product_name: "", product_code: "", quantity: 1, unit_price: 0, subtotal: 0 }],
    }));

  const removeItem = (i: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i: number, field: string, value: string | number) => {
    setForm((f) => {
      const items = [...f.items];
      (items[i] as Record<string, unknown>)[field] = value;
      if (field === "product") {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          items[i].unit_price = prod.price_wholesale;
          items[i].product_name = prod.nombre;
          items[i].product_code = prod.code;
        }
      }
      items[i].subtotal = items[i].quantity * items[i].unit_price;
      return { ...f, items };
    });
  };

  const handleSave = async () => {
    if (!form.client || form.items.length === 0) return;
    setSaving(true);
    try {
      await api.post(ENDPOINTS.QUOTES.BASE, {
        client: form.client,
        valid_until: form.valid_until || null,
        notes: form.notes,
        items: form.items.map((it) => ({
          product: it.product,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });
      setForm({ client: "", valid_until: "", notes: "", items: [] });
      setShowForm(false);
      load();
    } catch (e) {
      alert("Error al crear cotización");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (id: string, num: string) => {
    setDownloadingId(id);
    try {
      const resp = await api.get(ENDPOINTS.QUOTES.PDF(id), { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${num}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error al descargar PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = quotes.filter(
    (q) =>
      !search ||
      q.numero_cotizacion.toLowerCase().includes(search.toLowerCase()) ||
      q.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n);

  const formTotal = form.items.reduce((a, b) => a + b.subtotal, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Cotizaciones B2B</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus size={14} /> Nueva cotización
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-700 mb-4">Nueva cotización</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Cliente *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Válida hasta</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notas</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones..."
              />
            </div>
          </div>

          {/* Items */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Productos</h4>
              <button onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> Agregar línea
              </button>
            </div>
            {form.items.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center border border-dashed rounded-lg">
                Sin productos — haz clic en "Agregar línea"
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-2 py-1.5 text-left w-1/2">Producto</th>
                    <th className="px-2 py-1.5 text-right">Cant.</th>
                    <th className="px-2 py-1.5 text-right">P.Unit (Bs.)</th>
                    <th className="px-2 py-1.5 text-right">Subtotal</th>
                    <th className="px-2 py-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">
                        <select
                          className="w-full border rounded px-2 py-1 text-xs"
                          value={item.product}
                          onChange={(e) => updateItem(i, "product", e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          {products.map((p) => <option key={p.id} value={p.id}>[{p.code}] {p.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number" min="1"
                          className="w-16 border rounded px-2 py-1 text-xs text-right"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number" min="0" step="0.01"
                          className="w-24 border rounded px-2 py-1 text-xs text-right"
                          value={item.unit_price}
                          onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-1 text-right font-medium">{fmt(item.subtotal)}</td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-gray-50">
                    <td colSpan={3} className="px-2 py-1.5 text-right font-bold text-sm">TOTAL</td>
                    <td className="px-2 py-1.5 text-right font-bold text-sm">{fmt(formTotal)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.client || form.items.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Crear cotización"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            placeholder="Buscar por número o cliente..."
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
              <th className="px-4 py-3 text-left">N° Cotización</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Vendedor</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Total (Bs.)</th>
              <th className="px-4 py-3 text-left">Válida hasta</th>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin cotizaciones</td></tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{q.numero_cotizacion}</td>
                  <td className="px-4 py-3 font-medium">{q.client_name}</td>
                  <td className="px-4 py-3 text-gray-500">{q.seller_name || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status] || "bg-gray-100 text-gray-600"}`}>
                      {q.status_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(q.total)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{q.valid_until || "—"}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {new Date(q.created_at).toLocaleDateString("es-BO")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDownloadPdf(q.id, q.numero_cotizacion)}
                      disabled={downloadingId === q.id}
                      className="flex items-center gap-1 mx-auto text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <Download size={11} />
                      {downloadingId === q.id ? "..." : "PDF"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
