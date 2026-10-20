import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";
import Redis from "ioredis";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";

test(
  "Redis counters are atomic, shared across instances, refundable, and expire",
  { timeout: 15000 },
  async (t) => {
    const redis = new Redis(
      process.env.RATE_LIMIT_TEST_REDIS_URL || "redis://127.0.0.1:6379",
      {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        commandTimeout: 2000,
        connectTimeout: 2000,
        retryStrategy: () => null,
      },
    );
    redis.on("error", () => {});
    let cleanupLimiter: RateLimiterRedis | undefined;
    t.after(async () => {
      try {
        if (redis.status === "ready") await cleanupLimiter?.delete("client");
      } finally {
        redis.disconnect();
      }
    });
    await redis.connect();
    const keyPrefix = `auth:test:rate-limit:${randomUUID()}`;
    const first = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix,
      points: 3,
      duration: 1,
    });
    const second = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix,
      points: 3,
      duration: 1,
    });
    cleanupLimiter = first;
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) =>
        (i % 2 ? first : second).consume("client"),
      ),
    );
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      3,
    );
    for (const result of results) {
      if (result.status === "rejected")
        assert.ok(result.reason instanceof RateLimiterRes);
    }
    await first.delete("client");
    await first.consume("client");
    await second.consume("client");
    await first.reward("client", 1);
    assert.equal((await second.get("client"))?.consumedPoints, 1);
    await setTimeout(1100);
    assert.equal(await first.get("client"), null);
    assert.equal((await second.consume("client")).consumedPoints, 1);
    await first.delete("client");
  },
);
