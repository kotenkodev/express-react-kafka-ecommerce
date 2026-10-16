import type { Request, Response, NextFunction } from "express";
import { httpRequestsTotal, metricsRegistry } from "../kafka/metrics";

export const httpMetricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.on("finish", () => {
    const route = req.baseUrl || req.path || "unknown";
    httpRequestsTotal.inc({
      route,
      status_code: res.statusCode.toString(),
    });
  });
  next();
};

export const metricsHandler = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
};
