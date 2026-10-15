import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../src/http/validation";

function response() {
  return {
    locals: {} as Record<string, unknown>,
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
}

test("query validation preserves getter-only input and stores parsed values in locals", async () => {
  const rawQuery = { price: "10", name: "  Book  ", unknown: "discard" };
  const req = Object.defineProperty({}, "query", { get: () => rawQuery }) as Request;
  const res = response();
  let nextCalls = 0;
  await validate({ query: z.object({ price: z.coerce.number(), name: z.string().trim() }) })(
    req, res as unknown as Response, () => { nextCalls++; },
  );
  assert.equal(nextCalls, 1);
  assert.deepEqual(res.locals.query, { price: 10, name: "Book" });
  assert.deepEqual(req.query, { price: "10", name: "  Book  ", unknown: "discard" });
});

test("invalid query returns 400 without calling the controller", async () => {
  const req = Object.defineProperty({}, "query", { get: () => ({ price: "invalid" }) }) as Request;
  const res = response();
  let nextCalls = 0;
  await validate({ query: z.object({ price: z.coerce.number() }) })(
    req, res as unknown as Response, () => { nextCalls++; },
  );
  assert.equal(nextCalls, 0);
  assert.equal(res.statusCode, 400);
  assert.equal(res.locals.query, undefined);
  assert.equal((res.body as any).error, "Validation failed");
});

test("body and params validation still updates request values", async () => {
  const req = { body: { email: " TEST@EXAMPLE.COM " }, params: { id: "42" } } as unknown as Request;
  const res = response();
  let nextCalls = 0;
  await validate({
    body: z.object({ email: z.string().trim().toLowerCase() }),
    params: z.object({ id: z.coerce.number() }),
  })(req, res as unknown as Response, () => { nextCalls++; });
  assert.equal(nextCalls, 1);
  assert.deepEqual(req.body, { email: "test@example.com" });
  assert.deepEqual(req.params, { id: 42 });
});
