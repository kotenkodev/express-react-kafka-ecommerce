import { useEffect, useState, useRef } from "react";
import { getAnalytics, getStats } from "@/features/analytics/api/analytics.api";
import type { AnalyticsStats, AllTimeStats } from "@/features/analytics/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  Radio,
} from "lucide-react";

interface TimeSeriesPoint {
  time: string;
  ordersCount: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AllTimeStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [history, setHistory] = useState<TimeSeriesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const historyRef = useRef<TimeSeriesPoint[]>([]);

  const fetchMetrics = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsRes, analyticsRes] = await Promise.all([
        getStats(),
        getAnalytics(),
      ]);

      setStats(statsRes);
      setAnalytics(analyticsRes);

      const now = new Date();
      const timeLabel = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const nextPoint: TimeSeriesPoint = {
        time: timeLabel,
        ordersCount: analyticsRes.ordersCount ?? 0,
      };

      const updatedHistory = [...historyRef.current, nextPoint].slice(-12);
      historyRef.current = updatedHistory;
      setHistory(updatedHistory);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchMetrics(true);

    const interval = setInterval(() => {
      void fetchMetrics(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats || !analytics) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Loading analytics...
      </div>
    );
  }

  const rawSuccess = analytics.successRate ?? 0;
  const successPct =
    rawSuccess <= 1 ? Math.round(rawSuccess * 100) : Math.round(rawSuccess);
  const failedPct = Math.max(0, 100 - successPct);

  const pieData = [
    { name: "Success", value: successPct, color: "#10b981" },
    { name: "Failed", value: failedPct, color: "#f43f5e" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Order Analytics (Admin)
            </h1>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
            >
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Live 5s
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Real-time performance indicators from 1-min sliding window & Elasticsearch.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 self-start sm:self-auto text-xs h-8"
          onClick={() => void fetchMetrics(false)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Orders */}
        <Card className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Total Orders
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xl font-bold text-foreground">
            {stats.totalOrders}
          </div>
          <p className="text-[10px] text-muted-foreground">All indexed orders</p>
        </Card>

        {/* Total Revenue */}
        <Card className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Total Revenue
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xl font-bold text-foreground">
            ${Number(stats.totalRevenue).toFixed(2)}
          </div>
          <p className="text-[10px] text-muted-foreground">Platform lifetime revenue</p>
        </Card>

        {/* Average Order Amount */}
        <Card className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Average Order
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xl font-bold text-foreground">
            ${Number(stats.avgOrderAmount).toFixed(2)}
          </div>
          <p className="text-[10px] text-muted-foreground">Average order value</p>
        </Card>

        {/* Payment Time */}
        <Card className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Payment Time
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xl font-bold text-foreground">
            {analytics.avgProcessingMs} ms
          </div>
          <p className="text-[10px] text-muted-foreground">Avg processing latency</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Line Chart */}
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Orders per Minute
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Real-time 60s sliding window
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontSize: "11px",
                      padding: "6px 8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ordersCount"
                    name="Orders / min"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "#3b82f6" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Payment Success Rate
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Successful vs failed transactions
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${value}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => `${val}%`}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontSize: "11px",
                      padding: "6px 8px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
