import { prisma, User } from "@ecommerce/shared/prisma";
import { hashPassword, verifyPassword } from "../lib/password";
import type { RegisterInput } from "../schemas/register.schema";
import { LoginInput } from "../schemas/login.schema";
import { RefreshTokenInput } from "../schemas/refresh-token.schema";
import { createRefreshSession, deleteRefreshSession } from "../lib/tokens";
import { generateAccessToken } from "../lib/jwt";
import { AuthError } from "../lib/error";

export class AuthService {
  async register(userData: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new AuthError("User with this email already exists.");
    }

    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async login(
    userData: LoginInput,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (!existingUser) {
      throw new AuthError("User with this username does not exist.");
    }

    const isPasswordValid = await verifyPassword(
      userData.password,
      existingUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AuthError("Invalid password.");
    }

    const accessToken = generateAccessToken({
      id: existingUser.id,
      role: existingUser.role,
      email: existingUser.email,
    });
    const refreshToken = await createRefreshSession(existingUser.id);

    return { accessToken, refreshToken, user: existingUser };
  }

  async refresh(
    token: RefreshTokenInput,
  ): Promise<{ accessToken: string; refreshToken: string }> {}

  async logout(token: RefreshTokenInput): Promise<void> {
    await deleteRefreshSession(token.refreshToken);
  }

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthError("User not found.");
    }

    return user;
  }
}

export const authService = new AuthService();
