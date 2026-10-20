import { useEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOrdersStore, OrderStatusUpdatePayload } from "../store/ordersStore";
import { toast } from "sonner";

export function useOrderSSE() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);
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

        updateOrderStatus(data);

        const shortId = (data.orderId || data.id || "").slice(0, 8);
        if (data.status) {
          toast.info(`Order #${shortId || "update"}: status is now ${data.status}`, {
            id: `order-status-${data.orderId || data.id}-${data.status}`,
          });
        }
      } catch (err) {
        console.error("[useOrderSSE] Failed to parse SSE message:", err);
      }
    };

    eventSource.addEventListener("order_update", handleOrderEvent);
    eventSource.addEventListener("order.status.updated", handleOrderEvent);
    eventSource.onmessage = handleOrderEvent;

    eventSource.onerror = (err) => {
      // EventSource reconnects automatically on network blips.
      console.warn("[useOrderSSE] EventSource connection issue:", err);
    };

    return () => {
      eventSource.removeEventListener("order_update", handleOrderEvent);
      eventSource.removeEventListener("order.status.updated", handleOrderEvent);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [accessToken, updateOrderStatus]);
}

