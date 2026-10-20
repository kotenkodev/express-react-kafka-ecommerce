import { useEffect, useState } from "react";
import { getAnalytics, getStats } from "@/features/analytics/api/analytics.api";
import type { AnalyticsStats, AllTimeStats } from "@/features/analytics/types";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AllTimeStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          getStats(),
          getAnalytics(),
        ]);
        setStats(statsRes);
        setAnalytics(analyticsRes);
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  if (isLoading || !stats || !analytics) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  const successRate = analytics.successRate ?? 0;
  const data = [
    { name: "Success", value: successRate },
    { name: "Failed", value: Math.max(0, 100 - successRate) },
  ];
  const COLORS = ["#0088FE", "#FF8042"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {stats.totalOrders}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ${stats.totalRevenue}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Order Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ${stats.avgOrderAmount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {analytics.avgProcessingMs} ms
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Payment Success Rate
        </h3>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name || ""}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
