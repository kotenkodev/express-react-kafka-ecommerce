import Redis from "ioredis";
import { env } from "../config/env";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: 2000,
      ...(env.redisPassword ? { password: env.redisPassword } : {}),
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  await getRedis().connect();
  console.log("Connected to Redis successfully.");
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
