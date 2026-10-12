import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validateBody, validateQuery } from "@ecommerce/shared/validation";
import { registerSchema } from "../schemas/register.schema";
import { loginSchema } from "../schemas/login.schema";
import { refreshTokenSchema } from "../schemas/refresh-token.schema";
import { meQuerySchema } from "../schemas/me.schema";

const router = Router();

router.post("/register", validateBody(registerSchema, authController.register));
router.post("/login", validateBody(loginSchema, authController.login));
router.post(
  "/refresh",
  validateBody(refreshTokenSchema, authController.refresh),
);
router.post("/logout", validateBody(refreshTokenSchema, authController.logout));
router.get("/me", validateQuery(meQuerySchema, authController.me));

export { router as authRoutes };
