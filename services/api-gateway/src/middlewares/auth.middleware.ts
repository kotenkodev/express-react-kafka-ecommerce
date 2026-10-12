import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "@ecommerce/shared/types";
import { env } from "../config/env";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1];

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
  const token =
    authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, env.jwtSecret, (err, decoded) => {
      if (!err) req.user = decoded as AuthenticatedUser;
      next();
    });
  } else {
    next();
  }
};
