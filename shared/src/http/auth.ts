import type { Request, Response, NextFunction } from "express";
import type { Role as UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.headers["x-user-id"] as string;
  const role = req.headers["x-user-role"] as UserRole;
  const email = req.headers["x-user-email"] as string;

  if (!id || !role) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing user headers" });
  }

  (req as RequestWithUser).user = { id, role, email };
  next();
};
