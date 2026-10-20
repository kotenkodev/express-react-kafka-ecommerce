import { create } from "zustand";
import { Order, OrderStatus, PaymentStatus } from "../types";
import { getOrders } from "../api/orders.api";

export interface OrderStatusUpdatePayload {
  id?: string;
  orderId?: string;
  status: OrderStatus;
  courier?: string | null;
  updatedAt?: string;
  paymentStatus?: PaymentStatus;
}

interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  setOrders: (orders: Order[]) => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (payload: OrderStatusUpdatePayload) => void;
  addOrder: (order: Order) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  setOrders: (orders) => set({ orders }),

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await getOrders();
      set({ orders, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load orders";
      set({ error: message, isLoading: false });
    }
  },

  updateOrderStatus: (payload) => {
    const targetId = payload.orderId || payload.id;
    if (!targetId) return;

    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== targetId) return order;

        return {
          ...order,
          status: payload.status ?? order.status,
          courier:
            payload.courier !== undefined ? payload.courier : order.courier,
          paymentStatus: payload.paymentStatus ?? order.paymentStatus,
          updatedAt: payload.updatedAt ?? new Date().toISOString(),
        };
      }),
    }));
  },

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders.filter((o) => o.id !== order.id)],
    })),
}));

