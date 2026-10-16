import { Router, Request, Response } from "express";
import { slidingWindowService } from "../services/slidingWindow";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const stats = slidingWindowService.getStats();
  res.status(200).json(stats);
});

export { router as analyticsRouter };
