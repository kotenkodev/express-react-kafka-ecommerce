import { Router } from "express";
import { orderController } from "../controllers/order.controller";

const router = Router();

router
  .route("/")
  .post(orderController.createOrder)
  .get(orderController.getOrders);

router.route("/:id").get(orderController.getOrder);

export { router as orderRoutes };
