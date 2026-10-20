import { hashPassword, verifyPassword } from "../lib/password";
import type { RegisterInput } from "../schemas/register.schema";
import { LoginInput } from "../schemas/login.schema";
import {
  createRefreshSession,
  deleteRefreshSession,
  getUserIdFromRefreshToken,
  rotateRefreshSession,
} from "../lib/tokens";
import { generateAccessToken } from "../lib/jwt";
import { AuthError } from "../lib/error";
import { prisma, Prisma } from "@ecommerce/shared";
import { randomBytes } from "node:crypto";

const publicUserSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

export type UserResponse = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

let dummyPasswordHash: Promise<string> | undefined;
function getDummyPasswordHash(): Promise<string> {
  return (dummyPasswordHash ??= hashPassword(randomBytes(32).toString("hex")));
}
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export class AuthService {
  async register(userData: RegisterInput): Promise<UserResponse> {
    const hashedPassword = await hashPassword(userData.password);

    try {
      return await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          passwordHash: hashedPassword,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AuthError("Email or username is already in use.", 409);
      }
      throw error;
    }
  }

  async login(userData: LoginInput): Promise<LoginResult> {
    const existingUser = await prisma.user.findUnique({
      where:
        userData.email !== undefined
          ? { email: userData.email }
          : { username: userData.username! },
      select: { ...publicUserSelect, passwordHash: true },
    });

    const isPasswordValid = await verifyPassword(
      userData.password,
      existingUser?.passwordHash ?? (await getDummyPasswordHash()),
    );

    if (!existingUser || !isPasswordValid) {
      throw new AuthError("Invalid credentials.");
    }

    const { passwordHash, ...user } = existingUser;

    const accessToken = generateAccessToken({
      id: existingUser.id,
      role: existingUser.role,
      email: existingUser.email,
    });
    const refreshToken = await createRefreshSession(existingUser.id);

    return { accessToken, refreshToken, user };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresInMs: number;
  }> {
    const userId = await getUserIdFromRefreshToken(refreshToken);

    if (!userId) {
      throw new AuthError("Invalid refresh token.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      throw new AuthError("User not found.");
    }

    const accessToken = generateAccessToken({
      id: userId,
      role: user.role,
      email: user.email,
    });

    const rotated = await rotateRefreshSession(refreshToken, userId);
    return { accessToken, ...rotated };
  }

  async logout(refreshToken: string): Promise<void> {
    await deleteRefreshSession(refreshToken);
  }

  async me(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new AuthError("User not found.");
    }

    return user;
  }
}

export const authService = new AuthService();
