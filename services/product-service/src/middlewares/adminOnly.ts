import { NextFunction, Request, Response } from "express";

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const role = req.headers["x-user-role"];

  if (!role) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Authentication required" });
  }

  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin role required" });
  }

  next();
};
