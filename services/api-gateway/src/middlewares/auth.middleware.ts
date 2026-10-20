import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { authenticatedUserSchema } from "../schemas/authenticatedUser.schema";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1];
  const queryToken =
    typeof req.query.token === "string" ? req.query.token : undefined;
  const token = bearerToken || queryToken;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, env.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    const result = authenticatedUserSchema.safeParse(decoded);
    if (!result.success) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = result.data;
    next();
  });
};

export const optionalToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1];
  const queryToken =
    typeof req.query.token === "string" ? req.query.token : undefined;
  const token = bearerToken || queryToken;

  if (token) {
    jwt.verify(token, env.jwtSecret, (err, decoded) => {
      if (!err) {
        const result = authenticatedUserSchema.safeParse(decoded);
        if (result.success) req.user = result.data;
      }
      next();
    });
  } else {
    next();
  }
};

export const requireRole = (role: "admin" | "user") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Authentication required" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden: Admin role required" });
    }
    next();
  };
};
