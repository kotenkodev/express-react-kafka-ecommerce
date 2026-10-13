import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import type { RegisterInput } from "../schemas/register.schema";
import type { LoginInput } from "../schemas/login.schema";
import type { MeQuery } from "../schemas/me.schema";
import { env } from "../config/env";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
};

export class AuthController {
  async register(body: RegisterInput, _req: Request, res: Response) {
    const user = await authService.register(body);

    res.status(201).json(user);
  }

  async login(body: LoginInput, _req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await authService.login(body);

    res.cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); // 7 days

    res.status(200).json({ accessToken, user });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const { accessToken } = await authService.refresh(refreshToken);

    res.status(200).json({ accessToken });
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    res.status(200).json({ message: "User logged out" });
  }

  async me(_query: MeQuery, req: Request, res: Response) {
    const userId = String(req.headers["x-user-id"]);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await authService.me(userId);
    res.status(200).json(user);
  }
}

export const authController = new AuthController();
