import { Router } from "express";
import { productQuerySchema } from "../schemas/product-query.schema";
import { productParamsSchema } from "../schemas/product-params.schema";
import { productSchema, productUpdateSchema } from "../schemas/product.schema";
import { productController } from "../controllers/product.controller";
import { adminOnly } from "../middlewares/adminOnly";
import { validate } from "@ecommerce/shared";
import { healthCheck } from "@ecommerce/shared";

const router = Router();

router.get("/test", async (req, res) => {
  try {
    await healthCheck();
    res.status(200).json({ success: true, message: "Database connected!" });
  } catch {
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});

router
  .route("/")
  .get(validate({ query: productQuerySchema }), productController.getProducts)
  .post(
    adminOnly,
    validate({ body: productSchema }),
    productController.createProduct,
  );

router.get("/categories", productController.getCategories);

router
  .route("/:id")
  .get(validate({ params: productParamsSchema }), productController.getProduct)
  .put(
    adminOnly,
    validate({ params: productParamsSchema, body: productUpdateSchema }),
    productController.updateProduct,
  )
  .delete(
    adminOnly,
    validate({ params: productParamsSchema }),
    productController.deleteProduct,
  );

export { router as productRoutes };
