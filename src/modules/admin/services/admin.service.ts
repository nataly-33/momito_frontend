import api from "@core/config/api.config";
import { ENDPOINTS } from "@core/config/endpoints";
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
  Role,
  CreateRoleData,
  UpdateRoleData,
  Permission,
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
  CategoryFilters,
  Brand,
  CreateBrandData,
  UpdateBrandData,
  Size,
  Order,
  Shipment,
  PaginatedResponse,
} from "../types";

// USERS
export const usersService = {
  async getAll(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.rol) params.append("rol", filters.rol);
      if (filters?.activo !== undefined)
        params.append("activo", String(filters.activo));
      if (filters?.page) params.append("page", String(filters.page));

      const response = await api.get(`${ENDPOINTS.USERS.BASE}?${params}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching users:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<User> {
    try {
      const response = await api.get(ENDPOINTS.USERS.BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching user:", error.response?.data);
      throw error;
    }
  },

  async create(data: CreateUserData): Promise<User> {
    try {
      const response = await api.post(ENDPOINTS.USERS.BASE, data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating user:", error.response?.data);
      throw error;
    }
  },

  async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      const response = await api.patch(ENDPOINTS.USERS.BY_ID(id), data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating user:", error.response?.data);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(ENDPOINTS.USERS.BY_ID(id));
    } catch (error: any) {
      console.error("Error deleting user:", error.response?.data);
      throw error;
    }
  },

  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> {
    try {
      // Endpoint genérico para cambiar la contraseña del usuario actual
      await api.post(`${ENDPOINTS.USERS.BASE}change_password/`, data);
    } catch (error: any) {
      console.error("Error changing password:", error.response?.data);
      throw error;
    }
  },
};

// ROLES
export const rolesService = {
  async getAll(): Promise<Role[]> {
    try {
      const response = await api.get(ENDPOINTS.ROLES.BASE);
      return response.data.results || response.data;
    } catch (error: any) {
      console.error("Error fetching roles:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<Role> {
    try {
      const response = await api.get(ENDPOINTS.ROLES.BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching role:", error.response?.data);
      throw error;
    }
  },

  async create(data: CreateRoleData): Promise<Role> {
    try {
      const response = await api.post(ENDPOINTS.ROLES.BASE, data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating role:", error.response?.data);
      throw error;
    }
  },

  async update(id: string, data: UpdateRoleData): Promise<Role> {
    try {
      const response = await api.patch(ENDPOINTS.ROLES.BY_ID(id), data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating role:", error.response?.data);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(ENDPOINTS.ROLES.BY_ID(id));
    } catch (error: any) {
      console.error("Error deleting role:", error.response?.data);
      throw error;
    }
  },

  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await api.get("auth/permissions/");
      return response.data.results || response.data;
    } catch (error: any) {
      console.error("Error fetching permissions:", error.response?.data);
      throw error;
    }
  },
};

// PRODUCTS
// Helper function to sort products: 1) Con imagen primero, 2) Blusas primero
const sortProductsByImage = (products: Product[]): Product[] => {
  return [...products].sort((a, b) => {
    const aHasImage =
      a.imagen_principal &&
      a.imagen_principal !== null &&
      a.imagen_principal.trim() !== "";
    const bHasImage =
      b.imagen_principal &&
      b.imagen_principal !== null &&
      b.imagen_principal.trim() !== "";

    // Verificar si es categoría Blusas
    const aIsBlusas =
      a.categorias_detalle?.some(
        (cat) => cat.nombre?.toLowerCase() === "blusas"
      ) ?? false;
    const bIsBlusas =
      b.categorias_detalle?.some(
        (cat) => cat.nombre?.toLowerCase() === "blusas"
      ) ?? false;

    // PRIORIDAD 1: Productos con imagen van primero
    if (aHasImage && !bHasImage) return -1;
    if (!aHasImage && bHasImage) return 1;

    // PRIORIDAD 2: Entre los que tienen imagen, Blusas primero
    if (aHasImage && bHasImage) {
      if (aIsBlusas && !bIsBlusas) return -1;
      if (!aIsBlusas && bIsBlusas) return 1;
    }

    return 0;
  });
};

export const productsService = {
  async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.categorias) params.append("categorias", filters.categorias);
      if (filters?.marca) params.append("marca", filters.marca);
      if (filters?.precio_min)
        params.append("precio_min", String(filters.precio_min));
      if (filters?.precio_max)
        params.append("precio_max", String(filters.precio_max));
      if (filters?.activa !== undefined)
        params.append("activa", String(filters.activa));
      if (filters?.destacada !== undefined)
        params.append("destacada", String(filters.destacada));
      if (filters?.es_novedad !== undefined)
        params.append("es_novedad", String(filters.es_novedad));
      if (filters?.page) params.append("page", String(filters.page));

      const response = await api.get(`${ENDPOINTS.PRODUCTS.BASE}?${params}`);

      // Sort products to show those with images first (mejor UX en admin)
      if (response.data.results) {
        response.data.results = sortProductsByImage(response.data.results);
      }

      return response.data;
    } catch (error: any) {
      console.error("Error fetching products:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<Product> {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS.BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching product:", error.response?.data);
      throw error;
    }
  },

  async getBySlug(slug: string): Promise<Product> {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS.BY_SLUG(slug));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching product:", error.response?.data);
      throw error;
    }
  },

  async create(data: CreateProductData | FormData): Promise<Product> {
    try {
      const isFormData = data instanceof FormData;
      const response = await api.post(ENDPOINTS.PRODUCTS.BASE, data, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating product:", error.response?.data);
      throw error;
    }
  },

  async update(id: string, data: UpdateProductData | FormData): Promise<Product> {
    try {
      const isFormData = data instanceof FormData;
      const response = await api.patch(ENDPOINTS.PRODUCTS.BY_ID(id), data, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
      });
      return response.data;
    } catch (error: any) {
      console.error("Error updating product:", error.response?.data);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(ENDPOINTS.PRODUCTS.BY_ID(id));
    } catch (error: any) {
      console.error("Error deleting product:", error.response?.data);
      throw error;
    }
  },
};

// CATEGORIES
export const categoriesService = {
  async getAll(
    filters?: CategoryFilters
  ): Promise<PaginatedResponse<Category>> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.activa !== undefined)
        params.append("activa", String(filters.activa));
      if (filters?.page) params.append("page", String(filters.page));

      const response = await api.get(
        `${ENDPOINTS.PRODUCTS.CATEGORIES}?${params}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching categories:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<Category> {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS.CATEGORY_BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching category:", error.response?.data);
      throw error;
    }
  },

  async create(data: CreateCategoryData): Promise<Category> {
    try {
      const formData = new FormData();
      formData.append("nombre", data.nombre);
      formData.append("descripcion", data.descripcion);
      if (data.activa !== undefined)
        formData.append("activa", String(data.activa));
      if (data.imagen) formData.append("imagen", data.imagen);

      const response = await api.post(ENDPOINTS.PRODUCTS.CATEGORIES, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating category:", error.response?.data);
      throw error;
    }
  },

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const formData = new FormData();
      if (data.nombre) formData.append("nombre", data.nombre);
      if (data.descripcion) formData.append("descripcion", data.descripcion);
      if (data.activa !== undefined)
        formData.append("activa", String(data.activa));
      if (data.imagen) formData.append("imagen", data.imagen);

      const response = await api.patch(
        ENDPOINTS.PRODUCTS.CATEGORY_BY_ID(id),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating category:", error.response?.data);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(ENDPOINTS.PRODUCTS.CATEGORY_BY_ID(id));
    } catch (error: any) {
      console.error("Error deleting category:", error.response?.data);
      throw error;
    }
  },
};

