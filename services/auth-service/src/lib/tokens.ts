import { randomBytes } from "node:crypto";
import { env } from "../config/env";
import { hashRefreshToken } from "./jwt";
import ms from "ms";
import { getRedis } from "./redis";
import { AuthError } from "./error";

const familyKey = (token: string) => `refresh:v2:{${token.slice(0, 32)}}`;
const validFormat = (token: string) => /^[a-f0-9]{64}$/.test(token);
const CREATE_SESSION = `
  if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
  redis.call('HSET', KEYS[1], 'userId', ARGV[1], 'active', ARGV[2])
  redis.call('PEXPIRE', KEYS[1], ARGV[3])
  return 1
`;

const SESSION_OPERATION = `
  local active = redis.call('HGET', KEYS[1], 'active')
  if not active then return nil end
  local used = redis.call('HEXISTS', KEYS[1], ARGV[2]) == 1
  if used then
    redis.call('DEL', KEYS[1])
    return nil
  end
  if active ~= ARGV[2] then return nil end
  if ARGV[1] == 'logout' then
    redis.call('DEL', KEYS[1])
    return nil
  end
  local ttl = redis.call('PTTL', KEYS[1])
  if ttl <= 0 then
    redis.call('DEL', KEYS[1])
    return nil
  end
  local userId = redis.call('HGET', KEYS[1], 'userId')
  if ARGV[1] == 'rotate' then
    if userId ~= ARGV[4] then return nil end
    redis.call('HSET', KEYS[1], ARGV[2], 'used', 'active', ARGV[3])
  end
  return {userId, ttl}
`;

async function sessionOperation(
  token: string,
  operation: "lookup" | "rotate" | "logout",
  replacement = "",
  userId = "",
): Promise<[string, number] | null> {
  if (!validFormat(token)) return null;
  try {
    return (await getRedis().eval(
      SESSION_OPERATION,
      1,
      familyKey(token),
      operation,
      hashRefreshToken(token),
      replacement,
      userId,
    )) as [string, number] | null;
  } catch {
    throw new AuthError("Authentication temporarily unavailable.", 503);
  }
}

export async function createRefreshSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  try {
    const created = await getRedis().eval(
      CREATE_SESSION,
      1,
      familyKey(token),
      userId,
      hashRefreshToken(token),
      ms(env.refreshTokenExpiresIn),
    );
    if (created !== 1) throw new Error("Refresh family collision");
    return token;
  } catch {
    throw new AuthError("Authentication temporarily unavailable.", 503);
  }
}

export async function getUserIdFromRefreshToken(
  token: string,
): Promise<string | null> {
  const session = await sessionOperation(token, "lookup");
  return session?.[0] ?? null;
}

export async function rotateRefreshSession(token: string, userId: string) {
  const refreshToken = token.slice(0, 32) + randomBytes(16).toString("hex");
  const session = await sessionOperation(
    token,
    "rotate",
    hashRefreshToken(refreshToken),
    userId,
  );
  if (!session) throw new AuthError("Invalid refresh token.");
  return { refreshToken, refreshTokenExpiresInMs: session[1] };
}

export async function isRefreshTokenValid(token: string): Promise<boolean> {
  return (await getUserIdFromRefreshToken(token)) !== null;
}

export async function deleteRefreshSession(token: string): Promise<void> {
  await sessionOperation(token, "logout");
}
