"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AlertProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  severity: "critical" | "high" | "medium";
  user: { name: string };
}

const severityConfig = {
  critical: { label: "Out of Stock", className: "bg-red-100 text-red-700 border-red-200" },
  high:     { label: "Critically Low", className: "bg-orange-100 text-orange-700 border-orange-200" },
  medium:   { label: "Low Stock", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const critical = alerts.filter((a) => a.severity === "critical");
  const high     = alerts.filter((a) => a.severity === "high");
  const medium   = alerts.filter((a) => a.severity === "medium");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          Stock Alerts
        </h1>
        <p className="text-muted-foreground">Products that need restocking</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Out of Stock</p>
            <p className="text-3xl font-bold text-red-600">{loading ? "—" : critical.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Critically Low</p>
            <p className="text-3xl font-bold text-orange-600">{loading ? "—" : high.length}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-3xl font-bold text-yellow-600">{loading ? "—" : medium.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            All Alerts ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No stock alerts — all products are sufficiently stocked.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Current Stock</TableHead>
                  <TableHead className="text-center">Min Threshold</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const cfg = severityConfig[alert.severity];
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell className="font-mono text-xs">{alert.sku}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{alert.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-red-600">
                        {alert.quantity} <span className="text-xs font-normal text-muted-foreground">{alert.unit}</span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {alert.minThreshold} <span className="text-xs">{alert.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm">{alert.user?.name ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
