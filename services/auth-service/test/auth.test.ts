import assert from "node:assert/strict";
import { once } from "node:events";
import { test, mock } from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { RateLimiterMemory } from "rate-limiter-flexible";

process.env.JWT_SECRET = "auth-test-secret-not-for-production";
process.env.NODE_ENV = "test";

test("auth HTTP contracts", async (t) => {
  const { authRoutes } = await import("../src/routes/auth.routes");
  const { authErrorHandler } = await import("../src/middlewares/authErrorHandler");
  const { prisma, Prisma } = await import("@ecommerce/shared");
  const { getRedis } = await import("../src/lib/redis");
  const { hashPassword } = await import("../src/lib/password");
  const { rateLimiters, clientIpKey } = await import("../src/middlewares/rateLimit");
  const { authService } = await import("../src/services/auth.service");
  const { AuthError } = await import("../src/lib/error");
  t.beforeEach(() => {
    for (const limiter of Object.values(rateLimiters)) {
      const memory = new RateLimiterMemory({ points: limiter.points, duration: limiter.duration });
      mock.method(limiter, "consume", (key: string) => memory.consume(key));
      mock.method(limiter, "reward", (key: string, points: number) => memory.reward(key, points));
    }
  });
  const originalFindUnique = prisma.user.findUnique;
  const originalCreate = prisma.user.create;
  const mockUser = (method: "findUnique" | "create", implementation: (...args: any[]) => any = async () => null) => {
    const fn = mock.fn(implementation);
    (prisma.user as any)[method] = fn;
    return fn;
  };
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/auth", authRoutes);
  app.use(authErrorHandler);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  t.afterEach(() => {
    mock.restoreAll();
    prisma.user.findUnique = originalFindUnique;
    prisma.user.create = originalCreate;
  });
  const address = server.address() as { port: number };
  const request = (path: string, body?: unknown, headers = {}) => fetch(
    `http://127.0.0.1:${address.port}/auth${path}`,
    { method: "POST", headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body) },
  );
  const publicUser = {
    id: "test-user", username: "Alice", firstName: "Alice", lastName: "Smith",
    email: "alice@example.com", role: "user", createdAt: new Date(), updatedAt: new Date(),
  };
  const passwordHash = await hashPassword("Correct!Password1");
  const record = { ...publicUser, passwordHash, futureSecret: "must not escape" };
  const selectRecord = (select: Record<string, boolean>) => Object.fromEntries(
    Object.keys(select).filter((key) => select[key]).map((key) => [key, record[key as keyof typeof record]]),
  );

  await t.test("missing accounts and wrong passwords return identical 401 responses", async () => {
    const lookup = mockUser("findUnique", async () => null);
    const missing = await request("/login", { username: "Alice", password: "Wrong!Password1" });
    lookup.mock.mockImplementation(async () => record as any);
    const wrong = await request("/login", { username: "Alice", password: "Wrong!Password1" });
    assert.equal(missing.status, 401);
    assert.equal(wrong.status, 401);
    assert.deepEqual(await missing.json(), await wrong.json());
  });

  await t.test("login rejects ambiguous or absent identities before querying", async () => {
    const lookup = mockUser("findUnique", async () => null);
    for (const identity of [{}, { username: "Alice", email: "alice@example.com" }]) {
      assert.equal((await request("/login", { ...identity, password: "Correct!Password1" })).status, 400);
    }
    assert.equal(lookup.mock.callCount(), 0);
  });

  await t.test("login normalizes email, supports username, and returns only public fields", async () => {
    const lookup = mockUser("findUnique", async (args: any) => selectRecord(args.select));
    mock.method(getRedis(), "set", async () => "OK" as const);
    for (const identity of [{ email: " ALICE@EXAMPLE.COM " }, { username: " Alice " }]) {
      const response = await request("/login", { ...identity, password: "Correct!Password1" });
      assert.equal(response.status, 200);
      const data = await response.json() as any;
      assert.deepEqual(Object.keys(data.user).sort(), Object.keys(publicUser).sort());
      assert.ok(data.accessToken);
      assert.match(response.headers.get("set-cookie")!, /Path=\/api\/auth/);
    }
    assert.deepEqual(lookup.mock.calls[0].arguments[0].where, { email: "alice@example.com" });
    assert.deepEqual(lookup.mock.calls[1].arguments[0].where, { username: "Alice" });
  });

  await t.test("malformed refresh/logout tokens are rejected without Redis access", async () => {
    const get = mock.method(getRedis(), "get", async () => null);
    const del = mock.method(getRedis(), "del", async () => 0);
    for (const path of ["/refresh", "/logout"]) {
      for (const refreshToken of [null, 42, {}, [], "", "a".repeat(63), "g".repeat(64)]) {
        assert.equal((await request(path, { refreshToken })).status, 400);
      }
      assert.equal((await request(path, {}, { Cookie: "refreshToken=bad" })).status, 400);
    }
    assert.equal(get.mock.callCount(), 0);
    assert.equal(del.mock.callCount(), 0);
    assert.equal((await request("/refresh")).status, 401);
    assert.equal((await request("/logout")).status, 200);
  });

  await t.test("valid-format invalid sessions return 401; cookie and body logout revoke sessions", async () => {
    mock.method(getRedis(), "get", async () => null);
    const del = mock.method(getRedis(), "del", async () => 1);
    const token = "a".repeat(64);
    assert.equal((await request("/refresh", { refreshToken: token })).status, 401);
    assert.equal((await request("/logout", { refreshToken: token })).status, 200);
    const response = await request("/logout", {}, { Cookie: `refreshToken=${token}` });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie")!, /Expires=Thu, 01 Jan 1970/);
    assert.equal(del.mock.callCount(), 2);
  });

  const registration = { username: "Alice", email: "alice@example.com", firstName: "Alice", lastName: "Smith", password: "Correct!Password1" };
  await t.test("registration and refresh have independent limits with Retry-After", async () => {
    mockUser("create", async () => publicUser);
    mock.method(getRedis(), "get", async () => null);
    for (let i = 0; i < rateLimiters.register.points; i++) {
      assert.equal((await request("/register", registration)).status, 201);
    }
    const blocked = await request("/register", registration);
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    for (let i = 0; i < rateLimiters.refresh.points; i++) {
      assert.equal((await request("/refresh", { refreshToken: "a".repeat(64) })).status, 401);
    }
    assert.equal((await request("/refresh", { refreshToken: "a".repeat(64) })).status, 429);
    assert.equal((await request("/logout")).status, 200);
  });

  await t.test("parallel failed logins are bounded and normalized email shares a counter", async () => {
    const login = mock.method(authService, "login", async () => { throw new AuthError("Invalid credentials."); });
    const responses = await Promise.all(Array.from({ length: 15 }, (_, i) => request("/login", {
      email: i % 2 ? " ALICE@EXAMPLE.COM " : "alice@example.com", password: "Wrong!Password1",
    })));
    assert.equal(responses.filter((res) => res.status === 401).length, rateLimiters.loginFailures.points);
    assert.equal(responses.filter((res) => res.status === 429).length, 15 - rateLimiters.loginFailures.points);
    assert.equal(login.mock.callCount(), rateLimiters.loginFailures.points);
    assert.equal((await request("/login", { username: "another", password: "Wrong!Password1" })).status, 401);
  });

  await t.test("successful logins refund their attempt without removing previous failures", async () => {
    mockUser("findUnique", async () => record);
    mock.method(getRedis(), "set", async () => "OK" as const);
    for (let i = 0; i < rateLimiters.loginFailures.points + 1; i++) {
      assert.equal((await request("/login", { username: "Alice", password: "Correct!Password1" })).status, 200);
    }
    for (let i = 0; i < rateLimiters.loginFailures.points; i++) {
      assert.equal((await request("/login", { username: "Alice", password: "Wrong!Password1" })).status, 401);
    }
    assert.equal((await request("/login", { username: "Alice", password: "Correct!Password1" })).status, 429);
  });

  await t.test("login IP limit blocks identifier spraying; untrusted forwarded headers cannot bypass it", async () => {
    mock.method(authService, "login", async () => { throw new AuthError("Invalid credentials."); });
    for (let i = 0; i < rateLimiters.login.points; i++) {
      assert.equal((await request("/login", { username: `user${i}`, password: "Wrong!Password1" }, { "X-Forwarded-For": `203.0.113.${i}` })).status, 401);
    }
    assert.equal((await request("/login", { username: "newuser", password: "Wrong!Password1" }, { "X-Forwarded-For": "198.51.100.1" })).status, 429);
  });

  await t.test("Redis failures fail closed with 503, not 429", async () => {
    mock.method(rateLimiters.all, "consume", async () => { throw new Error("Redis unavailable"); });
    const response = await request("/login", { username: "Alice", password: "Correct!Password1" });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), null);
  });

  await t.test("IPv4-mapped addresses and IPv6 subnet variants share keys", () => {
    const key = (ip: string) => clientIpKey({ ip } as any);
    assert.equal(key("::ffff:192.0.2.1"), key("192.0.2.1"));
    assert.equal(key("2001:db8:abcd:12::1"), key("2001:db8:abcd:12::ffff"));
    assert.notEqual(key("2001:db8:abcd:12::1"), key("2001:db8:abcd:13::1"));
  });

  await t.test("gateway overwrites forged forwarding headers before proxying", async (t) => {
    const { createGatewayProxy } = await import("../../api-gateway/src/middlewares/proxy.middleware");
    const downstream = express();
    downstream.get("/auth/ip", (req, res) => res.json({ forwarded: req.headers["x-forwarded-for"] }));
    const target = downstream.listen(0, "127.0.0.1");
    await once(target, "listening");
    t.after(() => new Promise<void>((resolve) => target.close(() => resolve())));
    const targetPort = (target.address() as { port: number }).port;
    const gateway = express();
    gateway.use("/api/auth", createGatewayProxy(`http://127.0.0.1:${targetPort}`));
    const proxy = gateway.listen(0, "127.0.0.1");
    await once(proxy, "listening");
    t.after(() => new Promise<void>((resolve) => proxy.close(() => resolve())));
    const proxyPort = (proxy.address() as { port: number }).port;
    const response = await fetch(`http://127.0.0.1:${proxyPort}/api/auth/ip`, {
      headers: { "X-Forwarded-For": "198.51.100.1, 203.0.113.1" },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { forwarded: "127.0.0.1" });
  });
  await t.test("register and login reject passwords over 72 UTF-8 bytes before database access", async () => {
    const lookup = mockUser("findUnique");
    const create = mockUser("create");
    const passwords = ["Aa1!" + "x".repeat(69), "Aa1!" + "\u00e9".repeat(35), "Aa1!" + "\u{1f600}".repeat(18)];
    for (const password of passwords) {
      for (const path of ["/register", "/login"]) {
        const body = path === "/register" ? { ...registration, password } : { username: "Alice", password };
        const response = await request(path, body);
        assert.equal(response.status, 400);
        assert.match(JSON.stringify(await response.json()), /72 UTF-8 bytes/);
      }
    }
    assert.equal(lookup.mock.callCount(), 0);
    assert.equal(create.mock.callCount(), 0);
  });

  await t.test("72-byte ASCII and multibyte passwords register and authenticate without modification", async () => {
    let savedHash = "";
    mockUser("create", async (args: any) => {
      savedHash = args.data.passwordHash;
      return publicUser;
    });
    mockUser("findUnique", async () => ({ ...publicUser, passwordHash: savedHash }));
    mock.method(getRedis(), "set", async () => "OK" as const);
    for (const password of ["Aa1!" + "x".repeat(68), "Aa1!" + "\u00e9".repeat(34), "Aa1!" + "\u{1f600}".repeat(17)]) {
      assert.equal(Buffer.byteLength(password, "utf8"), 72);
      assert.equal((await request("/register", { ...registration, password })).status, 201);
      assert.equal((await request("/login", { username: "Alice", password })).status, 200);
    }
  });

  await t.test("email and username uniqueness conflicts return 409", async () => {
    const create = mockUser("create");
    for (const field of ["email", "username"]) {
      create.mock.mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "5.22.0", meta: { target: [field] } });
      });
      const response = await request("/register", registration);
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), { error: "Email or username is already in use." });
    }
  });

  await t.test("register and me expose only public fields", async () => {
    mockUser("create", async (args: any) => selectRecord(args.select));
    mockUser("findUnique", async (args: any) => selectRecord(args.select));
    const registered = await request("/register", registration);
    assert.equal(registered.status, 201);
    const me = await fetch(`http://127.0.0.1:${address.port}/auth/me`, { headers: { "x-user-id": "test-user", "x-user-role": "user" } });
    assert.equal(me.status, 200);
    for (const response of [registered, me]) {
      assert.deepEqual(Object.keys(await response.json() as object).sort(), Object.keys(publicUser).sort());
    }
  });
});
