export interface Size {
  id: string;
  nombre: string;
  orden: number;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  marca_nombre?: string;
  marca_detalle?: Brand;
  categorias_detalle?: Category[];
  color: string;
  material?: string;
  slug: string;
  tallas_disponibles_detalle: Size[];
  imagenes_url?: Array<{
    id: string;
    imagen_url: string;
    es_principal: boolean;
    orden: number;
    alt_text?: string;
  }>;
  imagen_principal: string | null;
  stock_total: number;
  tiene_stock: boolean;
  min_order_qty?: number;
  price_wholesale?: number;
  activa: boolean;
  destacada: boolean;
  es_novedad: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  nombre: string;
  descripcion: string;
  imagen_url: string | null;  // URL relativa devuelta por el backend
  activa: boolean;
  total_prendas: number;
}

export interface Brand {
  id: string;
  nombre: string;
  descripcion: string;
  logo: string | null;
  activa: boolean;
  total_prendas: number;
}

export interface Size {
  id: string;
  nombre: string;
  orden: number;
}

export interface ProductsResponse {
  results: Product[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ProductFilters {
  search?: string;
  categoria?: string;
  marca?: string;
  precio_min?: number;
  precio_max?: number;
  ordering?: string;
  page?: number;
}
