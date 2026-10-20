import type { OrderCreated, OrderStats, PaymentProcessed } from "@ecommerce/shared";

type OrderEntry = { totalAmount: number; createdAt: number };
type PaymentEntry = { orderId: string; status: "SUCCESS" | "FAILED"; processedAt: number; processingMs?: number };

export class SlidingWindowService {
  private orders = new Map<string, OrderEntry>();
  private payments = new Map<string, PaymentEntry>();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly windowMs = 60_000,
    private readonly retentionMs = 86_400_000,
    private readonly observeLatency: (ms: number) => void = () => {},
    private readonly now: () => number = Date.now,
  ) {
    if (windowMs <= 0 || retentionMs < windowMs) {
      throw new Error("Retention must be at least the positive window duration");
    }
  }

  startCleanup(intervalMs = 5_000) {
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => this.cleanup(), intervalMs);
      this.cleanupTimer.unref();
    }
  }

  stopCleanup() {
    clearInterval(this.cleanupTimer);
    this.cleanupTimer = undefined;
  }

  recordOrder(event: OrderCreated): boolean {
    this.cleanup();
    const createdAt = Date.parse(event.createdAt);
    if (!Number.isFinite(createdAt) || !Number.isFinite(event.totalAmount) || event.totalAmount < 0) {
      throw new Error("Invalid order timestamp or amount");
    }
    if (createdAt > this.now()) throw new Error("Order timestamp is in the future");
    if (createdAt < this.now() - this.retentionMs || this.orders.has(event.orderId)) return false;
    this.orders.set(event.orderId, { createdAt, totalAmount: event.totalAmount });
    for (const payment of this.payments.values()) {
      if (payment.orderId === event.orderId) this.correlate(payment);
    }
    return true;
  }

  recordPayment(event: PaymentProcessed): { accepted: boolean; processingMs?: number } {
    this.cleanup();
    const processedAt = Date.parse(event.processedAt);
    if (!Number.isFinite(processedAt) || processedAt > this.now()) throw new Error("Invalid payment timestamp");
    if (processedAt < this.now() - this.windowMs || this.payments.has(event.paymentId)) return { accepted: false };
    const payment: PaymentEntry = { orderId: event.orderId, status: event.status, processedAt };
    this.payments.set(event.paymentId, payment);
    this.correlate(payment);
    return { accepted: true, processingMs: payment.processingMs };
  }

  private correlate(payment: PaymentEntry) {
    const order = this.orders.get(payment.orderId);
    if (!order || payment.processingMs !== undefined) return;
    payment.processingMs = Math.max(0, payment.processedAt - order.createdAt);
    if (payment.processedAt >= this.now() - this.windowMs) this.observeLatency(payment.processingMs);
  }

  cleanup(now = this.now()): void {
    for (const [id, order] of this.orders) {
      if (order.createdAt < now - this.retentionMs) this.orders.delete(id);
    }
    for (const [id, payment] of this.payments) {
      if (payment.processedAt < now - this.retentionMs) this.payments.delete(id);
    }
  }

  getStats(): OrderStats {
    const now = this.now();
    this.cleanup(now);
    const cutoff = now - this.windowMs;
    const payments = [...this.payments.values()].filter(p => p.processedAt >= cutoff);
    const successes = payments.filter(p => p.status === "SUCCESS");
    const paidOrders = new Set(successes.map(p => p.orderId));
    const totalRevenue = [...paidOrders].reduce((sum, id) => sum + (this.orders.get(id)?.totalAmount ?? 0), 0);
    const latencies = payments.flatMap(p => p.processingMs === undefined ? [] : [p.processingMs]);
    return {
      windowStart: new Date(cutoff).toISOString(),
      ordersCount: [...this.orders.values()].filter(o => o.createdAt >= cutoff).length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      successRate: payments.length ? Number((successes.length / payments.length).toFixed(2)) : 0,
      avgProcessingMs: latencies.length ? Math.round(latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length) : 0,
    };
  }
}
