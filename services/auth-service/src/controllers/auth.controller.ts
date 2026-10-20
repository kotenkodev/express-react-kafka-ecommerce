import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { env } from "../config/env";
import { RequestWithUser } from "@ecommerce/shared";
import ms from "ms";
import { readRefreshToken } from "../schemas/refresh-token.schema";
import { refundSuccessfulLogin } from "../middlewares/rateLimit";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
};

export class AuthController {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body);

    res.status(201).json(user);
  }

  async login(req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body,
    );
    await refundSuccessfulLogin(req);

    res.cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: ms(env.refreshTokenExpiresIn),
    });

    res.status(200).json({ accessToken, user });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const {
      accessToken,
      refreshToken: replacement,
      refreshTokenExpiresInMs,
    } = await authService.refresh(refreshToken);

    res.cookie("refreshToken", replacement, {
      ...COOKIE_OPTIONS,
      maxAge: refreshTokenExpiresInMs,
    });

    res.status(200).json({ accessToken });
  }

  async logout(req: Request, res: Response) {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    res.status(200).json({ message: "User logged out" });
  }

  async me(req: Request, res: Response) {
    const { user: authUser } = req as RequestWithUser;

    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await authService.me(authUser.id);
    res.status(200).json(user);
  }
}

export const authController = new AuthController();
