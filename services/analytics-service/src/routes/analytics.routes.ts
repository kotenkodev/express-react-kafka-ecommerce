import { Router, Request, Response } from "express";
import { slidingWindowService } from "../services/slidingWindow";
import { requireRole } from "@ecommerce/shared";

const router = Router();

router.get("/", requireRole("admin"), (_req: Request, res: Response) => {
  const stats = slidingWindowService.getStats();
  res.status(200).json(stats);
});

export { router as analyticsRouter };
