import { useEffect, useState } from "react";
import { Package, Search, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@shared/components/ui/Button";
import { ordersService } from "../services/admin.service";
import type { Order } from "../types";
import { Pagination } from "@shared/components/ui/Pagination";

const ESTADOS_PEDIDO = [
  { value: "pendiente",     label: "Pendiente",     color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmado",    label: "Confirmado",    color: "bg-purple-100 text-purple-700" },
  { value: "despachado",    label: "Despachado",    color: "bg-indigo-100 text-indigo-700" },
  { value: "entregado",     label: "Entregado",     color: "bg-green-100 text-green-700" },
  { value: "cancelado",     label: "Cancelado",     color: "bg-red-100 text-red-700" },
  { value: "pago_recibido", label: "Pago recibido", color: "bg-blue-100 text-blue-700" },
  { value: "preparando",    label: "Preparando",    color: "bg-amber-100 text-amber-700" },
  { value: "enviado",       label: "Enviado",       color: "bg-teal-100 text-teal-700" },
];

const PAYMENT_LABELS: Record<string, string> = {
  transferencia: "Transferencia",
  credito: "Crédito",
  efectivo: "Efectivo",
  stripe: "Tarjeta",
  tarjeta: "Tarjeta",
  paypal: "PayPal",
  billetera: "Billetera",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 }).format(n);
}

export const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const loadOrders = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await ordersService.getAll({
        search: searchTerm,
        estado: filterEstado,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        page: pageNum,
        limit: pageSize,
      });

      if (response && typeof response === "object" && "results" in response) {
        setOrders(Array.isArray(response.results) ? response.results : []);
        setTotalCount((response as any).count || 0);
      } else if (Array.isArray(response)) {
        setOrders(response);
        setTotalCount(response.length);
      } else {
        setOrders([]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadOrders(1); }, 350);
    return () => clearTimeout(t);
  }, [searchTerm, filterEstado, fechaInicio, fechaFin]);

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      await ordersService.updateStatus(selectedOrder.id, newStatus);
      setShowStatusModal(false);
      loadOrders(page);
    } catch {
      alert("Error al actualizar estado");
    }
  };

  const getStatusStyle = (estado: string) =>
    ESTADOS_PEDIDO.find((e) => e.value === estado)?.color || "bg-gray-100 text-gray-600";
  const getStatusLabel = (estado: string) =>
    ESTADOS_PEDIDO.find((e) => e.value === estado)?.label || estado;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400"
              placeholder="Buscar por N° pedido, empresa o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Estado */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-400"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {/* Filtro por fechas */}
        <div className="flex flex-wrap gap-3 items-center">
          <Calendar size={14} className="text-gray-400 shrink-0" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          {(fechaInicio || fechaFin) && (
            <button
              onClick={() => { setFechaInicio(""); setFechaFin(""); }}
              className="text-xs text-red-500 hover:underline"
            >
              Limpiar fechas
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {totalCount} pedido{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Cargando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Package size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No se encontraron pedidos</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">N° Pedido</th>
                  <th className="px-4 py-3 text-left">Cliente / Empresa</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-center">Fecha</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const clienteNombre = (order as any).cliente_nombre ||
                    (order as any).usuario_detalle?.nombre_completo || "—";
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">
                        {order.numero_pedido}
                      </td>
                      <td className="px-4 py-3 font-medium max-w-xs truncate" title={clienteNombre}>
                        {clienteNombre}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {fmt(Number(order.total))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(order.estado)}`}>
                          {getStatusLabel(order.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {PAYMENT_LABELS[(order as any).payment_method || ""] || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("es-BO", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.estado);
                            setShowStatusModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                        >
                          <ChevronDown size={11} /> Estado
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalCount > pageSize && (
            <Pagination
              total={totalCount}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={(p) => loadOrders(p)}
            />
          )}
        </>
      )}

      {/* Modal cambio de estado */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-gray-800 mb-1">Cambiar estado</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedOrder.numero_pedido}</p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-blue-400"
            >
              {ESTADOS_PEDIDO.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowStatusModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleStatusChange} className="flex-1">
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
