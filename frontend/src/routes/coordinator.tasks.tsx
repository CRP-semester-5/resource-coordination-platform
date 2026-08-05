import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { tasksAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/coordinator/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — ResQ Hub Coordinator" },
    ],
  }),
  component: TasksPage,
});

const PAGE_SIZE = 8;
const STATUSES = ["UNASSIGNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function TasksPage() {
  const { orgId } = useOrganization();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: () => tasksAPI.getAll(),
  });

  const tasks = response?.data?.data || [];

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t: any) =>
          (status === "all" || t.status === status) &&
          (priority === "all" || t.priority === priority) &&
          (search === "" ||
            [t.title, t.description, t.required_skill]
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [tasks, status, priority, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader title="Tasks" description={`Manage ${tasks.length} task${tasks.length === 1 ? "" : "s"} for your organization.`} />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search tasks by title, description or skill..."
        filters={[
          { label: "Status", value: status, options: STATUSES, onChange: (v) => { setStatus(v); setPage(1); } },
          { label: "Priority", value: priority, options: PRIORITIES, onChange: (v) => { setPriority(v); setPage(1); } },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="No tasks match the current search filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Skill Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignees</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t: any) => (
                <TableRow key={t.task_id}>
                  <TableCell className="font-medium">
                    <span className="block">{t.title}</span>
                    <span className="block text-xs text-muted-foreground truncate max-w-xs">{t.description}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                      {t.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.required_skill || "None"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={t.status.replace("_", " ")} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.task_assignments?.length || 0}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={current === pageCount} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
