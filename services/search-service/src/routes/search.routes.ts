import { validate } from "@ecommerce/shared";
import { Router } from "express";
import { searchQuerySchema } from "../schema/search-query.schema";
import { searchIdSchema } from "../schema/search-id.schema";
import { searchController } from "../controllers/search.controller";

const router = Router();

router.get(
  "/",
  validate({ query: searchQuerySchema }),
  searchController.search,
);
router.get(
  "/orders/:id",
  validate({ params: searchIdSchema }),
  searchController.getOrder,
);

router.get("/stats", searchController.getStats);

export { router as searchRouter };
