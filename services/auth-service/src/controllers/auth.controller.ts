import type { Request, Response } from "express";
import { authService } from "../services/auth.service";

export class AuthController {
  async register(req: Request, res: Response) {
    const userId = req.headers["x-user-id"] as string;

    const user = await authService.register({
      userId,
      email: req.body.email,
      password: req.body.password,
    });

    res.status(201).json(user);
  }

  async login(req: Request, res: Response) {
    res.status(201).json("user");
  }
  async refresh(req: Request, res: Response) {
    res.status(201).json("user");
  }
  async logout(req: Request, res: Response) {
    res.status(201).json("user");
  }
  async me(req: Request, res: Response) {
    res.status(201).json("user");
  }
}

export const authController = new AuthController();
