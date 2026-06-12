"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { ProductWithUser } from "@/types";

interface StockUpdateFormProps {
  products: ProductWithUser[];
  onSuccess: () => void;
}

const txTypes = [
  { value: "IN", label: "Stock In", description: "Receiving new stock", color: "text-green-600" },
  { value: "OUT", label: "Stock Out", description: "Dispatching stock", color: "text-blue-600" },
  { value: "ADJUST", label: "Adjustment", description: "Manual correction (+ or -)", color: "text-yellow-600" },
  { value: "DAMAGED", label: "Damaged", description: "Write off damaged goods", color: "text-red-600" },
];

export function StockUpdateForm({ products, onSuccess }: StockUpdateFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    type: "IN",
    quantity: "",
    note: "",
  });

  const selectedProduct = products.find((p) => p.id === form.productId);
  const selectedUnit = selectedProduct?.unit ?? "pcs";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return;

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          type: form.type,
          quantity: parseFloat(form.quantity),
          note: form.note || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update stock");

      toast({
        title: "Stock updated",
        description: `${selectedProduct?.name} updated successfully.`,
      });
      setForm({ productId: "", type: "IN", quantity: "", note: "" });
      onSuccess();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Product</Label>
        <Select
          value={form.productId}
          onValueChange={(v) => setForm({ ...form, productId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a product..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-muted-foreground text-xs">
                  [{p.sku}] — {p.quantity} in stock
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">{selectedProduct.name}</p>
          <p className="text-muted-foreground">
            Category: {selectedProduct.category} • Current stock:{" "}
            <span
              className={cn(
                "font-semibold",
                selectedProduct.quantity <= selectedProduct.minThreshold
                  ? "text-red-600"
                  : "text-green-600"
              )}
            >
              {selectedProduct.quantity}
            </span>
            {" "}{selectedUnit}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {txTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm({ ...form, type: t.value })}
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                form.type === t.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
            >
              <span className={cn("text-sm font-semibold", t.color)}>{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">
          Quantity ({selectedUnit})
          {form.type === "ADJUST" && (
            <span className="text-muted-foreground ml-1">(use negative for reduction)</span>
          )}
        </Label>
        <Input
          id="quantity"
          type="number"
          step="0.001"
          min={form.type === "ADJUST" ? undefined : 0}
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          placeholder={form.type === "ADJUST" ? `e.g. 5.5 or -3.2 ${selectedUnit}` : `Enter quantity in ${selectedUnit}`}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Add a note or reason..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !form.productId}>
        {loading ? "Processing..." : "Submit Update"}
      </Button>
    </form>
  );
}
