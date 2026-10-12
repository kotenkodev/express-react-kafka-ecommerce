import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { z } from "zod";

export type ValidatedHandler<Schema extends z.ZodTypeAny> = (
  data: z.output<Schema>,
  req: Request,
  res: Response,
  next: NextFunction,
) => unknown;

function validate<Schema extends z.ZodTypeAny>(
  source: "body" | "query",
  schema: Schema,
  handler: ValidatedHandler<Schema>,
): RequestHandler {
  return (req, res, next) => {
    void (async () => {
      const result = await schema.safeParseAsync(req[source]);

      if (!result.success) {
        res.status(400).json({
          error: `Invalid request ${source}`,
          details: result.error.flatten(),
        });
        return;
      }

      await handler(result.data, req, res, next);
    })().catch(next);
  };
}

export function validateBody<Schema extends z.ZodTypeAny>(
  schema: Schema,
  handler: ValidatedHandler<Schema>,
): RequestHandler {
  return validate("body", schema, handler);
}

export function validateQuery<Schema extends z.ZodTypeAny>(
  schema: Schema,
  handler: ValidatedHandler<Schema>,
): RequestHandler {
  return validate("query", schema, handler);
}
