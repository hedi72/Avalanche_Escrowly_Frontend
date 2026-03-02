"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import {
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  RefreshCw,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { QuestService } from "@/lib/services";

interface UserMetricsData {
  date: string;
  count: string | number;
  direct?: string | number;
  referred_by_users?: string | number;
  referred_by_partners?: string | number;
}

interface WeeklyMetricsData {
  count: string;
  week_start: string;
  week_end: string;
  direct?: string | number;
  referred_by_users?: string | number;
  referred_by_partners?: string | number;
}

interface UserMetricsResponse {
  success: boolean;
  data: UserMetricsData[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, entry: any) => sum + (entry.value || 0),
      0
    );

    return (
      <div className="bg-background border-2 border-dashed border-border rounded-lg p-3 shadow-lg">
        <p className="font-mono font-semibold mb-2 text-sm">{label}</p>
        <p className="font-mono text-xs mb-2 text-muted-foreground">
          Total: <span className="font-bold text-foreground">{total}</span>
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-mono text-xs">{entry.name}:</span>
              </div>
              <span className="font-mono text-xs font-semibold">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function UserMetrics() {
  const { data: session } = useSession();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [metricsData, setMetricsData] = useState<UserMetricsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("bar");
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [shouldRefetch, setShouldRefetch] = useState(false);

  // Fetch metrics data
  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (viewMode === "daily") {
        const data = await QuestService.getUserMetricsPerDay(
          startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          session?.user?.token
        );

        if (data.success) {
          // Transform data to ensure all values are numbers
          const transformedData = data.data.map((item: UserMetricsData) => ({
            date: item.date,
            count:
              typeof item.count === "string"
                ? parseInt(item.count, 10)
                : item.count,
            direct:
              typeof item.direct === "string"
                ? parseInt(item.direct, 10)
                : item.direct || 0,
            referred_by_users:
              typeof item.referred_by_users === "string"
                ? parseInt(item.referred_by_users, 10)
                : item.referred_by_users || 0,
            referred_by_partners:
              typeof item.referred_by_partners === "string"
                ? parseInt(item.referred_by_partners, 10)
                : item.referred_by_partners || 0,
          }));
          setMetricsData(transformedData);
        } else {
          setError("Failed to fetch user metrics");
        }
      } else {
        // Fetch weekly data
        const data = await QuestService.getUserMetricsPerWeek(
          startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          session?.user?.token
        );

        if (data.success) {
          // Transform weekly data to match the chart format
          const transformedData = data.data.map((item: WeeklyMetricsData) => {
            // Format dates to be more readable (e.g., "Sep 15-21")
            const startDate = new Date(item.week_start);
            const endDate = new Date(item.week_end);
            const startMonth = format(startDate, "MMM");
            const endMonth = format(endDate, "MMM");
            const startDay = format(startDate, "d");
            const endDay = format(endDate, "d");

            // If same month, show "Sep 15-21", otherwise "Sep 29 - Oct 5"
            const dateLabel =
              startMonth === endMonth
                ? `${startMonth} ${startDay}-${endDay}`
                : `${startMonth} ${startDay} - ${endMonth} ${endDay}`;

            return {
              date: dateLabel,
              count:
                typeof item.count === "string"
                  ? parseInt(item.count, 10)
                  : item.count,
              direct:
                typeof item.direct === "string"
                  ? parseInt(item.direct, 10)
                  : item.direct || 0,
              referred_by_users:
                typeof item.referred_by_users === "string"
                  ? parseInt(item.referred_by_users, 10)
                  : item.referred_by_users || 0,
              referred_by_partners:
                typeof item.referred_by_partners === "string"
                  ? parseInt(item.referred_by_partners, 10)
                  : item.referred_by_partners || 0,
            };
          });
          // Reverse the array to show oldest to newest (left to right)
          setMetricsData(transformedData.reverse());
        } else {
          setError("Failed to fetch user metrics");
        }
      }
    } catch (err: any) {
      console.error("Error fetching user metrics:", err);
      setError(err.message || "An error occurred while fetching metrics");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data on mount and when viewMode changes
  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Refetch when shouldRefetch is triggered
  useEffect(() => {
    if (shouldRefetch) {
      fetchMetrics();
      setShouldRefetch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRefetch]);

  // Export data as CSV
  const exportToCSV = () => {
    if (metricsData.length === 0) return;

    const headers = [
      "Date",
      "Total Users",
      "Direct",
      "User Referrals",
      "Partner Referrals",
    ];

    const rows = metricsData.map((item) => [
      item.date,
      item.count,
      item.direct || 0,
      item.referred_by_users || 0,
      item.referred_by_partners || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-metrics-${viewMode}-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Header and Controls */}
      <Card className="border-2 border-dashed border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-500/20 rounded border border-dashed border-blue-500/40">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <CardTitle className="font-mono">[USER_METRICS]</CardTitle>
              <Badge
                variant="outline"
                className="font-mono border-dashed bg-blue-500/10 text-blue-600 border-blue-500/20"
              >
                ANALYTICS
              </Badge>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === "daily" ? "default" : "outline"}
                onClick={() => setViewMode("daily")}
                className="font-mono"
              >
                Daily View
              </Button>
              <Button
                size="sm"
                variant={viewMode === "weekly" ? "default" : "outline"}
                onClick={() => setViewMode("weekly")}
                className="font-mono"
              >
                Weekly View
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Date Range Filters - Show for both daily and weekly views */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date Picker */}
            <div className="space-y-2">
              <Label className="font-mono text-sm">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Picker */}
            <div className="space-y-2">
              <Label className="font-mono text-sm">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Apply Filter Button */}
            <div className="space-y-2">
              <Label className="font-mono text-sm opacity-0">Action</Label>
              <Button
                onClick={fetchMetrics}
                disabled={isLoading}
                className="w-full font-mono"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Apply Filter
                  </>
                )}
              </Button>
            </div>

            {/* Clear Filter Button */}
            <div className="space-y-2">
              <Label className="font-mono text-sm opacity-0">Clear</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  // Trigger refetch after state updates
                  setShouldRefetch(true);
                }}
                className="w-full font-mono"
              >
                Clear Dates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Visualization */}
      <Card className="border-dashed border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono">
              {viewMode === "daily"
                ? "New Users Per Day"
                : "New Users Per Week"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Chart Type Selector */}
              <div className="flex gap-1 border border-dashed rounded-lg p-1">
                <Button
                  size="sm"
                  variant={chartType === "bar" ? "default" : "ghost"}
                  onClick={() => setChartType("bar")}
                  className="h-8 px-2"
                >
                  Bar
                </Button>
                <Button
                  size="sm"
                  variant={chartType === "line" ? "default" : "ghost"}
                  onClick={() => setChartType("line")}
                  className="h-8 px-2"
                >
                  Line
                </Button>
                <Button
                  size="sm"
                  variant={chartType === "area" ? "default" : "ghost"}
                  onClick={() => setChartType("area")}
                  className="h-8 px-2"
                >
                  Area
                </Button>
              </div>

              {/* Export Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={exportToCSV}
                disabled={metricsData.length === 0}
                className="font-mono border-dashed"
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                {error}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : metricsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground font-mono">
                No data available
              </p>
              <p className="text-sm text-muted-foreground font-mono mt-2">
                Try adjusting your date range or check back later
              </p>
            </div>
          ) : (
            <div className="h-96">
              {chartType === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="date"
                      className="font-mono text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="font-mono text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="direct"
                      stackId="a"
                      fill="#3b82f6"
                      name="Direct"
                    />
                    <Bar
                      dataKey="referred_by_users"
                      stackId="a"
                      fill="#10b981"
                      name="User Referrals"
                    />
                    <Bar
                      dataKey="referred_by_partners"
                      stackId="a"
                      fill="#8b5cf6"
                      name="Partner Referrals"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === "line" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="date"
                      className="font-mono text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="font-mono text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "2px dashed hsl(var(--border))",
                        borderRadius: "8px",
                        fontFamily: "monospace",
                      }}
                      labelStyle={{ fontFamily: "monospace" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="New Users"
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {chartType === "area" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="date"
                      className="font-mono text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="font-mono text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "2px dashed hsl(var(--border))",
                        borderRadius: "8px",
                        fontFamily: "monospace",
                      }}
                      labelStyle={{ fontFamily: "monospace" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="New Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
