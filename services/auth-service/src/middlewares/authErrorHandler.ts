import type { ErrorRequestHandler } from "express";
import { errorHandler } from "@ecommerce/shared";
import { AuthError } from "../lib/error";

export const authErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (!res.headersSent && error instanceof AuthError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  errorHandler(error, req, res, next);
};
