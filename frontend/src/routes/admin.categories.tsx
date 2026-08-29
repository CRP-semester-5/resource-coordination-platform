import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesAPI } from "@/api/real";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Resource Categories — ResQ Hub Admin" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll(),
  });

  const categories = Array.isArray(response?.data) ? response.data : (response?.data?.data || []);

  const createMutation = useMutation({
    mutationFn: (data: any) => categoriesAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      setCreating(false);
      setName("");
      setDescription("");
      setUnit("");
    },
    onError: () => {
      toast.error("Failed to create category");
    }
  });

  const filtered = categories.filter((c: any) =>
    search === "" ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader 
        title="Resource Categories" 
        description="Manage global resource categories for the platform." 
        actions={
          <Button onClick={() => setCreating(true)}>Create Category</Button>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search categories by name or description..."
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No categories found." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit of Measure</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.category_id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description || "—"}</TableCell>
                  <TableCell>
                    <span className="bg-muted text-xs px-2 py-1 rounded">{c.unit_of_measure}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Resource Category</DialogTitle>
            <DialogDescription>Define a new resource category that organizations can track in their inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bottled Water" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-unit">Unit of Measure</Label>
              <Input id="cat-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. bottles, boxes, kg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (Optional)</Label>
              <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details about the category..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
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
    </>
  );
}
