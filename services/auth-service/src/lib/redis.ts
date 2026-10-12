import { Redis } from "ioredis";
import { env } from "../config/env";

const redisUrl = new URL(env.redisUrl);
if (env.redisPassword) {
  redisUrl.password = env.redisPassword;
}

export const redis = new Redis(redisUrl.toString(), {
  lazyConnect: true,
});
