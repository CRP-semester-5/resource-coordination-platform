import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Boxes, 
  CheckCircle2, 
  History, 
  Layers, 
  Package, 
  PackagePlus, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Share2 
} from "lucide-react";
import { inventoryAPI, categoriesAPI, requestsAPI } from "@/api/real";
import type { InventoryItem } from "@/api/types";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/coordinator/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — ResQ Hub Coordinator" },
      { name: "description", content: "Real-time stock ledger, donation auto-credits, and aid dispatch audit trail." },
      { property: "og:title", content: "Inventory — ResQ Hub Coordinator" },
      { property: "og:description", content: "Real-time relief stock levels and transaction movements across warehouses." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { orgId } = useOrganization();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [txFilter, setTxFilter] = useState("all");
  const [restocking, setRestocking] = useState<InventoryItem | null>(null);
  const [allocating, setAllocating] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newQty, setNewQty] = useState("");

  // 1. Categories
  const { data: categoriesRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll(),
  });
  const allCategories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : (categoriesRes?.data?.data || []);

  // 2. Approved Requests for Manual Allocation
  const { data: requestsRes } = useQuery({
    queryKey: ["requests", orgId],
    queryFn: () => requestsAPI.getAll(),
    enabled: !!orgId,
  });
  const allRequests = Array.isArray(requestsRes?.data) ? requestsRes.data : (requestsRes?.data?.data || []);
  const approvedRequests = useMemo(() => {
    return allRequests.filter((r: any) => 
      (r.status === "VERIFIED" || r.status === "IN_PROGRESS") && r.organization_id === orgId
    );
  }, [allRequests, orgId]);

  // 3. Live Inventory Query
  const { data: itemsRaw = [], isLoading: isLoadingInventory } = useQuery({ 
    queryKey: ["inventory", orgId], 
    queryFn: async () => {
      const res = await inventoryAPI.getAll();
      return res.data?.data ?? res.data ?? [];
    }
  });

  // 4. Inventory Transactions / Audit Log Query
  const { data: txRaw = [], isLoading: isLoadingTx, isFetching: isFetchingTx } = useQuery({
    queryKey: ["inventory_transactions", orgId],
    queryFn: async () => {
      const res = await inventoryAPI.getTransactions();
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!orgId,
    refetchInterval: 8000,
  });

  const items: InventoryItem[] = useMemo(() => {
    return (itemsRaw || []).map((i: any) => ({
      id: i.inventory_id,
      resource: i.resource_categories?.name || "General Resource",
      category: i.resource_categories?.name || "General",
      available: i.quantity || 0,
      reserved: 0,
      allocated: 0,
      warehouse: "Central Warehouse",
      expiryDate: null,
      minThreshold: 50,
      unit: i.resource_categories?.unit_of_measure || "units",
    }));
  }, [itemsRaw]);

  // Filtered Stock Table
  const filteredStock = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch = 
        i.resource.toLowerCase().includes(search.toLowerCase()) || 
        i.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || i.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  // Metrics
  const totalStockUnits = useMemo(() => items.reduce((acc, curr) => acc + (curr.available || 0), 0), [items]);
  const lowStockCount = useMemo(() => items.filter((i) => i.available < i.minThreshold).length, [items]);
  const categoriesInStock = useMemo(() => items.filter((i) => i.available > 0).length, [items]);

  // Filtered Transactions
  const filteredTx = useMemo(() => {
    const list = Array.isArray(txRaw) ? txRaw : [];
    return list.filter((tx: any) => {
      if (txFilter === "all") return true;
      if (txFilter === "STOCK_IN") return tx.transaction_type === "STOCK_IN";
      if (txFilter === "STOCK_OUT") return tx.transaction_type === "STOCK_OUT";
      return true;
    });
  }, [txRaw, txFilter]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["inventory", orgId] });
    qc.invalidateQueries({ queryKey: ["inventory_transactions", orgId] });
    qc.invalidateQueries({ queryKey: ["dashboard", orgId] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const restock = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => inventoryAPI.restock(id, quantity),
    onSuccess: () => { 
      invalidate(); 
      toast.success("Stock updated successfully"); 
    },
    onError: (err: any) => toast.error(err.message || "Failed to restock"),
  });

  const allocate = useMutation({
    mutationFn: async ({ id, quantity, code }: { id: string; quantity: number; code: string }) => {
      return inventoryAPI.allocate(id, quantity, code);
    },
    onSuccess: () => { 
      invalidate(); 
      toast.success("Stock allocated successfully"); 
    },
    onError: (err: any) => toast.error(err.message || "Failed to allocate stock"),
  });

  const addMutation = useMutation({
    mutationFn: ({ category_id, quantity }: { category_id: string; quantity: number }) =>
      inventoryAPI.add(category_id, quantity),
    onSuccess: () => {
      invalidate();
      setIsAdding(false);
      setNewCategory("");
      setNewQty("");
      toast.success("Item added to inventory");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add inventory item"),
  });

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Warehouse Inventory & Stock Ledger"
        description="Live stock tracking, automated donation credits, and aid fulfillment audit ledger."
        actions={
          <Button onClick={() => setIsAdding(true)} className="gap-2 shadow-sm font-semibold">
            <PlusCircle className="size-4" /> Add Inventory Item
          </Button>
        }
      />

      {/* TOP SECTION: METRICS & CATEGORY SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total In-Stock Units</span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalStockUnits.toLocaleString()}</span>
            <span className="ml-1 text-xs text-muted-foreground">available items</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Categories</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">{categoriesInStock}</span>
            <span className="ml-1 text-xs text-muted-foreground">categories in store</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Low Stock Warnings</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {lowStockCount}
            </span>
            <span className="text-xs text-muted-foreground">below threshold (&lt;50)</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Warehouse Facility</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold tracking-tight text-foreground">Central Warehouse</span>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: LIVE STOCK TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Package className="size-5 text-primary" />
              Live Stock on Hand
            </h3>
            <p className="text-xs text-muted-foreground">
              Current inventory balances updated automatically on donation and request completions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {allCategories.map((c: any) => (
                <option key={c.category_id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {isLoadingInventory ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredStock.length === 0 ? (
            <EmptyState message="No inventory items found matching your criteria." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Resource / Category</TableHead>
                  <TableHead className="text-right">Available Stock</TableHead>
                  <TableHead>Warehouse Location</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((i) => {
                  const isLow = i.available < i.minThreshold;
                  const isOut = i.available === 0;
                  return (
                    <TableRow key={i.id} className="hover:bg-muted/20">
                      <TableCell>
                        <span className="block font-semibold text-foreground">{i.resource}</span>
                        <span className="block text-xs text-muted-foreground">{i.category}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-base text-foreground">
                        {i.available.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-muted-foreground">{i.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {i.warehouse}
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="size-3" /> Low Stock (&lt;50)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" /> Available
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 gap-1 text-xs border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => { setQty(""); setRestocking(i); }}
                          >
                            <PackagePlus className="size-3.5" /> Restock
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => { setQty(""); setRequestCode(""); setAllocating(i); }}
                          >
                            <Share2 className="size-3.5" /> Allocate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: REAL-TIME INVENTORY MOVEMENT & AUDIT LOG LEDGER */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Inventory Movement & Transaction Audit Trail
              </h3>
              {isFetchingTx && <RefreshCw className="size-3.5 text-muted-foreground animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Automated ledger tracking stock in-flows (donations/restocks) and out-flows (request deliveries).
            </p>
          </div>

          {/* Filter Pills */}
          <Tabs value={txFilter} onValueChange={setTxFilter} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">All Activity</TabsTrigger>
              <TabsTrigger value="STOCK_IN" className="text-xs text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3 mr-1" /> Stock In
              </TabsTrigger>
              <TabsTrigger value="STOCK_OUT" className="text-xs text-red-600 dark:text-red-400">
                <ArrowDownLeft className="size-3 mr-1" /> Stock Out
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {isLoadingTx ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredTx.length === 0 ? (
            <EmptyState message="No inventory transactions recorded yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Quantity Change</TableHead>
                  <TableHead>Reference Document</TableHead>
                  <TableHead>Activity & Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTx.map((tx: any) => {
                  const isStockIn = tx.transaction_type === "STOCK_IN";
                  const isStockOut = tx.transaction_type === "STOCK_OUT";
                  const resourceName = tx.resources?.resource_name || tx.resources?.category || "Supplies";
                  const unit = tx.resources?.unit || "units";
                  const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleString() : "Just now";

                  return (
                    <TableRow key={tx.transaction_id || tx.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </TableCell>
                      <TableCell>
                        {isStockIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <ArrowUpRight className="size-3" /> STOCK IN
                          </span>
                        ) : isStockOut ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400 border border-red-500/20">
                            <ArrowDownLeft className="size-3" /> STOCK OUT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                            ADJUSTMENT
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground text-sm">{resourceName}</span>
                        {tx.resources?.category && (
                          <span className="block text-xs text-muted-foreground">{tx.resources.category}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-sm">
                        <span className={isStockIn ? "text-emerald-600 dark:text-emerald-400" : isStockOut ? "text-red-600 dark:text-red-400" : "text-foreground"}>
                          {isStockIn ? "+" : isStockOut ? "-" : ""}{tx.quantity?.toLocaleString()} {unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {tx.reference_id ? (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                            {tx.reference_type === "DONATION" ? "#DON-" : tx.reference_type === "REQUEST" ? "#REQ-" : "#"}
                            {tx.reference_id.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual Update</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate">
                        {tx.remarks || "No additional notes"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* RESTOCK DIALOG */}
      <Dialog open={!!restocking} onOpenChange={(o) => !o && setRestocking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restocking?.resource}</DialogTitle>
            <DialogDescription>Add physically received stock into {restocking?.warehouse}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="restock-qty">Quantity ({restocking?.unit})</Label>
            <Input id="restock-qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestocking(null)}>Cancel</Button>
            <Button
              disabled={!Number(qty) || restock.isPending}
              onClick={() => {
                if (restocking) restock.mutate({ id: restocking.id, quantity: Number(qty) });
                setRestocking(null);
              }}
            >
              {restock.isPending ? "Updating..." : "Confirm Restock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALLOCATE DIALOG */}
      <Dialog open={!!allocating} onOpenChange={(o) => !o && setAllocating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate {allocating?.resource}</DialogTitle>
            <DialogDescription>
              {allocating?.available} {allocating?.unit} available in Central Warehouse for allocation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alloc-code">Approved Request</Label>
              <select
                id="alloc-code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={requestCode}
                onChange={(e) => setRequestCode(e.target.value)}
              >
                <option value="">Select an approved request...</option>
                {approvedRequests.map((r: any) => (
                  <option key={r.request_id || r.id} value={r.request_id || r.id}>
                    {r.title || r.category} ({r.quantity_required || r.quantity} {r.unit} needed) - {r.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alloc-qty">Quantity to Allocate ({allocating?.unit})</Label>
              <Input id="alloc-qty" type="number" min={1} max={allocating?.available} value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocating(null)}>Cancel</Button>
            <Button
              disabled={!Number(qty) || requestCode.trim() === "" || allocate.isPending}
              onClick={() => {
                if (allocating) allocate.mutate({ id: allocating.id, quantity: Number(qty), code: requestCode.trim() });
                setAllocating(null);
              }}
            >
              {allocate.isPending ? "Allocating..." : "Confirm Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD INVENTORY ITEM DIALOG */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Log initial relief stock for a resource category into Central Warehouse.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <select
                id="add-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    </div>
  );
}
