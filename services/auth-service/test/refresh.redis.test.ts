import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { randomBytes } from "node:crypto";

process.env.JWT_SECRET = "refresh-rotation-test-secret";
process.env.NODE_ENV = "test";
process.env.REDIS_URL = process.env.RATE_LIMIT_TEST_REDIS_URL || "redis://127.0.0.1:6379";
process.env.DOTENV_CONFIG_PATH = ".env.rotation-test-not-present";
delete process.env.REDIS_PASSWORD;

test("refresh families rotate atomically and detect replay in Redis", { timeout: 15000 }, async (t) => {
  const { getRedis, connectRedis, disconnectRedis } = await import("../src/lib/redis");
  const {
    createRefreshSession, getUserIdFromRefreshToken,
    rotateRefreshSession, deleteRefreshSession,
  } = await import("../src/lib/tokens");
  const { hashRefreshToken } = await import("../src/lib/jwt");
  await connectRedis();
  const redis = getRedis();
  const keys = new Set<string>();
  const key = (token: string) => `refresh:v2:{${token.slice(0, 32)}}`;
  t.after(async () => {
    try {
      if (keys.size) await redis.del(...keys);
    } finally {
      await disconnectRedis();
    }
  });
  const create = async () => {
    const token = await createRefreshSession("test-user");
    keys.add(key(token));
    return token;
  };

  await t.test("rotation preserves absolute expiry, stores only hashes, and revokes descendants on reuse", async () => {
    const first = await create();
    assert.match(first, /^[a-f0-9]{64}$/);
    assert.equal(await getUserIdFromRefreshToken(first), "test-user");
    await redis.pexpire(key(first), 10_000);
    const before = await redis.pttl(key(first));
    const second = await rotateRefreshSession(first, "test-user");
    assert.notEqual(first, second.refreshToken);
    assert.ok(second.refreshTokenExpiresInMs <= before);
    assert.ok(second.refreshTokenExpiresInMs > 0);
    const third = await rotateRefreshSession(second.refreshToken, "test-user");
    const stored = JSON.stringify(await redis.hgetall(key(first)));
    assert.ok(!stored.includes(first));
    assert.ok(!stored.includes(second.refreshToken));
    assert.ok(stored.includes(hashRefreshToken(first)));
    assert.equal(await getUserIdFromRefreshToken(third.refreshToken), "test-user");
    assert.equal(await getUserIdFromRefreshToken(first), null);
    assert.equal(await getUserIdFromRefreshToken(third.refreshToken), null);
  });

  await t.test("concurrent rotations allow one winner and revoke the family on the losing replay", async () => {
    const token = await create();
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => rotateRefreshSession(token, "test-user")),
    );
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    for (const result of results) {
      if (result.status === "rejected") assert.equal(result.reason.statusCode, 401);
      else assert.equal(await getUserIdFromRefreshToken(result.value.refreshToken), null);
    }
  });

  await t.test("unknown secrets cannot revoke a known family; logout with a spent token can", async () => {
    const token = await create();
    const forged = token.slice(0, 32) + randomBytes(16).toString("hex");
    assert.equal(await getUserIdFromRefreshToken(forged), null);
    await deleteRefreshSession(forged);
    assert.equal(await getUserIdFromRefreshToken(token), "test-user");
    const next = await rotateRefreshSession(token, "test-user");
    await deleteRefreshSession(token);
    assert.equal(await getUserIdFromRefreshToken(next.refreshToken), null);
    const active = await create();
    await deleteRefreshSession(active);
    assert.equal(await getUserIdFromRefreshToken(active), null);
  });

  await t.test("expired and legacy sessions cannot refresh", async () => {
    const token = await create();
    await redis.pexpire(key(token), 20);
    await setTimeout(50);
    await assert.rejects(rotateRefreshSession(token, "test-user"), { statusCode: 401 });
    const legacy = randomBytes(32).toString("hex");
    const legacyKey = `refresh:${hashRefreshToken(legacy)}`;
    keys.add(legacyKey);
    await redis.set(legacyKey, "test-user", "EX", 60);
    assert.equal(await getUserIdFromRefreshToken(legacy), null);
  });

  await t.test("mismatched user IDs cannot rotate a session", async () => {
    const token = await create();
    await assert.rejects(rotateRefreshSession(token, "other-user"), { statusCode: 401 });
    assert.equal(await getUserIdFromRefreshToken(token), "test-user");
  });
});
