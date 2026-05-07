export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "auth/login/",
    LOGOUT: "auth/logout/",
    REFRESH: "auth/refresh/",
    REGISTER: "auth/register/",
    ME: "auth/me/",
    CHANGE_PASSWORD: () => `auth/users/change_password/`,
  },

  USERS: {
    BASE: "auth/users/",
    BY_ID: (id: string) => `auth/users/${id}/`,
    PROFILE: "auth/profile/",
  },

  ROLES: {
    BASE: "auth/roles/",
    BY_ID: (id: string) => `auth/roles/${id}/`,
  },

  PRODUCTS: {
    BASE: "products/prendas/",
    BY_ID: (id: string) => `products/prendas/${id}/`,
    BY_SLUG: (slug: string) => `products/prendas/${slug}/`,
    CATEGORIES: "products/categorias/",
    CATEGORY_BY_ID: (id: string) => `products/categorias/${id}/`,
    BRANDS: "products/marcas/",
    BRAND_BY_ID: (id: string) => `products/marcas/${id}/`,
    SIZES: "products/tallas/",
    SIZE_BY_ID: (id: string) => `products/tallas/${id}/`,
    SEARCH: "products/prendas/search/",
  },

  CART: {
    BASE: "cart/",
    MY_CART: "cart/mi_carrito/",
    ADD_ITEM: "cart/agregar/",
    UPDATE_ITEM: (id: string) => `cart/items/${id}/actualizar/`,
    REMOVE_ITEM: (id: string) => `cart/items/${id}/eliminar/`,
    CLEAR: "cart/limpiar/",
  },

  ORDERS: {
    BASE: "orders/pedidos/",
    BY_ID: (id: string) => `orders/pedidos/${id}/`,
    MY_ORDERS: "orders/pedidos/",
    CHECKOUT: "orders/pedidos/checkout/",
    CANCEL: (id: string) => `orders/pedidos/${id}/cancelar/`,
    UPDATE_STATUS: (id: string) => `orders/pedidos/${id}/cambiar_estado/`,
    PAYMENT_METHODS: "orders/metodos-pago/",
  },

  CUSTOMERS: {
    PROFILE: "customers/profile/me/",
    UPDATE_PROFILE: "customers/profile/me/",
    WALLET: "customers/profile/wallet/",
    WALLET_RECHARGE: "customers/profile/wallet_recharge/",
    ADDRESSES: "customers/addresses/",
    ADDRESS_BY_ID: (id: string) => `customers/addresses/${id}/`,
    SET_MAIN_ADDRESS: (id: string) =>
      `customers/addresses/${id}/set_principal/`,
    FAVORITES: "customers/favorites/",
    FAVORITE_BY_ID: (id: string) => `customers/favorites/${id}/`,
    TOGGLE_FAVORITE: "customers/favorites/toggle/",
    CLIENTS: "customers/clients/",
    CLIENT_BY_ID: (id: string) => `customers/clients/${id}/`,
    MY_COMPANY: "customers/clients/mi_empresa/",
  },

  INVENTORY: {
    MOVEMENTS: "products/inventory-movements/",
    MOVEMENT_BY_ID: (id: string) => `products/inventory-movements/${id}/`,
  },

  QUOTES: {
    BASE: "quotes/",
    BY_ID: (id: string) => `quotes/${id}/`,
    PDF: (id: string) => `quotes/${id}/pdf/`,
  },

  REPORTS: {
    DASHBOARD: "reports/dashboard/",
    SALES: "reports/sales/",
    MONTHLY: "reports/monthly/",
    TOP_CLIENTS: "reports/top-clients/",
    ORDERS_STATUS: "reports/orders-status/",
    LOW_STOCK: "reports/low-stock/",
    BRANDS: "reports/brands/",
    CATEGORIES: "reports/categories/",
    RECENT_ACTIVITY: "reports/recent-activity/",
  },

  AI: {
    DASHBOARD: "ai/dashboard/",
    FORECAST: (id: string) => `ai/forecast/${id}/`,
    REORDER_ALERT: "ai/reorder-alert/",
    TOP_PREDICTED: "ai/top-predicted/",
    TRAIN: "ai/train-model/",
  },
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
