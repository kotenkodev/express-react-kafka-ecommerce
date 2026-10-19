export interface AnalyticsStats {
  windowStart: string;
  ordersCount: number;
  totalRevenue: number;
  successRate: number;
  avgProcessingMs: number;
}

export interface AnalyticsPoint {
  timestamp: number;
  ordersCount: number;
}

export interface AllTimeStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderAmount: number;
}
