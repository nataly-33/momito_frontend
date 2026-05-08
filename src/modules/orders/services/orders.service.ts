import api from "@core/config/api.config";
import { ENDPOINTS } from "@/core/config/endpoints";
import type {
  Order,
  PaymentMethod,
  CheckoutData,
  CheckoutResponse,
  OrdersParams,
} from "../types";

export const ordersService = {
  async getOrders(params?: OrdersParams): Promise<Order[]> {
    const response = await api.get<{ results: Order[] }>(
      ENDPOINTS.ORDERS.BASE,
      { params }
    );
    return (
      response.data.results ||
      (Array.isArray(response.data) ? response.data : [])
    );
  },

  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<{ results: Order[] }>(
      ENDPOINTS.ORDERS.MY_ORDERS
    );
    return (
      response.data.results ||
      (Array.isArray(response.data) ? response.data : [])
    );
  },

  async getOrder(orderId: string): Promise<Order> {
    const response = await api.get<Order>(ENDPOINTS.ORDERS.BY_ID(orderId));
    return response.data;
  },

  async checkout(data: CheckoutData): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutResponse>(ENDPOINTS.ORDERS.CHECKOUT, data);
    return response.data;
  },

  async updateOrderStatus(
    orderId: string,
    nuevo_estado: string,
    notas?: string
  ): Promise<Order> {
    const response = await api.post<Order>(
      ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
      { nuevo_estado, notas }
    );
    return response.data;
  },

  async cancelOrder(orderId: string, notas?: string): Promise<Order> {
    const response = await api.post<Order>(ENDPOINTS.ORDERS.CANCEL(orderId), {
      notas,
    });
    return response.data;
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get<{ results: PaymentMethod[] }>(
      ENDPOINTS.ORDERS.PAYMENT_METHODS
    );
    return (
      response.data.results ||
      (Array.isArray(response.data) ? response.data : [])
    );
  },
};
