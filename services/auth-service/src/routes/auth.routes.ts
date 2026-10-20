import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireUser, validate } from "@ecommerce/shared";
import { registerSchema } from "../schemas/register.schema";
import { loginSchema } from "../schemas/login.schema";
import {
  rateLimit,
  rateLimiters,
  loginFailureKey,
} from "../middlewares/rateLimit";

const router = Router();
router.use(rateLimit(rateLimiters.all));

router.post(
  "/register",
  rateLimit(rateLimiters.register),
  validate({ body: registerSchema }),
  authController.register,
);
router.post(
  "/login",
  rateLimit(rateLimiters.login),
  validate({ body: loginSchema }),
  rateLimit(rateLimiters.loginFailures, loginFailureKey),
  authController.login,
);
router.post(
  "/refresh",
  rateLimit(rateLimiters.refresh),
  authController.refresh,
);
router.post("/logout", authController.logout);
router.get("/me", requireUser, authController.me);

export { router as authRoutes };
