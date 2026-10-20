import { useEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOrdersStore, OrderStatusUpdatePayload } from "../store/ordersStore";
import { useQueryClient } from "@tanstack/react-query";
import type { Order } from "../types";
import { toast } from "sonner";

export function useOrderSSE() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!accessToken) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const sseUrl = `${apiUrl}/api/events?token=${encodeURIComponent(accessToken)}`;

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    const handleOrderEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as OrderStatusUpdatePayload;
        if (!data) return;

        const targetId = data.orderId || data.id;

        updateOrderStatus(data);

        queryClient.setQueryData<Order[]>(["orders"], (oldOrders) => {
          if (!oldOrders) return oldOrders;
          return oldOrders.map((o) =>
            o.id === targetId
              ? {
                  ...o,
                  status: data.status ?? o.status,
                  courier:
                    data.courier !== undefined ? data.courier : o.courier,
                  paymentStatus: data.paymentStatus ?? o.paymentStatus,
                  updatedAt: data.updatedAt ?? new Date().toISOString(),
                }
              : o,
          );
        });

        const shortId = (targetId || "").slice(0, 8);
        if (data.status) {
          toast.info(
            `Order #${shortId || "update"}: status is now ${data.status}`,
            {
              id: `order-status-${targetId}-${data.status}`,
            },
          );
        }
      } catch (err) {
        console.error("[useOrderSSE] Failed to parse SSE message:", err);
      }
    };

    eventSource.addEventListener("order_update", handleOrderEvent);
    eventSource.addEventListener("order.status.updated", handleOrderEvent);
    eventSource.onmessage = handleOrderEvent;

    eventSource.onerror = (err) => {
      console.warn("[useOrderSSE] EventSource connection issue:", err);
    };

    return () => {
      eventSource.removeEventListener("order_update", handleOrderEvent);
      eventSource.removeEventListener("order.status.updated", handleOrderEvent);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [accessToken, updateOrderStatus, queryClient]);
}
