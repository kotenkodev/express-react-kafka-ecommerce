import { Router } from "express";
import { productQuerySchema } from "../schemas/product-query.schema";
import { productParamsSchema } from "../schemas/product-params.schema";
import { productSchema, productUpdateSchema } from "../schemas/product.schema";
import { productController } from "../controllers/product.controller";
import { adminOnly } from "../middlewares/adminOnly";
import { validate } from "@ecommerce/shared";

const router = Router();

router
  .route("/products")
  .get(validate({ query: productQuerySchema }), productController.getProducts)
  .post(
    adminOnly,
    validate({ body: productSchema }),
    productController.createProduct,
  );

router.get("/products/categories", productController.getCategories);

router
  .route("/products/:id")
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
