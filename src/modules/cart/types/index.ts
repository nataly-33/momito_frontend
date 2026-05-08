export interface CartItem {
  id: string;
  prenda: {
    id: string;
    nombre: string;
    slug: string;
    precio: number;
    imagen_principal?: string;
  };
  talla: {
    id: string;
    nombre: string;
  };
  cantidad: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  usuario: string;
  items: CartItem[];
  total: number;
  total_items: number;
  cantidad_items: number;
}

export interface AddToCartRequest {
  prenda_id: string;
  talla_id?: string;
  cantidad: number;
}

export interface UpdateCartItemRequest {
  cantidad: number;
}
