import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const secret = "gateway-jwt-validation-test-secret";
Object.assign(process.env, {
  NODE_ENV: "test",
  JWT_SECRET: secret,
  AUTH_SERVICE_URL: "http://localhost:3001",
  ORDER_SERVICE_URL: "http://localhost:3002",
  PRODUCT_SERVICE_URL: "http://localhost:3003",
  SEARCH_SERVICE_URL: "http://localhost:3005",
  ANALYTICS_SERVICE_URL: "http://localhost:3004",
  METRICS_SCRAPE_TOKEN: "test-scrape-token",
});

const middleware = import("../src/middlewares/auth.middleware");
const metrics = import("../src/middlewares/metrics.middleware");
const user = {
  id: "f8b57b8d-8ce3-4c63-b4af-02962fdc55be",
  role: "user",
  email: "user@example.com",
};
type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

function invoke(handler: Middleware, token?: string, query = false) {
  return new Promise<{ req: Request; status?: number; next: boolean }>((resolve) => {
    const req = {
      headers: token && !query ? { authorization: "Bearer " + token } : {},
      query: query && token ? { token } : {},
    } as Request;
    let status: number | undefined;
    const res = {
      status(code: number) { status = code; return this; },
      json() { resolve({ req, status, next: false }); },
    } as unknown as Response;
    handler(req, res, () => resolve({ req, status, next: true }));
  });
}

test("valid bearer and query tokens expose only validated identity fields", async () => {
  const { authenticateToken } = await middleware;
  const token = jwt.sign({ ...user, extra: "not identity" }, secret, { expiresIn: "1h" });
  for (const query of [false, true]) {
    const result = await invoke(authenticateToken, token, query);
    assert.equal(result.next, true);
    assert.deepEqual(result.req.user, user);
  }
});

test("email is optional for both required and optional authentication", async () => {
  const { authenticateToken, optionalToken } = await middleware;
  const identity = { id: user.id, role: "admin" };
  for (const handler of [authenticateToken, optionalToken]) {
    const result = await invoke(handler, jwt.sign(identity, secret));
    assert.equal(result.next, true);
    assert.deepEqual(result.req.user, identity);
  }
});

const invalidPayloads = [
  {},
  { role: "admin" },
  { ...user, id: "" },
  { ...user, id: "undefined" },
  { ...user, id: 123 },
  { id: user.id },
  { ...user, role: "superadmin" },
  { ...user, role: ["admin"] },
  { ...user, email: "not-an-email" },
  { ...user, email: 123 },
  { ...user, email: null },
  "string-payload",
];

test("signed malformed payloads are denied and never assigned to req.user", async () => {
  const { authenticateToken, optionalToken } = await middleware;
  for (const payload of invalidPayloads) {
    const token = jwt.sign(payload, secret);
    const required = await invoke(authenticateToken, token);
    assert.equal(required.status, 403, JSON.stringify(payload));
    assert.equal(required.next, false);
    assert.equal(required.req.user, undefined);
    const optional = await invoke(optionalToken, token);
    assert.equal(optional.next, true);
    assert.equal(optional.req.user, undefined);
  }
});

test("missing, expired and incorrectly signed tokens preserve existing rejection behavior", async () => {
  const { authenticateToken, optionalToken } = await middleware;
  assert.equal((await invoke(authenticateToken)).status, 401);
  assert.equal((await invoke(optionalToken)).next, true);
  for (const token of [
    jwt.sign(user, "different-test-secret"),
    jwt.sign(user, secret, { expiresIn: -1 }),
    "not-a-jwt",
  ]) {
    assert.equal((await invoke(authenticateToken, token)).status, 403);
    const optional = await invoke(optionalToken, token);
    assert.equal(optional.next, true);
    assert.equal(optional.req.user, undefined);
  }
});

test("metrics JWT access requires a complete valid admin identity", async () => {
  const { metricsAuth } = await metrics;
  for (const payload of [
    { role: "admin" },
    { ...user, role: "admin", id: 123 },
    { ...user, role: "admin", email: "invalid" },
    user,
  ]) {
    assert.equal((await invoke(metricsAuth, jwt.sign(payload, secret))).status, 403);
  }
  assert.equal((await invoke(metricsAuth, jwt.sign({ ...user, role: "admin" }, secret))).next, true);
  assert.equal((await invoke(metricsAuth, jwt.sign({ id: user.id, role: "admin" }, secret))).next, true);
  assert.equal((await invoke(metricsAuth, "test-scrape-token")).next, true);
});
