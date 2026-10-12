const test = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const { validateBody, validateQuery } = require("../dist/validation");

function invoke(source, input, middleware) {
  return new Promise((resolve) => {
    const req = {};
    // A getter-only property catches accidental request mutation.
    Object.defineProperty(req, source, { get: () => input });
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); },
    };
    middleware(req, res, (error) => resolve({ error }));
  });
}

test("body validation passes normalized output to the controller", async () => {
  const schema = z.object({ email: z.string().trim().toLowerCase().email() });
  const result = await invoke("body", { email: " USER@example.com " },
    validateBody(schema, (body, _req, res) => res.json(body)));
  assert.deepEqual(result, { status: 200, body: { email: "user@example.com" } });
});

test("invalid body returns 400 without calling the controller", async () => {
  let called = false;
  const schema = z.object({ email: z.string().email() });
  const result = await invoke("body", { email: "invalid" },
    validateBody(schema, () => { called = true; }));
  assert.equal(result.status, 400);
  assert.equal(result.body.error, "Invalid request body");
  assert.ok(result.body.details.fieldErrors.email.length);
  assert.equal(called, false);
});

test("query validation applies coercion and defaults without mutation", async () => {
  const schema = z.object({ page: z.coerce.number().int().positive().default(1) });
  const middleware = validateQuery(schema, (query, _req, res) => res.json(query));
  assert.deepEqual(await invoke("query", { page: "2" }, middleware),
    { status: 200, body: { page: 2 } });
  assert.deepEqual(await invoke("query", {}, middleware),
    { status: 200, body: { page: 1 } });
  assert.equal((await invoke("query", { page: "invalid" }, middleware)).status, 400);
});

test("async refinements return validation errors", async () => {
  const schema = z.object({ name: z.string().refine(async (name) => name !== "taken") });
  const result = await invoke("body", { name: "taken" },
    validateBody(schema, (body, _req, res) => res.json(body)));
  assert.equal(result.status, 400);
});

test("synchronous controller throws and rejected promises reach next", async () => {
  const error = new Error("controller failed");
  const schema = z.object({});
  const sync = await invoke("body", {}, validateBody(schema, () => { throw error; }));
  const asyncResult = await invoke("body", {}, validateBody(schema, async () => { throw error; }));
  assert.equal(sync.error, error);
  assert.equal(asyncResult.error, error);
});

test("unexpected schema failures reach next", async () => {
  const error = new Error("refinement failed");
  const schema = z.object({}).superRefine(async () => { throw error; });
  const result = await invoke("body", {}, validateBody(schema, () => {}));
  assert.equal(result.error, error);
});
