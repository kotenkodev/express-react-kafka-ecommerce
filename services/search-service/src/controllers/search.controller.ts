import { Request, Response } from "express";
import {
  searchService,
  type SearchQueryInput,
  type SearchIdInput,
} from "../services/search.service";

export class SearchController {
  async search(req: Request, res: Response) {
    const queryParams =
      (res.locals.query as SearchQueryInput) ?? (req.query as SearchQueryInput);
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
