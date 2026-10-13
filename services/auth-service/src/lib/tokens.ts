import { env } from "../config/env";
import { generateRefreshToken, hashRefreshToken } from "./jwt";
import ms from "ms";
import { getRedis } from "./redis";

const REFRESH_PREFIX = "refresh";
const REFRESH_TOKEN_TTL = ms(env.refreshTokenExpiresIn) / 1000;

export async function createRefreshSession(userId: string) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await getRedis().set(
    `refresh:${tokenHash}`,
    userId.toString(),
    "EX",
    REFRESH_TOKEN_TTL,
  );

  return refreshToken;
}

export const getUserIdFromRefreshToken = async (
  refreshToken: string,
): Promise<string | null> => {
  const tokenHash = hashRefreshToken(refreshToken);
  const userId = await getRedis().get(`${REFRESH_PREFIX}:${tokenHash}`);
  return userId;
};

export async function isRefreshTokenValid(
  refreshToken: string,
): Promise<boolean> {
  const tokenHash = hashRefreshToken(refreshToken);
  const exists = await getRedis().exists(`${REFRESH_PREFIX}:${tokenHash}`);
  return exists === 1;
}

export async function deleteRefreshSession(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  await getRedis().del(`${REFRESH_PREFIX}:${tokenHash}`);
}
