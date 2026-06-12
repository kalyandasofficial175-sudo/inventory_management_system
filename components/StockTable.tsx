"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, AlertTriangle, Search } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { ProductWithUser } from "@/types";

interface StockTableProps {
  products: ProductWithUser[];
  showUser?: boolean;
  showActions?: boolean;
  onEdit?: (product: ProductWithUser) => void;
  onDelete?: (product: ProductWithUser) => void;
}

export function StockTable({
  products,
  showUser = false,
  showActions = false,
  onEdit,
  onDelete,
}: StockTableProps) {
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-center">Threshold</TableHead>
              <TableHead>Status</TableHead>
              {showUser && <TableHead>Assigned To</TableHead>}
              <TableHead>Added</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showUser ? (showActions ? 9 : 8) : showActions ? 8 : 7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => {
                const isLow = product.quantity <= product.minThreshold;
                const isCritical = product.quantity === 0;
                return (
                  <TableRow key={product.id} className={cn(isCritical && "bg-red-50/50")}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "font-semibold",
                          isCritical && "text-red-600",
                          isLow && !isCritical && "text-yellow-600"
                        )}
                      >
                        {product.quantity}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">{product.unit ?? "pcs"}</span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {product.minThreshold}
                      <span className="ml-1 text-xs">{product.unit ?? "pcs"}</span>
                    </TableCell>
                    <TableCell>
                      {isCritical ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Out of Stock
                        </Badge>
                      ) : isLow ? (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </TableCell>
                    {showUser && (
                      <TableCell className="text-sm">{product.user?.name}</TableCell>
                    )}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(product.createdAt)}
                    </TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDelete(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {products.length} products
      </p>
    </div>
  );
}
