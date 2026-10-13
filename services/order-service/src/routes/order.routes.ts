import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { requireUser, validate } from "@ecommerce/shared";
import { orderCreateSchema } from "../schemas/order-create.schema";

const router = Router();

router.use(requireUser);

router
  .route("/")
  .post(validate({ body: orderCreateSchema }), orderController.createOrder)
  .get(orderController.getOrders);

router.route("/:id").get(orderController.getOrder);

export { router as orderRoutes };
