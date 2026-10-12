import { hashPassword, verifyPassword } from "../lib/password";
import type { RegisterInput } from "../schemas/register.schema";
import { LoginInput } from "../schemas/login.schema";
import {
  createRefreshSession,
  deleteRefreshSession,
  getUserIdFromRefreshToken,
} from "../lib/tokens";
import { generateAccessToken } from "../lib/jwt";
import { AuthError } from "../lib/error";
import { prisma } from "@ecommerce/shared";

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
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async login(
    userData: LoginInput,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (!existingUser) {
      throw new AuthError("User with this username does not exist.");
    }

    const { passwordHash, ...user } = existingUser;

    const isPasswordValid = await verifyPassword(
      userData.password,
      passwordHash,
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

    return { accessToken, refreshToken, user };
  }

  async refresh(refreshToken: string) {
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

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await deleteRefreshSession(refreshToken);
  }

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthError("User not found.");
    }

    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}

export const authService = new AuthService();
