"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileBarChart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, getTxTypeBadgeColor } from "@/lib/utils";
import type { UserWithCount, ProductWithUser, TransactionWithDetails } from "@/types";

export default function ReportsPage() {
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<(ProductWithUser | TransactionWithDetails)[]>([]);
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers).catch(() => {});
  }, []);

  function buildQuery(type: string) {
    const params = new URLSearchParams({ type });
    if (userId) params.set("userId", userId);
    if (category) params.set("category", category);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return params.toString();
  }

  async function fetchReport(type: string) {
    activeTabRef.current = type;
    setLoading(true);
    setData([]);
    try {
      const res = await fetch(`/api/reports?${buildQuery(type)}`);
      const json = await res.json();
      if (activeTabRef.current === type) {
        setData(Array.isArray(json) ? json : []);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  // reset data immediately on tab change, then fetch
  useEffect(() => {
    setData([]);
    setLoading(true);
    fetchReport(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function handleExport() {
    if (!["stock", "movement"].includes(activeTab)) return;
    window.open(`/api/export?${buildQuery(activeTab)}`, "_blank");
  }

  const canExport = ["stock", "movement"].includes(activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            Reports
          </h1>
          <p className="text-muted-foreground">View and export inventory reports</p>
        </div>
        {canExport && (
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">User</Label>
              <Select value={userId || "all"} onValueChange={(v) => setUserId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Input placeholder="e.g. Grains" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={() => fetchReport(activeTab)}>
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="movement">Stock Movement</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Stock Levels */}
        <TabsContent value="stock">
          <Card>
            <CardContent className="pt-4">
              {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as ProductWithUser[]).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                        <TableCell className="text-center">
                          {p.quantity} <span className="text-xs text-muted-foreground">{p.unit}</span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {p.minThreshold} <span className="text-xs">{p.unit}</span>
                        </TableCell>
                        <TableCell>
                          {p.quantity === 0
                            ? <Badge variant="destructive">Out of Stock</Badge>
                            : p.quantity <= p.minThreshold
                            ? <Badge variant="warning">Low Stock</Badge>
                            : <Badge variant="success">In Stock</Badge>}
                        </TableCell>
                        <TableCell className="text-sm">{p.user?.name}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && data.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movement */}
        <TabsContent value="movement">
          <Card>
            <CardContent className="pt-4">
              {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (
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
                    {(data as TransactionWithDetails[]).filter((t) => t.product && t.user).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(t.createdAt)}</TableCell>
                        <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${getTxTypeBadgeColor(t.type)}`}>{t.type}</span></TableCell>
                        <TableCell className="font-medium">{t.product.name}</TableCell>
                        <TableCell><Badge variant="secondary">{t.product.category}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">{t.quantity}</TableCell>
                        <TableCell className="text-sm">{t.user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.note ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && data.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock */}
        <TabsContent value="lowstock">
          <Card>
            <CardContent className="pt-4">
              {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Current Qty</TableHead>
                      <TableHead className="text-center">Threshold</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as ProductWithUser[]).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                        <TableCell className="text-center font-semibold text-red-600">
                          {p.quantity} <span className="text-xs font-normal text-muted-foreground">{p.unit}</span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {p.minThreshold} <span className="text-xs">{p.unit}</span>
                        </TableCell>
                        <TableCell className="text-sm">{p.user?.name}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && data.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No low stock items</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-4">
              {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as TransactionWithDetails[]).filter((t) => t.product && t.user).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(t.createdAt)}</TableCell>
                        <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${getTxTypeBadgeColor(t.type)}`}>{t.type}</span></TableCell>
                        <TableCell className="font-medium">{t.product.name}</TableCell>
                        <TableCell className="text-right font-semibold">{t.quantity}</TableCell>
                        <TableCell className="text-sm">{t.user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.note ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && data.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No activity</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