// BRANDS
export const brandsService = {
  async getAll(): Promise<Brand[]> {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS.BRANDS);
      return response.data.results || response.data;
    } catch (error: any) {
      console.error("Error fetching brands:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<Brand> {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS.BRAND_BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching brand:", error.response?.data);
      throw error;
    }
  },

  async create(data: CreateBrandData): Promise<Brand> {
    try {
      const formData = new FormData();
      formData.append("nombre", data.nombre);
      if (data.descripcion) formData.append("descripcion", data.descripcion);
      if (data.activa !== undefined)
        formData.append("activa", String(data.activa));
      if (data.logo) formData.append("logo", data.logo);

      const response = await api.post(ENDPOINTS.PRODUCTS.BRANDS, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating brand:", error.response?.data);
      throw error;
    }
  },

  async update(id: string, data: UpdateBrandData): Promise<Brand> {
    try {
      const formData = new FormData();
      if (data.nombre) formData.append("nombre", data.nombre);
      if (data.descripcion) formData.append("descripcion", data.descripcion);
      if (data.activa !== undefined)
        formData.append("activa", String(data.activa));
      if (data.logo) formData.append("logo", data.logo);

      const response = await api.patch(
        ENDPOINTS.PRODUCTS.BRAND_BY_ID(id),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating brand:", error.response?.data);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(ENDPOINTS.PRODUCTS.BRAND_BY_ID(id));
    } catch (error: any) {
      console.error("Error deleting brand:", error.response?.data);
      throw error;
    }
  },
};

// SIZES
export const sizesService = {
  async getAll(): Promise<Size[]> {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS.SIZES);
      return response.data.results || response.data;
    } catch (error: any) {
      console.error("Error fetching sizes:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<Size> {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS.SIZE_BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching size:", error.response?.data);
      throw error;
    }
  },
};

