import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics, getStats } from "@/features/analytics/api/analytics.api";
import { AllTimeStats, AnalyticsStats } from "@/features/analytics/types";
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [stats, setStats] = useState<AllTimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const data = [
    { name: "Группа A", value: 400 },
    { name: "Группа B", value: 300 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, analyticsRes] = await Promise.all([
          getStats(),
          getAnalytics(),
        ]);
        setStats(statsRes);
        setAnalytics(analyticsRes);
        console.log("analytics", statsRes);
        console.log("stats", analyticsRes);
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        <h3>All-Time Stats</h3>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>{stats.totalOrders}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>{stats.totalRevenue}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Order Amount</CardTitle>
          </CardHeader>
          <CardContent>{stats.avgOrderAmount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Processing Time (ms)</CardTitle>
          </CardHeader>
          <CardContent>{analytics.avgProcessingMs}</CardContent>
        </Card>
      </div>

      <div>
        <h3>Payment Success Rate</h3>
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
