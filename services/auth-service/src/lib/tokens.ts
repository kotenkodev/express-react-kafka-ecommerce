import { env } from "../config/env";
import { generateRefreshToken, hashRefreshToken } from "./jwt";
import ms from "ms";
import { redis } from "./redis";

const REFRESH_TOKEN_TTL = ms(env.refreshTokenExpiresIn) / 1000;

export async function createRefreshSession(userId: number) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await redis.set(
    `refresh:${tokenHash}`,
    userId.toString(),
    "EX",
    REFRESH_TOKEN_TTL,
  );

  return refreshToken;
}

export const getUserIdFromRefreshToken = async (
  refreshToken: string,
): Promise<number | null> => {
  const tokenHash = hashRefreshToken(refreshToken);
  const userId = await redis.get(`refresh:${tokenHash}`);
  return userId ? parseInt(userId, 10) : null;
};

export async function isRefreshTokenValid(
  refreshToken: string,
): Promise<boolean> {
  const tokenHash = hashRefreshToken(refreshToken);
  const exists = await redis.exists(`refresh:${tokenHash}`);
  return exists === 1;
}

export async function deleteRefreshSession(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  await redis.del(`refresh:${tokenHash}`);
}
