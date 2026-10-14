import { Router } from "express";
import { orderSSEController } from "../controllers/sse.controller";
import { requireUser } from "@ecommerce/shared";

const router = Router();

router.route("/").get(requireUser, (req, res, next) => {
  orderSSEController.stream(req, res).catch(next);
});
export { router as sseRoutes };
