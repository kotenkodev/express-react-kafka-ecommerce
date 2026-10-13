import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { z } from "zod";

export interface ValidationSchemas {
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  body?: z.ZodTypeAny;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, unknown> = {};

    for (const [source, schema] of Object.entries(schemas) as [
      "params" | "query" | "body",
      z.ZodTypeAny,
    ][]) {
      if (!schema) continue;

      const result = await schema.safeParseAsync(req[source]);

      if (!result.success) {
        errors[source] = result.error.flatten();
      } else {
        // Assign coerced, trimmed, and sanitized data back to req
        req[source] = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    next();
  };
}
