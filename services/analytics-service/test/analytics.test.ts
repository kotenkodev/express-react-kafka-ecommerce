import { test } from "node:test";
import assert from "node:assert/strict";
import { SlidingWindowService } from "../src/services/slidingWindow";
import { orderSchema, paymentSchema } from "../src/consumers/eventValidation";
import { startStatsPublisher } from "../src/services/statsPublisher";
import { analyticsConsumer, startAnalyticsConsumer } from "../src/consumers/analytics.consumer";
import { slidingWindowService } from "../src/services/analyticsWindow";
import { TOPICS } from "@ecommerce/shared";

const now = Date.now();
const order = { orderId: "o1", userId: "u1", items: [], totalAmount: 100, createdAt: new Date(now - 1000).toISOString() };
const payment = { paymentId: "p1", orderId: "o1", status: "SUCCESS" as const, failureReason: null, processedAt: new Date(now).toISOString() };

test("both arrival orders correlate revenue and latency exactly once", () => {
  for (const paymentFirst of [false, true]) {
    const observed: number[] = [];
    const window = new SlidingWindowService(60_000, 120_000, ms => observed.push(ms), () => now);
    if (paymentFirst) window.recordPayment(payment);
    window.recordOrder(order);
    if (!paymentFirst) window.recordPayment(payment);
    window.recordOrder(order);
    assert.equal(window.recordPayment(payment).accepted, false);
    assert.equal(window.getStats().ordersCount, 1);
    assert.equal(window.getStats().totalRevenue, 100);
    assert.equal(window.getStats().avgProcessingMs, 1000);
    assert.deepEqual(observed, [1000]);
  }
});

test("failed and unpaid orders do not count as revenue; successful attempts count an order once", () => {
  const window = new SlidingWindowService(60_000, 120_000, undefined, () => now);
  window.recordOrder(order);
  assert.equal(window.getStats().totalRevenue, 0);
  window.recordPayment({ ...payment, status: "FAILED" });
  assert.equal(window.getStats().totalRevenue, 0);
  window.recordPayment({ ...payment, paymentId: "p2" });
  window.recordPayment({ ...payment, paymentId: "p3" });
  assert.equal(window.getStats().totalRevenue, 100);
});

test("orders survive the stats window for delayed payment correlation", () => {
  const window = new SlidingWindowService(60_000, 120_000, undefined, () => now);
  window.recordOrder({ ...order, createdAt: new Date(now - 90_000).toISOString() });
  assert.equal(window.getStats().ordersCount, 0);
  window.recordPayment(payment);
  assert.equal(window.getStats().avgProcessingMs, 90_000);
  assert.equal(window.getStats().totalRevenue, 100);
});

test("offset-reset history cannot inflate recent payment statistics", () => {
  const window = new SlidingWindowService(60_000, 120_000, undefined, () => now);
  window.recordOrder({ ...order, createdAt: new Date(now - 90_000).toISOString() });
  assert.equal(window.recordPayment({ ...payment, processedAt: new Date(now - 80_000).toISOString() }).accepted, false);
  assert.equal(window.getStats().ordersCount, 0);
  assert.equal(window.getStats().totalRevenue, 0);
  assert.equal(window.getStats().successRate, 0);
});

test("cleanup runs independently and ingestion expires retained correlations", async () => {
  let clock = now;
  const window = new SlidingWindowService(60_000, 120_000, undefined, () => clock);
  window.recordOrder(order);
  window.startCleanup(5);
  clock += 130_000;
  try {
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal((window as any).orders.size, 0);
    window.recordPayment({ ...payment, processedAt: new Date(clock).toISOString() });
    assert.equal(window.getStats().avgProcessingMs, 0);
  } finally {
    window.stopCleanup();
  }
});

test("runtime schemas reject invalid timestamps, amounts, status and identifiers", () => {
  assert.equal(orderSchema.safeParse(order).success, true);
  for (const changes of [{ createdAt: "invalid" }, { createdAt: new Date(now + 1e9).toISOString() }, { totalAmount: "100" }, { totalAmount: -1 }, { orderId: "" }]) {
    assert.equal(orderSchema.safeParse({ ...order, ...changes }).success, false);
  }
  assert.equal(paymentSchema.safeParse({ ...payment, status: "UNKNOWN" }).success, false);
  assert.equal(paymentSchema.safeParse({ ...payment, processedAt: "invalid" }).success, false);
});

test("slow publication never overlaps and stop waits for the active send", async () => {
  let calls = 0;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const stop = startStatsPublisher(async () => { calls++; await pending; }, () => {}, 5);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(calls, 1);
  let stopped = false;
  const stopping = stop().then(() => { stopped = true; });
  await Promise.resolve();
  assert.equal(stopped, false);
  release();
  await stopping;
  assert.equal(stopped, true);
});

test("publisher recovers after a rejected send", async () => {
  let calls = 0;
  let errors = 0;
  const stop = startStatsPublisher(async () => { calls++; throw new Error("offline"); }, () => { errors++; }, 5);
  await new Promise(resolve => setTimeout(resolve, 30));
  await stop();
  assert.ok(calls > 1);
  assert.equal(errors, calls);
});

test("consumer rejects poison messages but propagates unexpected processing failures", async () => {
  let eachMessage: any;
  const original = { connect: analyticsConsumer.connect, subscribe: analyticsConsumer.subscribe, run: analyticsConsumer.run, recordOrder: slidingWindowService.recordOrder };
  analyticsConsumer.connect = async () => {};
  analyticsConsumer.subscribe = async () => {};
  analyticsConsumer.run = async options => { eachMessage = options!.eachMessage; };
  const originalError = console.error;
  console.error = () => {};
  try {
    await startAnalyticsConsumer();
    let calls = 0;
    slidingWindowService.recordOrder = () => { calls++; throw new Error("processing failed"); };
    const message = (value: string) => ({ topic: TOPICS.ORDERS, partition: 0, message: { value: Buffer.from(value), offset: "1" } });
    await eachMessage(message("{"));
    await eachMessage(message(JSON.stringify({ ...order, createdAt: "invalid" })));
    assert.equal(calls, 0);
    await assert.rejects(eachMessage(message(JSON.stringify(order))), /processing failed/);
    assert.equal(calls, 1);
  } finally {
    Object.assign(analyticsConsumer, { connect: original.connect, subscribe: original.subscribe, run: original.run });
    slidingWindowService.recordOrder = original.recordOrder;
    console.error = originalError;
  }
});
