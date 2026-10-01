import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Search,
  Layers,
  Calendar,
  Sparkles,
  Package,
} from "lucide-react";
import { categoriesAPI } from "@/api/real";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Resource Categories — ResQ Hub Admin" },
      {
        name: "description",
        content:
          "Manage standardized relief resource categories and measurement units across the platform.",
      },
    ],
  }),
  component: CategoriesPage,
});

interface Category {
  category_id: string;
  name: string;
  unit_of_measure: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

function CategoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");

  // Create Modal
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");

  // Edit Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Delete Alert
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  /* ── Query ── */
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesAPI.getAll();
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      unit_of_measure: string;
      description?: string | undefined;
    }) => categoriesAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Resource category created successfully!");
      setCreating(false);
      setName("");
      setDescription("");
      setUnit("");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create category.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; unit_of_measure: string; description?: string | undefined };
    }) => categoriesAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully!");
      setEditingCategory(null);
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update category.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted.");
      setDeletingCategory(null);
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete category.");
    },
  });

  /* ── Units of Measure List ── */
  const distinctUnits = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.unit_of_measure) set.add(c.unit_of_measure.toLowerCase().trim());
    });
    return Array.from(set).sort();
  }, [categories]);

  /* ── Filtered Categories ── */
  const filtered = useMemo(() => {
    return categories.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        c.unit_of_measure.toLowerCase().includes(q);

      const matchesUnit =
        selectedUnit === "ALL" ||
        c.unit_of_measure.toLowerCase().trim() === selectedUnit.toLowerCase().trim();

      return matchesSearch && matchesUnit;
    });
  }, [categories, search, selectedUnit]);

  function openEditModal(cat: Category) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditUnit(cat.unit_of_measure);
    setEditDesc(cat.description || "");
  }

  function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory || !editName.trim() || !editUnit.trim()) return;
    updateMutation.mutate({
      id: editingCategory.category_id,
      data: {
        name: editName.trim(),
        unit_of_measure: editUnit.trim(),
        description: editDesc.trim() || undefined,
      },
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Resource Categories"
          description="Manage global relief supply categories, unit standards, and inventory classifications."
        />
        <Button
          onClick={() => setCreating(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Create Category</span>
        </Button>
      </div>

      {/* Metric Quick-Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Tag className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {categories.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Standardized Categories
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Global
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Package className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {distinctUnits.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Measurement Units</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Tracked
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                Universal
              </div>
              <div className="text-xs text-muted-foreground font-medium">All Multi-Tenant Hubs</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
            Active
          </span>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Unit Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedUnit("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedUnit === "ALL"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Units ({categories.length})
          </button>
          {distinctUnits.map((u) => {
            const count = categories.filter(
              (c) => c.unit_of_measure.toLowerCase().trim() === u,
            ).length;
            return (
              <button
                key={u}
                type="button"
                onClick={() => setSelectedUnit(u)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap capitalize ${
                  selectedUnit === u
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {u} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories or units..."
            className="pl-8 text-xs h-9 bg-card"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState message="No resource categories match your filter or search query." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="py-3 px-4 font-semibold text-xs">Category Name</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs">Description</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs">Unit of Measure</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs">Created Date</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => (
                <TableRow key={cat.category_id} className="hover:bg-muted/20 transition-colors">
                  {/* Name */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                        <Tag className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{cat.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {cat.category_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="py-3.5 px-4 text-xs text-muted-foreground max-w-sm">
                    <p className="line-clamp-2 leading-relaxed">
                      {cat.description || (
                        <span className="italic text-muted-foreground/60">
                          No description provided
                        </span>
                      )}
                    </p>
                  </TableCell>

                  {/* Unit of Measure Badge */}
                  <TableCell className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
                      {cat.unit_of_measure}
                    </span>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="py-3.5 px-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground/70" />
                      <span>
                        {cat.created_at
                          ? new Date(cat.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions (Edit & Delete) */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(cat)}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                        title="Edit Category"
                      >
                        <Pencil className="size-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCategory(cat)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                        title="Delete Category"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Category Modal */}
      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Tag className="size-5" />
              Create Resource Category
            </DialogTitle>
            <DialogDescription>
              Define a new standardized emergency relief category that all organizations can stock
              in warehouse inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs">
                Category Name *
              </Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tarpaulins, First Aid Kits, Dry Rations"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-unit" className="text-xs">
                Unit of Measure *
              </Label>
              <Input
                id="cat-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. boxes, packets, units, kg, litres, kits"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-xs">
                Description (Optional)
              </Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed guidance on items encompassed by this relief category..."
                className="text-xs resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!name.trim() || !unit.trim() || createMutation.isPending}
              onClick={() => {
                createMutation.mutate({
                  name: name.trim(),
                  description: description.trim() || undefined,
                  unit_of_measure: unit.trim(),
                });
              }}
            >
              {createMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={!!editingCategory} onOpenChange={(o) => !o && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Pencil className="size-5" />
              Edit Resource Category
            </DialogTitle>
            <DialogDescription>
              Update the specifications and measurement unit for{" "}
              <strong>{editingCategory?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs">
                Category Name *
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-unit" className="text-xs">
                Unit of Measure *
              </Label>
              <Input
                id="edit-unit"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-xs">
                Description (Optional)
              </Label>
              <Textarea
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="text-xs resize-none h-20"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingCategory(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!editName.trim() || !editUnit.trim() || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(o) => !o && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCategory?.name}</strong>? This
              category will be removed from future inventory additions across organizations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingCategory) {
                  deleteMutation.mutate(deletingCategory.category_id);
                }
              }}
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
