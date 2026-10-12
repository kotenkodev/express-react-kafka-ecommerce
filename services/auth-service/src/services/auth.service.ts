import { prisma } from "@ecommerce/shared";
import { hashPassword } from "../utils/password";

export class AuthService {
  async register(userData: { email: string; password: string }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const hashedPassword = hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.email,
        first_name: "",
        last_name: "",
        password_hash: hashedPassword,
      },
    });

    return user;
  }

  async login(userData: { email: string; password: string }) {}

  async refresh(token: string) {}

  async logout(token: string) {}

  async me(userId: string) {}
}

export const authService = new AuthService();
