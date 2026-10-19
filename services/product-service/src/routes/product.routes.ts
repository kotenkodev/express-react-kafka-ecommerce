import { Router } from "express";
import { productQuerySchema } from "../schemas/product-query.schema";
import { productParamsSchema } from "../schemas/product-params.schema";
import { productSchema, productUpdateSchema } from "../schemas/product.schema";
import { productController } from "../controllers/product.controller";
import { validate, requireRole } from "@ecommerce/shared";

const router = Router();

router
  .route("/")
  .get(validate({ query: productQuerySchema }), productController.getProducts)
  .post(
    requireRole("admin"),
    validate({ body: productSchema }),
    productController.createProduct,
  );

router.get("/categories", productController.getCategories);

router
  .route("/:id")
  .get(validate({ params: productParamsSchema }), productController.getProduct)
  .put(
    requireRole("admin"),
    validate({ params: productParamsSchema, body: productUpdateSchema }),
    productController.updateProduct,
  )
  .delete(
    requireRole("admin"),
    validate({ params: productParamsSchema }),
    productController.deleteProduct,
  );

export { router as productRoutes };
