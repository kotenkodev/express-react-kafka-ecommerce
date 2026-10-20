import type { ErrorRequestHandler } from "express";
import { HttpError } from "./error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (
    error instanceof HttpError &&
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
  ) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error("[HTTP] Request failed:", error);
  res.status(500).json({ error: "Internal server error" });
};
