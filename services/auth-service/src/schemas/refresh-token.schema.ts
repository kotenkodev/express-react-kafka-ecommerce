import type { Request } from "express";
import { z } from "@ecommerce/shared";
import { AuthError } from "../lib/error";

const refreshTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export function readRefreshToken(req: Request): string | undefined {
  const cookieToken: unknown = req.cookies?.refreshToken;
  const bodyToken: unknown = req.body?.refreshToken;

  for (const token of [cookieToken, bodyToken]) {
    if (token !== undefined && !refreshTokenSchema.safeParse(token).success) {
      throw new AuthError("Invalid refresh token format.", 400);
    }
  }

  return (cookieToken ?? bodyToken) as string | undefined;
}
