import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements, CardElement, useStripe, useElements,
} from "@stripe/react-stripe-js";
import {
  MapPin, CreditCard, Banknote, ShieldCheck, CheckCircle2, XCircle,
  Loader2, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@core/store/auth.store";
import { cartService } from "@modules/cart/services/cart.service";
import { ordersService } from "@modules/orders/services/orders.service";
import { PUBLIC_ROUTES } from "@/core/config/routes";
import type { Cart } from "@modules/cart/types";
import type { PaymentMethod, Order } from "@modules/orders/types";
import { LoadingSpinner } from "@shared/components/ui/LoadingSpinner";

// ──────────────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

const CARD_STYLE = {
  hidePostalCode: true,   // ZIP se captura en el campo de dirección del formulario
  style: {
    base: {
      fontSize: "15px",
      color: "#1a1a1a",
      fontFamily: "'Inter', sans-serif",
      "::placeholder": { color: "#9ca3af" },
      letterSpacing: "0.02em",
    },
    invalid: { color: "#dc2626" },
  },
};

type FlowState = "idle" | "processing" | "success" | "error";

// ──────────────────────────────────────────
// Field helper
function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function Input({
  value, onChange, placeholder, error, type = "text",
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors
        ${error
          ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          : "border-gray-200 focus:border-primary-main focus:ring-1 focus:ring-primary-main"
        }`}
    />
  );
}

// ──────────────────────────────────────────
// Order summary (right column)
function OrderSummaryColumn({
  cart, onConfirm, isProcessing,
}: { cart: Cart; onConfirm: () => void; isProcessing: boolean }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 2 }).format(n);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">Resumen del pedido</h3>

      <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.prenda.imagen_principal ? (
                <img src={item.prenda.imagen_principal} alt={item.prenda.nombre}
                  className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-700 truncate">{item.prenda.nombre}</p>
              <p className="text-gray-400 text-xs">× {item.cantidad}</p>
            </div>
            <span className="text-gray-700 font-medium whitespace-nowrap">
              {fmt(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{fmt(cart.total)}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Envío</span>
          <span className="font-medium">Gratis</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>{fmt(cart.total)}</span>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={isProcessing}
        className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-chocolate
          hover:bg-accent-mauve text-white font-semibold rounded-xl transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            Confirmar pedido
            <ChevronRight size={18} />
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck size={13} className="text-green-500" />
        Pago 100% seguro y encriptado
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Modal de resultado del pago
function ResultModal({
  flow, order, error, onRetry, onViewOrder,
}: {
  flow: FlowState;
  order: Order | null;
  error: string;
  onRetry: () => void;
  onViewOrder: (id: string) => void;
}) {
  if (flow === "processing") {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
          <Loader2 size={48} className="animate-spin text-accent-chocolate" />
          <p className="font-semibold text-gray-800 text-lg">Procesando pago...</p>
          <p className="text-sm text-gray-500 text-center">
            No cierres esta ventana. Estamos verificando tu tarjeta con Stripe.
          </p>
        </div>
      </div>
    );
  }

  if (flow === "success" && order) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-5 max-w-sm mx-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">¡Pedido confirmado!</h2>
            <p className="text-sm text-gray-500">
              Pedido <span className="font-semibold text-gray-700">{order.numero_pedido}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Tu pedido ha sido procesado exitosamente.
            </p>
          </div>
          <button
            onClick={() => onViewOrder(order.id)}
            className="w-full px-6 py-3 bg-accent-chocolate hover:bg-accent-mauve text-white font-semibold rounded-xl transition-colors"
          >
            Ver mi pedido
          </button>
        </div>
      </div>
    );
  }

  if (flow === "error") {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-5 max-w-sm mx-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle size={40} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Pago rechazado</h2>
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mt-2">
              {error}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 bg-accent-chocolate hover:bg-accent-mauve text-white font-medium rounded-xl text-sm transition-colors"
            >
              Intentar de nuevo
            </button>
            <button
              onClick={() => window.location.href = PUBLIC_ROUTES.CART}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors"
            >
              Ver carrito
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ──────────────────────────────────────────
// Componente interno (necesita acceder a useStripe / useElements)
function CheckoutInner() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const stripe = useStripe();
  const elements = useElements();

  const [cart, setCart] = useState<Cart | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario de dirección
  const [fullName, setFullName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Santa Cruz");
  const [phone, setPhone] = useState("");

  // Pago
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [billingName, setBillingName] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Flujo de pago
  const [flow, setFlow] = useState<FlowState>("idle");
  const [resultOrder, setResultOrder] = useState<Order | null>(null);
  const [paymentError, setPaymentError] = useState("");

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) ?? null;
  const isCard = selectedMethod?.codigo === "tarjeta";

  useEffect(() => {
    if (!isAuthenticated) { navigate(PUBLIC_ROUTES.LOGIN); return; }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cartData, methodsData] = await Promise.all([
        cartService.getCart(),
        ordersService.getPaymentMethods(),
      ]);
      setCart(cartData);
      setPaymentMethods(methodsData);
      if (methodsData.length > 0) setSelectedMethodId(methodsData[0].id);
    } catch {
      // silencioso; UI mostrará estado vacío
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Requerido";
    if (!addressLine.trim()) errs.addressLine = "Requerido";
    if (!city.trim()) errs.city = "Requerido";
    if (!selectedMethodId) errs.method = "Selecciona un método de pago";
    if (isCard && !billingName.trim()) errs.billingName = "Requerido";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmOrder = async () => {
    if (!validate() || !cart || !selectedMethod) return;

    setFlow("processing");
    setPaymentError("");

    try {
      let paymentMethodId: string | undefined;

      if (isCard) {
        if (!stripe || !elements) throw new Error("Stripe no disponible. Recarga la página.");
        const cardEl = elements.getElement(CardElement);
        if (!cardEl) throw new Error("Ingresa los datos de la tarjeta.");

        const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
          type: "card",
          card: cardEl,
          billing_details: {
            name: billingName,
            address: { line1: addressLine, city, country: "BO" },
          },
        });
        if (pmError) throw new Error(pmError.message);
        paymentMethodId = paymentMethod!.id;
      }

      const response = await ordersService.checkout({
        metodo_pago: selectedMethod.codigo as "efectivo" | "tarjeta",
        direccion_texto: [fullName, addressLine, city, phone ? `Tel: ${phone}` : ""]
          .filter(Boolean).join(", "),
        payment_method_id: paymentMethodId,
        notas_cliente: notes || undefined,
      });

      // 3D Secure si el banco lo requiere
      if (response.stripe_client_secret && stripe) {
        const { error: actionError } = await stripe.handleCardAction(
          response.stripe_client_secret
        );
        if (actionError) throw new Error(actionError.message || "Autenticación 3D Secure fallida");
      }

      await cartService.clearCart();
      setResultOrder(response.pedido);
      setFlow("success");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Error al procesar el pago";
      setPaymentError(msg);
      setFlow("error");
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ── Carrito vacío ──
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-gray-500 text-lg">Tu carrito está vacío.</p>
        <button
          onClick={() => navigate(PUBLIC_ROUTES.PRODUCTS)}
          className="px-6 py-2.5 bg-accent-chocolate text-white rounded-xl text-sm font-medium hover:bg-accent-mauve"
        >
          Explorar productos
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Modales de resultado */}
      <ResultModal
        flow={flow}
        order={resultOrder}
        error={paymentError}
        onRetry={() => setFlow("idle")}
        onViewOrder={(id) => navigate(`/orders/${id}`)}
      />

      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Finalizar pedido</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {cart.cantidad_items} {cart.cantidad_items === 1 ? "producto" : "productos"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── COLUMNA IZQUIERDA ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Dirección de entrega */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <MapPin size={18} className="text-accent-chocolate" />
                  Dirección de entrega
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Nombre completo" required error={formErrors.fullName}>
                      <Input
                        value={fullName}
                        onChange={setFullName}
                        placeholder="María García López"
                        error={formErrors.fullName}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Dirección" required error={formErrors.addressLine}>
                      <Input
                        value={addressLine}
                        onChange={setAddressLine}
                        placeholder="Av. Las Américas #123, Zona Norte"
                        error={formErrors.addressLine}
                      />
                    </Field>
                  </div>
                  <Field label="Ciudad" required error={formErrors.city}>
                    <Input value={city} onChange={setCity} placeholder="Santa Cruz" error={formErrors.city} />
                  </Field>
                  <Field label="Teléfono">
                    <Input value={phone} onChange={setPhone} placeholder="+591 70000000" type="tel" />
                  </Field>
                </div>
              </div>

              {/* Método de pago */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-accent-chocolate" />
                  Método de pago
                </h2>

                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay métodos de pago disponibles.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {paymentMethods.filter((m) => m.activo).map((m) => {
                      const isSelected = m.id === selectedMethodId;
                      const icon = m.codigo === "tarjeta"
                        ? <CreditCard size={20} />
                        : <Banknote size={20} />;
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${isSelected
                              ? "border-primary-main bg-neutral-lightest"
                              : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={m.id}
                            checked={isSelected}
                            onChange={() => setSelectedMethodId(m.id)}
                            className="sr-only"
                          />
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-primary-light text-accent-chocolate" : "bg-gray-100 text-gray-500"}`}>
                            {icon}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-800">{m.nombre}</p>
                            {m.descripcion && (
                              <p className="text-xs text-gray-500 mt-0.5">{m.descripcion}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-neutral-lightest0 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Stripe Card Form */}
                {isCard && (
                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Datos de la tarjeta
                    </h3>
                    <div className="space-y-3">
                      <Field label="Nombre en la tarjeta" required error={formErrors.billingName}>
                        <Input
                          value={billingName}
                          onChange={setBillingName}
                          placeholder="Nombre tal como aparece en la tarjeta"
                          error={formErrors.billingName}
                        />
                      </Field>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de tarjeta, fecha y CVV <span className="text-red-500">*</span>
                        </label>
                        <div className="px-3 py-3 border-2 border-gray-200 rounded-lg
                          focus-within:border-primary-main focus-within:ring-1 focus-within:ring-primary-main transition-all bg-white">
                          <CardElement options={CARD_STYLE} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                      <ShieldCheck size={13} className="text-green-500" />
                      Pago seguro procesado por Stripe. Tus datos están encriptados con TLS.
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas del pedido <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales para la entrega..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                      focus:border-primary-main focus:ring-1 focus:ring-primary-main outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ── COLUMNA DERECHA ── */}
            <div>
              <OrderSummaryColumn
                cart={cart}
                onConfirm={handleConfirmOrder}
                isProcessing={flow === "processing"}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Wrapper con Stripe Elements ──
export function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner />
    </Elements>
  );
}
