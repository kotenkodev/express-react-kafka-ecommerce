import axios from "@/lib/axios";
import type { AllTimeStats, AnalyticsStats } from "../types";

export async function getAnalytics(): Promise<AnalyticsStats> {
  const { data } = await axios.get<AnalyticsStats>("/analytics");
  return data;
}

export async function getStats(): Promise<AllTimeStats> {
  const { data } = await axios.get<AllTimeStats>("/search/stats");
  return data;
}
