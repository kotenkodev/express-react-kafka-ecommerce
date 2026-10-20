import { getRedis } from "../lib/redis";

export class IdempotencyService {
  private static getKey(userId: string, key: string) {
    return `idempotency:order:${userId}:${key}`;
  }

  static async acquire(
    userId: string,
    key: string,
  ): Promise<"ACQUIRED" | "IN_PROGRESS" | any> {
    const redis = getRedis();
    const redisKey = this.getKey(userId, key);

    const cached = await redis.get(redisKey);
    if (cached) {
      if (cached === "IN_PROGRESS") return "IN_PROGRESS";
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }

    const acquired = await redis.set(redisKey, "IN_PROGRESS", "EX", 60, "NX");
    return acquired ? "ACQUIRED" : "IN_PROGRESS";
  }

  static async save(userId: string, key: string, result: any): Promise<void> {
    const redis = getRedis();
    const redisKey = this.getKey(userId, key);
    await redis.set(redisKey, JSON.stringify(result), "EX", 86400); // 24 hours
  }

  static async release(userId: string, key: string): Promise<void> {
    const redis = getRedis();
    await redis.del(this.getKey(userId, key));
  }
}
