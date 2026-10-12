import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { env } from "../config/env";

export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "15m",
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret);
};

export const generateRefreshToken = (): string => {
  return randomBytes(32).toString("hex");
};

export const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};
