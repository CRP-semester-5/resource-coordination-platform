import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, PackagePlus, Share2 } from "lucide-react";
import { inventoryAPI, categoriesAPI } from "@/api/real";
import type { InventoryItem } from "@/api/types";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/coordinator/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — ResQ Hub Coordinator" },
      { name: "description", content: "Track available, reserved and allocated relief stock with low-stock and expiry alerts." },
      { property: "og:title", content: "Inventory — ResQ Hub Coordinator" },
      { property: "og:description", content: "Real-time relief stock levels across your organization's warehouses." },
    ],
  }),
  component: InventoryPage,
});

const soonMs = 30 * 86_400_000;

function InventoryPage() {
  const { orgId } = useOrganization();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [warehouse, setWarehouse] = useState("all");
  const [restocking, setRestocking] = useState<InventoryItem | null>(null);
  const [allocating, setAllocating] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newQty, setNewQty] = useState("");

  const { data: categoriesRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll(),
  });
  const allCategories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : (categoriesRes?.data?.data || []);

  const { data: itemsRaw = [], isLoading } = useQuery({ 
    queryKey: ["inventory", orgId], 
    queryFn: async () => {
      const res = await inventoryAPI.getAll();
      return res.data?.data ?? res.data ?? [];
    }
  });

  const items: InventoryItem[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return itemsRaw.map((i: any) => ({
      id: i.inventory_id,
      resource: i.resource_categories?.name || "Unknown",
      category: i.resource_categories?.name || "Unknown",
      available: i.quantity,
      reserved: 0, // Not stored in DB currently
      allocated: 0, // Not stored in DB currently
      warehouse: "Central Warehouse", // Hardcoded
      expiryDate: null,
      minThreshold: 50,
      unit: i.resource_categories?.unit_of_measure || "units",
    }));
  }, [itemsRaw]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["inventory", orgId] });
    qc.invalidateQueries({ queryKey: ["dashboard", orgId] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const restock = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => inventoryAPI.restock(id, quantity),
    onSuccess: () => { invalidate(); toast.success("Stock updated"); },
  });
  const allocate = useMutation({
    mutationFn: ({ id, quantity, code }: { id: string; quantity: number; code: string }) =>
      inventoryAPI.allocate(id, quantity, code),
    onSuccess: () => { invalidate(); toast.success("Resources allocated"); },
  });
  const addMutation = useMutation({
    mutationFn: ({ category_id, quantity }: { category_id: string; quantity: number }) =>
      inventoryAPI.add(category_id, quantity),
    onSuccess: () => { 
      invalidate(); 
      toast.success("Item added to inventory"); 
      setIsAdding(false);
      setNewCategory("");
      setNewQty("");
    },
    onError: () => toast.error("Failed to add item to inventory"),
  });

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const warehouses = useMemo(() => [...new Set(items.map((i) => i.warehouse))], [items]);

  const filtered = items.filter(
    (i) =>
      (category === "all" || i.category === category) &&
      (warehouse === "all" || i.warehouse === warehouse) &&
      (search === "" || `${i.resource} ${i.category} ${i.warehouse}`.toLowerCase().includes(search.toLowerCase())),
  );

  const lowStock = items.filter((i) => i.available < i.minThreshold);
  const expiring = items.filter((i) => i.expiryDate && new Date(i.expiryDate).getTime() - Date.now() < soonMs);

  return (
    <>
      <PageHeader 
        title="Inventory" 
        description="Available, reserved and allocated stock across your warehouses." 
        actions={
          <Button onClick={() => setIsAdding(true)}>
            <PackagePlus className="mr-2 size-4" /> Add Item
          </Button>
        }
      />

      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {lowStock.length > 0 && (
            <div className="flex gap-3 rounded-xl border border-status-danger/30 bg-status-danger-muted p-4 text-status-danger-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">{lowStock.length} item(s) below minimum threshold:</span>{" "}
                {lowStock.map((i) => i.resource).join(", ")}
              </p>
            </div>
          )}
          {expiring.length > 0 && (
            <div className="flex gap-3 rounded-xl border border-status-pending/30 bg-status-pending-muted p-4 text-status-pending-foreground">
              <CalendarClock className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">{expiring.length} item(s) expiring within 30 days:</span>{" "}
                {expiring.map((i) => i.resource).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search stock by resource, category or warehouse"
        filters={[
          { label: "Category", value: category, options: categories, onChange: setCategory },
          { label: "Warehouse", value: warehouse, options: warehouses, onChange: setWarehouse },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No stock matches the current filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <span className="block font-medium">{i.resource}</span>
                    <span className="block text-xs text-muted-foreground">{i.category}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{i.available}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{i.reserved}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{i.allocated}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.warehouse}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={i.available < i.minThreshold ? "Critical" : "Available"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setQty(""); setRestocking(i); }}>
                        <PackagePlus className="mr-1 size-3.5" /> Restock
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setQty(""); setRequestCode(""); setAllocating(i); }}>
                        <Share2 className="mr-1 size-3.5" /> Allocate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!restocking} onOpenChange={(o) => !o && setRestocking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restocking?.resource}</DialogTitle>
            <DialogDescription>Add newly received stock to {restocking?.warehouse}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="restock-qty">Quantity ({restocking?.unit})</Label>
            <Input id="restock-qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestocking(null)}>Cancel</Button>
            <Button
              disabled={!Number(qty)}
              onClick={() => {
                if (restocking) restock.mutate({ id: restocking.id, quantity: Number(qty) });
                setRestocking(null);
              }}
            >
              Add stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!allocating} onOpenChange={(o) => !o && setAllocating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate {allocating?.resource}</DialogTitle>
            <DialogDescription>
              {allocating?.available} {allocating?.unit} available for allocation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alloc-code">Request code</Label>
              <Input id="alloc-code" value={requestCode} onChange={(e) => setRequestCode(e.target.value)} placeholder="REQ-2451" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alloc-qty">Quantity ({allocating?.unit})</Label>
              <Input id="alloc-qty" type="number" min={1} max={allocating?.available} value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocating(null)}>Cancel</Button>
            <Button
              disabled={!Number(qty) || requestCode.trim() === ""}
              onClick={() => {
                if (allocating) allocate.mutate({ id: allocating.id, quantity: Number(qty), code: requestCode.trim() });
                setAllocating(null);
              }}
            >
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Log physically received resources into your inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <select
                id="add-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {allCategories.map((c: any) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name} ({c.unit_of_measure})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-qty">Initial Quantity</Label>
              <Input id="add-qty" type="number" min={1} value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button
              disabled={!newCategory || !Number(newQty) || addMutation.isPending}
              onClick={() => addMutation.mutate({ category_id: newCategory, quantity: Number(newQty) })}
            >
              {addMutation.isPending ? "Adding..." : "Add to Inventory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
