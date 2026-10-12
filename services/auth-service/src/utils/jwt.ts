import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = async (payload: object) => {
  const token = await jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  return token;
};

export const verifyToken = async (token: string) => {
  const decoded = await jwt.verify(token, env.jwtSecret);
  return decoded;
};

export function createRefreshToken(): string {
  const payload = { type: "refresh" };
  const refreshToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.refreshTokenExpiresIn,
  });
  return refreshToken;
}
