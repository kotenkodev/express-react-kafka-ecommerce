import { Router } from "express";
import { orderSSEController } from "../controllers/sse.controller";

const router = Router();

router.route("/").get(orderSSEController.stream);

export { router as sseRoutes };
