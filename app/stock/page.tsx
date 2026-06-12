"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { StockTable } from "@/components/StockTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { ProductWithUser, UserWithCount } from "@/types";

export default function StockPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithUser[]>([]);
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductWithUser | null>(null);
  const UNITS = ["pcs", "kg", "g", "L", "mL", "m", "cm", "box", "pack", "dozen"];

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: "0",
    minThreshold: "10",
    unit: "pcs",
    userId: "",
  });

  const isAdminOrManager = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/stock");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    if (isAdminOrManager) {
      fetch("/api/users").then((r) => r.json()).then(setUsers);
    }
  }, [fetchProducts, isAdminOrManager]);

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: "", sku: "", category: "", quantity: "0", minThreshold: "10", unit: "pcs", userId: "" });
    setDialogOpen(true);
  };

  const openEdit = (product: ProductWithUser) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity.toString(),
      minThreshold: product.minThreshold.toString(),
      unit: product.unit ?? "pcs",
      userId: product.userId,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (product: ProductWithUser) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/stock/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Product deleted" });
      fetchProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      quantity: parseFloat(form.quantity),
      minThreshold: parseFloat(form.minThreshold),
    };

    const res = await fetch(editProduct ? `/api/stock/${editProduct.id}` : "/api/stock", {
      method: editProduct ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: { error?: string } = {};
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
      toast({ variant: "destructive", title: data.error ?? "Failed" });
      return;
    }

    toast({ title: editProduct ? "Product updated" : "Product created" });
    setDialogOpen(false);
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAdminOrManager ? "All Stock" : "My Stock"}</h1>
          <p className="text-muted-foreground">
            {isAdminOrManager ? "Manage all products across all users" : "Your assigned products"}
          </p>
        </div>
        {isAdminOrManager && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      ) : (
        <StockTable
          products={products}
          showUser={isAdminOrManager}
          showActions={isAdminOrManager}
          onEdit={isAdminOrManager ? openEdit : undefined}
          onDelete={isAdminOrManager ? handleDelete : undefined}
        />
      )}

      {isAdminOrManager && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Product Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. Butter Biscuit, Basmati Rice, Wheat Flour, Sunflower Oil"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                    placeholder="e.g. RICE-001, FLOUR-002"
                    disabled={!!editProduct}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                    placeholder="e.g. Grains, Dairy, Spices, Beverages"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={form.unit}
                    onValueChange={(v) => setForm({ ...form, unit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!editProduct && (
                  <div className="space-y-2">
                    <Label>Initial Quantity ({form.unit})</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.001"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Min Threshold ({form.unit})</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.minThreshold}
                    onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Assign to User</Label>
                  <Select
                    value={form.userId}
                    onValueChange={(v) => setForm({ ...form, userId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editProduct ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
