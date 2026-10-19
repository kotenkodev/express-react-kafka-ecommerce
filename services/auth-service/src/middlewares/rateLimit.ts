import { createHash } from "node:crypto";
import type { Request, RequestHandler } from "express";
import ipaddr from "ipaddr.js";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { env } from "../config/env";
import { getRedis } from "../lib/redis";
import { AuthError } from "../lib/error";

const limiter = (name: string, points: number, duration: number) =>
  new RateLimiterRedis({
    storeClient: getRedis(),
    keyPrefix: `auth:limit:${name}`,
    points,
    duration,
  });

export const rateLimiters = {
  all: limiter("all", env.authRateLimit, 60),
  login: limiter("login", env.loginRateLimit, 60),
  loginFailures: limiter("login-failures", env.loginFailureLimit, 15 * 60),
  register: limiter("register", env.registerRateLimit, 60 * 60),
  refresh: limiter("refresh", env.refreshRateLimit, 60),
};

export function clientIpKey(req: Request): string {
  const address = ipaddr.process(
    req.ip || req.socket.remoteAddress || "0.0.0.0",
  );
  return address.kind() === "ipv6"
    ? `${Buffer.from(address.toByteArray().slice(0, 8)).toString("hex")}/64`
    : address.toString();
}

export function loginFailureKey(req: Request): string {
  const identifier =
    req.body.email !== undefined
      ? `email:${req.body.email}`
      : `username:${req.body.username}`;
  return createHash("sha256")
    .update(JSON.stringify([identifier, clientIpKey(req)]))
    .digest("hex");
}

export const rateLimit =
  (
    store: RateLimiterRedis,
    key: (req: Request) => string = clientIpKey,
  ): RequestHandler =>
  async (req, res, next) => {
    if (!env.enableRateLimit) {
      return next();
    }
    try {
      await store.consume(key(req));
      next();
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        res.setHeader(
          "Retry-After",
          String(Math.max(1, Math.ceil(error.msBeforeNext / 1000))),
        );
        res
          .status(429)
          .json({ error: "Too many requests. Please try again later." });
        return;
      }
      next(new AuthError("Authentication temporarily unavailable.", 503));
    }
  };

export async function refundSuccessfulLogin(req: Request): Promise<void> {
  if (!env.enableRateLimit) {
    return;
  }
  try {
    await rateLimiters.loginFailures.reward(loginFailureKey(req), 1);
  } catch {
    throw new AuthError("Authentication temporarily unavailable.", 503);
  }
}
