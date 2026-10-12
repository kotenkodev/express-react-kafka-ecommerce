import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import type { RegisterInput } from "../schemas/register.schema";
import type { LoginInput } from "../schemas/login.schema";
import type { RefreshTokenInput } from "../schemas/refresh-token.schema";
import type { MeQuery } from "../schemas/me.schema";

export class AuthController {
  async register(body: RegisterInput, _req: Request, res: Response) {
    const user = await authService.register(body);

    res.status(201).json(user);
  }

  async login(body: LoginInput, _req: Request, res: Response) {
    const user = await authService.login(body);
    res.status(201).json(user);
  }

  async refresh(body: RefreshTokenInput, _req: Request, res: Response) {
    const accessToken = await authService.refresh(body);
    res.status(201).json({ token: accessToken });
  }

  async logout(body: RefreshTokenInput, _req: Request, res: Response) {
    await authService.logout(body);
    res.status(201).json({ message: "User logged out" });
  }

  async me(_query: MeQuery, req: Request, res: Response) {
    const { id } = req.user;
    const user = await authService.me(id);
    res.status(201).json(user);
  }
}

export const authController = new AuthController();
