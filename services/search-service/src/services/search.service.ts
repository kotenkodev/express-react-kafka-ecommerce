import { SearchQueryInput } from "../schema/search-query.schema";
import { SearchIdInput } from "../schema/search-id.schema";
import { esClient, ORDERS_INDEX } from "../config/elasticsearch";
import { HttpError } from "@ecommerce/shared";
import { OrderDocument } from "./indexer.service";

export interface SearchStatsResult {
  totalOrders: number;
  totalRevenue: number;
  avgOrderAmount: number;
}

export class SearchService {
  async searchOrders({
    query,
    q,
    status,
    page = 1,
    limit = 10,
  }: SearchQueryInput) {
    const from = (page - 1) * limit;
    const queryString = (query || q)?.trim();

    const must: any[] = [];
    const filter: any[] = [];

    if (queryString) {
      must.push({
        multi_match: {
          query: queryString,
          fields: [
            "orderId^3",
            "userId",
            "courier^2",
            "items.productId",
            "status",
          ],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    if (status) {
      filter.push({
        term: {
          status,
        },
      });
    }

    const sort: any[] = [];
    if (queryString) {
      sort.push({ _score: { order: "desc" } });
    }
    sort.push({ createdAt: { order: "desc", unmapped_type: "date" } });
    const response = await esClient.search<OrderDocument>({
      index: ORDERS_INDEX,
      from,
      size: limit,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          ...(filter.length > 0 ? { filter } : {}),
        },
      },
      sort,
      track_total_hits: true,
    });
    const total =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total?.value || 0;
    const orders = response.hits.hits
      .map((hit) => hit._source)
      .filter((doc): doc is OrderDocument => Boolean(doc));
    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById({ id }: SearchIdInput) {
    try {
      const result = await esClient.get<OrderDocument>({
        index: ORDERS_INDEX,
        id,
      });
      if (!result.found || !result._source) {
        throw new HttpError("Order not found", 404);
      }
      return result._source;
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      if (error.statusCode === 404 || error.meta?.statusCode === 404) {
        throw new HttpError("Order not found", 404);
      }
      throw error;
    }
  }

  async getStats() {
    const response = await esClient.search({
      index: ORDERS_INDEX,
      size: 0,
      aggs: {
        totalRevenue: {
          sum: { field: "totalAmount" },
        },
        avgOrderAmount: {
          avg: { field: "totalAmount" },
        },
      },
      track_total_hits: true,
    });
    const totalOrders =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total?.value || 0;
    const aggs = response.aggregations as any;
    const totalRevenue = aggs?.totalRevenue?.value ?? 0;
    const avgOrderAmount = aggs?.avgOrderAmount?.value ?? 0;
    return {
      totalOrders,
      totalRevenue: Number((totalRevenue || 0).toFixed(2)),
      avgOrderAmount: Number((avgOrderAmount || 0).toFixed(2)),
    };
  }
}

export const searchService = new SearchService();
