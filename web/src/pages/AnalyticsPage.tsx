import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics, getStats } from "@/features/analytics/api/analytics.api";
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
  PackageSearch,
} from "lucide-react";
import { getErrorMessage } from "@/lib/error";

interface TimeSeriesPoint {
  time: string;
  ordersCount: number;
}

export default function AnalyticsPage() {
  const [history, setHistory] = useState<TimeSeriesPoint[]>([]);

  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: getStats,
  });

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
    isRefetching,
  } = useQuery({
    queryKey: ["analytics-window"],
    queryFn: getAnalytics,
    refetchInterval: 5000,
  });

  // Append new sliding window point to time-series history
  useEffect(() => {
    if (!analytics) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    setHistory((prev) =>
      [
        ...prev,
        { time: timeLabel, ordersCount: analytics.ordersCount ?? 0 },
      ].slice(-12),
    );
  }, [analytics]);

  const isLoading = isStatsLoading || isAnalyticsLoading;
  const error = statsError || analyticsError;

  if (isLoading && (!stats || !analytics)) {
    return (
      <div className="flex h-full w-full min-h-[50vh] items-center justify-center p-4 text-xs text-muted-foreground">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin text-primary" />
        Loading analytics...
      </div>
    );
  }

  if (error && !stats && !analytics) {
    return (
      <div className="flex h-full w-full min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center m-4 sm:m-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <PackageSearch className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          Analytics unavailable
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {getErrorMessage(error)}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            void refetchStats();
            void refetchAnalytics();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const rawSuccess = analytics?.successRate ?? 0;
  const successPct =
    rawSuccess <= 1 ? Math.round(rawSuccess * 100) : Math.round(rawSuccess);
  const failedPct = Math.max(0, 100 - successPct);

  const pieData = [
    { name: "Success", value: successPct, color: "#10b981" },
    { name: "Failed", value: failedPct, color: "#f43f5e" },
  ];

  return (
    <div className="flex h-full w-full flex-col space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Order Analytics
            </h1>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs"
            >
              <Radio className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-pulse" />
              Live 5s
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Real-time performance indicators from 1-min sliding window &
            Elasticsearch.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 self-start sm:self-auto text-xs sm:text-sm h-8 sm:h-9"
          onClick={() => {
            void refetchStats();
            void refetchAnalytics();
          }}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
              Total Orders
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-foreground truncate">
            {stats?.totalOrders ?? "—"}
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
            All indexed orders
          </p>
        </Card>

        <Card className="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
              Total Revenue
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-foreground truncate">
            ${Number(stats?.totalRevenue ?? 0).toFixed(2)}
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
            Platform lifetime revenue
          </p>
        </Card>

        <Card className="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
              Average Order
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-foreground truncate">
            ${Number(stats?.avgOrderAmount ?? 0).toFixed(2)}
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
            Average order value
          </p>
        </Card>

        <Card className="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
              Payment Time
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-foreground truncate">
            {analytics?.avgProcessingMs ?? 0} ms
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
            Avg processing latency
          </p>
        </Card>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-2xs">
          <CardHeader className="p-0 pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
              Orders per Minute
            </CardTitle>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Real-time 60s sliding window
            </p>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="h-full min-h-62.5 w-full sm:min-h-75">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={history}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
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
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ordersCount"
                    name="Orders / min"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-2xs">
          <CardHeader className="p-0 pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
              Payment Success Rate
            </CardTitle>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Successful vs failed transactions
            </p>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="h-full min-h-62.5 w-full sm:min-h-75">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius="50%"
                    outerRadius="75%"
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${value}%`}
                    labelLine={false}
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
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
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
