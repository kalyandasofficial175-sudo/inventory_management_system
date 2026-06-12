"use client";

import { useEffect, useState } from "react";
import { Package, Users, AlertTriangle, TrendingUp, ArrowUpDown } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StockByCategoryChart,
  TransactionsOverTimeChart,
} from "@/components/DashboardCharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, getTxTypeBadgeColor } from "@/lib/utils";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <div>Failed to load dashboard</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          description="Unique SKUs in system"
        />
        <ReportCard
          title="Total Stock Units"
          value={stats.totalStock.toLocaleString()}
          icon={TrendingUp}
          description="Across all categories"
        />
        <ReportCard
          title="Low Stock Alerts"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          description="Items below threshold"
          className={stats.lowStockCount > 0 ? "border-yellow-300" : ""}
          iconColor={stats.lowStockCount > 0 ? "text-yellow-600" : "text-primary"}
        />
        <ReportCard
          title="Active Users"
          value={stats.totalUsers}
          icon={Users}
          description="All system users"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <StockByCategoryChart data={stats.stockByCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transactions — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsOverTimeChart data={stats.transactionsOverTime} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(tx.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTxTypeBadgeColor(tx.type)}`}>
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{tx.product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tx.product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{tx.quantity}</TableCell>
                  <TableCell className="text-sm">{tx.user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tx.note ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
