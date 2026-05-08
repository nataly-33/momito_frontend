export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  telefono?: string;
  foto_perfil?: string;
  rol_detalle: {
    id: string;
    nombre: string;
  };
  codigo_empleado?: string;
  activo: boolean;
  email_verificado: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  password_confirm: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: string; // rol ID
  codigo_empleado?: string;
  activo?: boolean;
}

export interface UpdateUserData {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  rol?: string;
  activo?: boolean;
}

export interface Permission {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  modulo: string;
}

export interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  es_rol_sistema: boolean;
  permisos: Permission[];
  created_at: string;
}

export interface CreateRoleData {
  nombre: string;
  descripcion: string;
  permisos_ids?: string[];
}

export interface UpdateRoleData {
  nombre?: string;
  descripcion?: string;
  permisos_ids?: string[];
}

export interface Product {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: string | number;
  marca: {
    id: string;
    nombre: string;
  };
  marca_nombre?: string;
  categorias: Array<{
    id: string;
    nombre: string;
  }>;
  categorias_detalle?: Array<{
    id: string;
    nombre: string;
  }>;
  color: string;
  material?: string;
  imagen_principal: string | null;
  imagenes?: Array<{
    id: string;
    imagen: string;
    es_principal: boolean;
  }>;
  stock_total: number;
  tiene_stock?: boolean;
  activa: boolean;
  destacada: boolean;
  es_novedad: boolean;
  tallas_disponibles?: Array<{
    id: string;
    nombre: string;
  }>;
  tallas_disponibles_detalle?: Array<{
    id: string;
    nombre: string;
  }>;
  stocks?: Array<{
    id: string;
    talla: string;
    talla_detalle?: {
      id: string;
      nombre: string;
    };
    cantidad: number;
    stock_minimo: number;
  }>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  nombre: string;
  descripcion: string;
  precio: number;
  marca: string;
  categorias: string[];
  tallas_disponibles?: string[];
  color: string;
  material?: string;
  activa?: boolean;
  destacada?: boolean;
  es_novedad?: boolean;
  imagen?: File;
  stocks?: Array<{
    talla: string;
    cantidad: number;
    stock_minimo?: number;
  }>;
}

export interface UpdateProductData {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  marca?: string;
  categorias?: string[];
  tallas_disponibles?: string[];
  color?: string;
  material?: string;
  activa?: boolean;
  destacada?: boolean;
  es_novedad?: boolean;
  stocks?: Array<{
    talla: string;
    cantidad: number;
    stock_minimo?: number;
  }>;
}

export interface Category {
  id: string;
  nombre: string;
  slug?: string;
  descripcion: string;
  imagen_url?: string | null;  // URL relativa: /images/categorias/file.jpg
  activa: boolean;
  total_prendas: number;
  created_at: string;
}

export interface CreateCategoryData {
  nombre: string;
  descripcion: string;
  imagen?: File;
  activa?: boolean;
}

export interface UpdateCategoryData {
  nombre?: string;
  descripcion?: string;
  imagen?: File;
  activa?: boolean;
}

export interface Brand {
  id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  activa: boolean;
  total_prendas?: number;
  created_at: string;
}

export interface CreateBrandData {
  nombre: string;
  descripcion?: string;
  logo?: File;
  activa?: boolean;
}

export interface UpdateBrandData {
  nombre?: string;
  descripcion?: string;
  logo?: File;
  activa?: boolean;
}

export interface Size {
  id: string;
  nombre: string;
  orden: number;
}

export interface OrderDetail {
  id: string;
  prenda: string;
  prenda_detalle: Product;
  talla: string;
  talla_detalle: Size;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Order {
  id: string;
  numero_pedido: string;
  usuario_detalle?: User;
  estado:
    | "pendiente"
    | "pago_recibido"
    | "confirmado"
    | "preparando"
    | "enviado"
    | "entregado"
    | "cancelado"
    | "reembolsado";
  subtotal: number;
  descuento: number;
  costo_envio: number;
  total: number;
  total_items: number;
  notas_cliente?: string;
  notas_internas?: string;
  detalles?: OrderDetail[];
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  numero_seguimiento: string;
  pedido_numero: string;
  estado:
    | "pendiente"
    | "preparando"
    | "recogido"
    | "en_transito"
    | "entregado"
    | "devuelto"
    | "cancelado";
  asignado_a?: User;
  fecha_envio?: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  empresa_transportista?: string;
  costo_envio: number;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserFilters {
  search?: string;
  rol?: string;
  activo?: boolean;
  page?: number;
}

export interface ProductFilters {
  search?: string;
  categoria?: string;
  marca?: string;
  precio_min?: number;
  precio_max?: number;
  activa?: boolean;
  destacada?: boolean;
  es_novedad?: boolean;
  page?: number;
}

export interface CategoryFilters {
  search?: string;
  activa?: boolean;
  page?: number;
}