// ORDERS
export const ordersService = {
  async getAll(filters?: any): Promise<PaginatedResponse<Order>> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.estado) params.append("estado", filters.estado);
      if (filters?.fecha_inicio) params.append("fecha_inicio", filters.fecha_inicio);
      if (filters?.fecha_fin) params.append("fecha_fin", filters.fecha_fin);
      if (filters?.limit) params.append("limit", String(filters.limit));
      if (filters?.page) params.append("page", String(filters.page));

      const response = await api.get(`${ENDPOINTS.ORDERS.BASE}?${params}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching orders:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<Order> {
    try {
      const response = await api.get(ENDPOINTS.ORDERS.BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error("Error fetching order:", error.response?.data);
      throw error;
    }
  },

  async updateStatus(
    id: string,
    estado: string,
    notas?: string
  ): Promise<Order> {
    try {
      const response = await api.post(ENDPOINTS.ORDERS.UPDATE_STATUS(id), {
        nuevo_estado: estado,
        notas: notas || "",
      });
      return response.data.pedido || response.data;
    } catch (error: any) {
      console.error("Error updating order status:", error.response?.data);
      throw error;
    }
  },

  async cancel(id: string): Promise<Order> {
    try {
      const response = await api.post(ENDPOINTS.ORDERS.CANCEL(id), {});
      return response.data.pedido || response.data;
    } catch (error: any) {
      console.error("Error canceling order:", error.response?.data);
      throw error;
    }
  },
};

// SHIPMENTS
export const shipmentsService = {
  async getAll(filters?: any): Promise<PaginatedResponse<Shipment>> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.estado) params.append("estado", filters.estado);
      if (filters?.page) params.append("page", String(filters.page));

      const response = await api.get(
        `${ENDPOINTS.ORDERS.BASE}envios/?${params}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching shipments:", error.response?.data);
      throw error;
    }
  },

  async getById(id: string): Promise<Shipment> {
    try {
      const response = await api.get(`${ENDPOINTS.ORDERS.BASE}envios/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching shipment:", error.response?.data);
      throw error;
    }
  },

  async create(data: {
    pedido_id: string;
    empresa_transportista?: string;
    costo_envio?: number;
  }): Promise<Shipment> {
    try {
      const response = await api.post(`${ENDPOINTS.ORDERS.BASE}envios/`, data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating shipment:", error.response?.data);
      throw error;
    }
  },

  async updateStatus(id: string, estado: string): Promise<Shipment> {
    try {
      const response = await api.post(
        `${ENDPOINTS.ORDERS.BASE}envios/${id}/cambiar_estado/`,
        {
          nuevo_estado: estado,
        }
      );
      return response.data.envio || response.data;
    } catch (error: any) {
      console.error("Error updating shipment status:", error.response?.data);
      throw error;
    }
  },

  async assignDelivery(id: string, delivery_id: string): Promise<Shipment> {
    try {
      const response = await api.post(
        `${ENDPOINTS.ORDERS.BASE}envios/${id}/asignar_delivery/`,
        {
          delivery_id,
        }
      );
      return response.data.envio || response.data;
    } catch (error: any) {
      console.error("Error assigning delivery:", error.response?.data);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`${ENDPOINTS.ORDERS.BASE}envios/${id}/`);
    } catch (error: any) {
      console.error("Error deleting shipment:", error.response?.data);
      throw error;
    }
  },
};

export const adminService = {
  users: usersService,
  roles: rolesService,
  products: productsService,
  categories: categoriesService,
  brands: brandsService,
  sizes: sizesService,
  orders: ordersService,
  shipments: shipmentsService,
};

export default adminService;
