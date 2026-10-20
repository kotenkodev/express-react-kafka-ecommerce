import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AuthenticatedUser } from "@ecommerce/shared";

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
    req.user = decoded as AuthenticatedUser;
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
      if (!err) req.user = decoded as AuthenticatedUser;
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
