"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Users, TrendingUp } from "lucide-react";
import { QuestService } from "@/lib/services";

interface AcquisitionData {
  total: number;
  direct: number;
  user_referral: number;
  partner_referral: number;
  percentages: {
    direct: string;
    user_referral: string;
    partner_referral: string;
  };
}

const COLORS = {
  direct: "#3b82f6", // blue
  user_referral: "#10b981", // green
  partner_referral: "#8b5cf6", // purple
};

export function UserAcquisition() {
  const { data: session } = useSession();
  const [acquisitionData, setAcquisitionData] = useState<AcquisitionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch acquisition data
  const fetchAcquisitionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await QuestService.getUserAcquisitionMetrics(
        session?.user?.token
      );

      if (data.success) {
        setAcquisitionData(data.data);
      } else {
        setError("Failed to fetch acquisition metrics");
      }
    } catch (err: any) {
      console.error("Error fetching acquisition metrics:", err);
      setError(err.message || "An error occurred while fetching metrics");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchAcquisitionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transform data for pie chart
  const chartData = acquisitionData
    ? [
        {
          name: "Direct",
          value: acquisitionData.direct,
          percentage: acquisitionData.percentages.direct,
        },
        {
          name: "User Referral",
          value: acquisitionData.user_referral,
          percentage: acquisitionData.percentages.user_referral,
        },
        {
          name: "Partner Referral",
          value: acquisitionData.partner_referral,
          percentage: acquisitionData.percentages.partner_referral,
        },
      ]
    : [];

  // Custom label for pie chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-mono text-sm font-bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-dashed border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-purple-500/20 rounded border border-dashed border-purple-500/40">
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <CardTitle className="font-mono">[USER_ACQUISITION]</CardTitle>
              <Badge
                variant="outline"
                className="font-mono border-dashed bg-purple-500/10 text-purple-600 border-purple-500/20"
              >
                SOURCES
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-dashed border-red-500/50 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-red-600 font-mono text-sm">[ERROR] {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-dashed border-border/50">
          <CardContent className="pt-6">
            <p className="text-muted-foreground font-mono text-sm text-center">
              Loading acquisition data...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {acquisitionData && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card className="border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {acquisitionData.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Direct */}
          <Card className="border-dashed border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-blue-600">
                Direct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-blue-600">
                {acquisitionData.direct.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {acquisitionData.percentages.direct}%
              </p>
            </CardContent>
          </Card>

          {/* User Referral */}
          <Card className="border-dashed border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-green-600">
                User Referral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-green-600">
                {acquisitionData.user_referral.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {acquisitionData.percentages.user_referral}%
              </p>
            </CardContent>
          </Card>

          {/* Partner Referral */}
          <Card className="border-dashed border-purple-500/30 bg-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-purple-600">
                Partner Referral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-purple-600">
                {acquisitionData.partner_referral.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {acquisitionData.percentages.partner_referral}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pie Chart */}
      {acquisitionData && !isLoading && (
        <Card className="border-dashed border-border/50">
          <CardHeader>
            <CardTitle className="font-mono">Acquisition Sources Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Direct"
                          ? COLORS.direct
                          : entry.name === "User Referral"
                          ? COLORS.user_referral
                          : COLORS.partner_referral
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-mono text-sm font-semibold">
                            {data.name}
                          </p>
                          <p className="font-mono text-sm text-muted-foreground">
                            Users: {data.value.toLocaleString()}
                          </p>
                          <p className="font-mono text-sm text-muted-foreground">
                            Percentage: {data.percentage}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="font-mono text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default UserAcquisition;

