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
      const timeLabel = now.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Orders Analytics (Admin)
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px]"
            >
              <Radio className="h-3 w-3 animate-pulse" />
              Live 5s
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Realtime metrics (1-minute sliding window + Elasticsearch stats).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-auto"
          onClick={() => void fetchMetrics(false)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {stats.totalOrders}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            All-time total number of orders placed on the platform
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ${Number(stats.totalRevenue).toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            All-time total revenue generated by the platform
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Average Order
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ${Number(stats.avgOrderAmount).toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Average order amount across all orders placed on the platform
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Payment Time
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {analytics.avgProcessingMs} ms
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Average time to process a payment
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Average Orders per Minute
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Sliding window of 60 seconds in real-time
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ordersCount"
                    name="Замовлень / хв"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Payment Success Rate
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Rate of successful vs failed transactions
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
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
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontSize: "12px",
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
