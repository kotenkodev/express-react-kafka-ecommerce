import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { errorHandler } from "../src/http/error.handler";
import { HttpError } from "../src/http/error";

function handle(error: unknown, headersSent = false) {
  let status: number | undefined;
  let body: unknown;
  let forwarded: unknown;
  const response = {
    headersSent,
    status(code: number) { status = code; return this; },
    json(value: unknown) { body = value; return this; },
  } as Response;
  errorHandler(error, {} as Request, response, (value) => { forwarded = value; });
  return { status, body, forwarded };
}

test("HttpError subclasses preserve intentional HTTP statuses and messages", () => {
  class ServiceError extends HttpError {}
  for (const status of [400, 401, 403, 404, 409, 429, 503]) {
    assert.deepEqual(handle(new ServiceError("Public message", status)), {
      status, body: { error: "Public message" }, forwarded: undefined,
    });
  }
});

test("malformed JSON receives a safe 400 response", () => {
  const error = Object.assign(new SyntaxError("private parser details"), { status: 400 });
  assert.equal(handle(error).status, 400);
  assert.deepEqual(handle(error).body, { error: "Invalid JSON body" });
});

test("unexpected errors and invalid HttpError statuses are logged and hidden", (t) => {
  const log = t.mock.method(console, "error", () => {});
  const errors = [new Error("database password"), { statusCode: 401, message: "untrusted" },
    new HttpError("private", 200), new HttpError("private", 700), new HttpError("private", 401.5)];
  for (const error of errors) {
    assert.deepEqual(handle(error), {
      status: 500, body: { error: "Internal server error" }, forwarded: undefined,
    });
  }
  assert.equal(log.mock.callCount(), errors.length);
});

test("errors after headers are sent are forwarded without writing a response", () => {
  const error = new HttpError("Already sent", 409);
  assert.deepEqual(handle(error, true), { status: undefined, body: undefined, forwarded: error });
});
