import { Request, Response } from "express";
import { searchService } from "../services/search.service";
import type { SearchQueryInput } from "../schema/search-query.schema";
import type { SearchIdInput } from "../schema/search-id.schema";

export class SearchController {
  async search(req: Request, res: Response) {
    const queryParams =
      (res.locals.query as SearchQueryInput) ??
      (req.query as unknown as SearchQueryInput);
    const result = await searchService.searchOrders(queryParams);
    res.status(200).json(result);
  }

  async getOrder(req: Request, res: Response) {
    const params = req.params as unknown as SearchIdInput;
    const order = await searchService.getOrderById(params);
    res.status(200).json(order);
  }

  async getStats(req: Request, res: Response) {
    const stats = await searchService.getStats();
    res.status(200).json(stats);
  }
}

export const searchController = new SearchController();
