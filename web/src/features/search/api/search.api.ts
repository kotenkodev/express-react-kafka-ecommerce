import axios from "@/lib/axios";
import type { SearchOrdersParams, SearchOrdersResponse } from "../types";

export async function searchOrders(
  params: SearchOrdersParams,
): Promise<SearchOrdersResponse> {
  const cleanParams: Record<string, unknown> = {};
  if (params.q?.trim()) cleanParams.q = params.q.trim();
  if (params.status && params.status !== "ALL") cleanParams.status = params.status;
  if (params.page) cleanParams.page = params.page;
  if (params.limit) cleanParams.limit = params.limit;

  const { data } = await axios.get<SearchOrdersResponse>("/search", {
    params: cleanParams,
  });
  return data;
}

