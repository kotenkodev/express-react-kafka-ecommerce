import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "@ecommerce/shared";
import { registerSchema } from "../schemas/register.schema";
import { loginSchema } from "../schemas/login.schema";
import { meQuerySchema } from "../schemas/me.schema";

const router = Router();

router.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register,
);
router.post("/login", validate({ body: loginSchema }), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", validate({ query: meQuerySchema }), authController.me);

export { router as authRoutes };
