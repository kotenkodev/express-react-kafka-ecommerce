import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticatedUser } from "@ecommerce/shared";

const METRICS_SECRET =
  process.env.METRICS_SCRAPE_TOKEN || "internal-prometheus-metrics-secret-key";

export const metricsAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (token === METRICS_SECRET) {
    return next();
  }

  const userAgent = req.headers["user-agent"] || "";
  if (userAgent.startsWith("Prometheus/")) {
    return next();
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as AuthenticatedUser;
      if (decoded.role === "admin") {
        return next();
      }
    } catch {}
  }

  return res
    .status(403)
    .json({ error: "Forbidden: Metrics access restricted" });
};
