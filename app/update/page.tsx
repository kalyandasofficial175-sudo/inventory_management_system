"use client";

import { useCallback, useEffect, useState } from "react";
import { StockUpdateForm } from "@/components/StockUpdateForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductWithUser } from "@/types";

export default function UpdateStockPage() {
  const [products, setProducts] = useState<ProductWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/stock");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Update Stock</h1>
        <p className="text-muted-foreground">Record a stock movement for your products</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Movement</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          ) : (
            <StockUpdateForm products={products} onSuccess={fetchProducts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
