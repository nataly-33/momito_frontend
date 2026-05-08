// Información del usuario
export interface OrderUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
}

// Información de la dirección de envío
export interface ShippingAddress {
  id: string;
  nombre_completo: string;
  telefono: string;
  direccion_completa: string;
  ciudad: string;
  departamento: string;
  pais: string;
  referencia?: string;
}

// Método de pago
export interface PaymentMethod {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  requiere_procesador: boolean;
}

// Información del pago
export interface OrderPayment {
  id: string;
  metodo_pago: PaymentMethod;
  monto: number;
  estado: string;
  transaction_id?: string;
  created_at: string;
}

// Producto en el pedido
export interface OrderItemProduct {
  id: string;
  nombre: string;
  slug: string;
  imagen_principal?: string;
}

// Talla en el pedido
export interface OrderItemSize {
  id: string;
  nombre: string;
}

// Detalle del item en el pedido
export interface OrderItem {
  id: string;
  prenda: OrderItemProduct;
  prenda_detalle?: OrderItemProduct;
  talla: OrderItemSize;
  talla_detalle?: OrderItemSize;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto_snapshot?: Record<string, any>;
}

// Historial de cambios de estado
export interface OrderStatusHistory {
  id: string;
  estado_anterior: string;
  estado_nuevo: string;
  usuario_cambio?: OrderUser;
  usuario_cambio_detalle?: OrderUser;
  notas: string;
  created_at: string;
}

// Pedido completo
export interface Order {
  id: string;
  numero_pedido: string;
  usuario: string | OrderUser;
  usuario_detalle?: OrderUser;
  estado: string;
  subtotal: number;
  descuento: number;
  costo_envio: number;
  total: number;
  total_items: number;
  puede_cancelar: boolean;

  // Items del pedido
  detalles: OrderItem[];

  // Información de envío
  direccion_envio: string | ShippingAddress;
  direccion_envio_detalle?: ShippingAddress;
  direccion_snapshot?: Record<string, any>;

  // Pagos
  pagos: OrderPayment[];

  // Notas y metadata
  notas_cliente?: string;
  notas_internas?: string;
  metadata?: Record<string, any>;

  // Histórico
  historial_estados?: OrderStatusHistory[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Parámetros para listar pedidos
export interface OrdersParams {
  estado?: string;
  page?: number;
  ordering?: string;
}

// Datos para el checkout
export interface CheckoutData {
  direccion_envio_id?: string;    // opcional: dirección guardada
  direccion_texto?: string;       // opcional: dirección libre (texto)
  metodo_pago: "efectivo" | "tarjeta";
  notas_cliente?: string;
  payment_method_id?: string;     // Stripe pm_xxx (requerido si metodo_pago === 'tarjeta')
}

// Respuesta del checkout
export interface CheckoutResponse {
  message: string;
  pedido: Order;
  stripe_client_secret?: string; // presente si el pago requiere 3D Secure
}
