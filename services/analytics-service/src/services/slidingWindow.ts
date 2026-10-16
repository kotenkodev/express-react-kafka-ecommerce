import { OrderCreated, OrderStats, PaymentProcessed } from "@ecommerce/shared";

interface WindowOrder {
  orderId: string;
  totalAmount: number;
  createdAt: number;
}
interface WindowPayment {
  orderId: string;
  status: "SUCCESS" | "FAILED";
  processedAt: number;
  processingMs?: number;
}

export class SlidingWindowService {
  private readonly windowMs: number;
  private orders: WindowOrder[] = [];
  private payments: WindowPayment[] = [];
  private orderCreatedTimes = new Map<string, number>();
  constructor(windowMs: number = 60_000) {
    this.windowMs = windowMs;
  }

  recordOrder(event: OrderCreated) {
    const createdAt = new Date(event.createdAt).getTime();

    this.orders.push({
      orderId: event.orderId,
      totalAmount: event.totalAmount,
      createdAt,
    });

    this.orderCreatedTimes.set(event.orderId, createdAt);
  }

  recordPayment(event: PaymentProcessed): { processingMs?: number } {
    const processedAt = new Date(event.processedAt).getTime();
    const createdAt = this.orderCreatedTimes.get(event.orderId);

    let processingMs: number | undefined;

    if (createdAt) {
      processingMs = Math.max(0, processedAt - createdAt);
    }

    this.payments.push({
      orderId: event.orderId,
      status: event.status,
      processedAt,
      processingMs,
    });
    return { processingMs };
  }

  cleanup(now: number): void {
    const cutoff = now - this.windowMs;

    this.orders = this.orders.filter((order) => order.createdAt >= cutoff);
    this.payments = this.payments.filter(
      (payment) => payment.processedAt >= cutoff,
    );

    this.orderCreatedTimes.forEach((createdAt, orderId) => {
      if (createdAt < cutoff) {
        this.orderCreatedTimes.delete(orderId);
      }
    });
  }

  getStats(): OrderStats {
    const now = Date.now();
    this.cleanup(now);

    const ordersCount = this.orders.length;
    const totalRevenue = this.orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const successCount = this.payments.filter(
      (p) => p.status === "SUCCESS",
    ).length;
    const failedCount = this.payments.filter(
      (p) => p.status === "FAILED",
    ).length;

    const totalPayments = successCount + failedCount;
    const successRate =
      totalPayments > 0 ? Number((successCount / totalPayments).toFixed(2)) : 0;

    const latencies = this.payments
      .map((p) => p.processingMs)
      .filter((ms): ms is number => typeof ms === "number");
    const avgProcessingMs =
      latencies.length > 0
        ? Math.round(
            latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length,
          )
        : 0;

    return {
      windowStart: new Date(now - this.windowMs).toISOString(),
      ordersCount,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      successRate,
      avgProcessingMs,
    };
  }
}

export const slidingWindowService = new SlidingWindowService();
