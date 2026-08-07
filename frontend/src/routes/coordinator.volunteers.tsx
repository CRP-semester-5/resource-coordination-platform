import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { volunteersAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/coordinator/volunteers")({
  head: () => ({
    meta: [
      { title: "Volunteers — ResQ Hub Coordinator" },
    ],
  }),
  component: VolunteersPage,
});

const PAGE_SIZE = 8;

function VolunteersPage() {
  const { orgId } = useOrganization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ["volunteers", orgId],
    queryFn: () => volunteersAPI.getAll(),
  });

  const volunteers = response?.data?.data || [];

  const filtered = useMemo(
    () =>
      volunteers.filter(
        (v: any) =>
          search === "" ||
          [v.users?.name, v.users?.email, v.phone_number]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [volunteers, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader title="Volunteers" description={`${volunteers.length} volunteer${volunteers.length === 1 ? "" : "s"} registered.`} />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by name, email or phone"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="No volunteers match the current search." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v: any) => (
                <TableRow key={v.volunteer_id}>
                  <TableCell className="font-medium">{v.users?.name}</TableCell>
                  <TableCell>
                    <span className="block">{v.users?.email}</span>
                    <span className="block text-xs text-muted-foreground">{v.phone_number || "No phone"}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={v.is_available ? "Available" : "Unavailable"} />
                  </TableCell>
                  <TableCell>
                    {v.volunteer_skills?.length > 0 
                      ? v.volunteer_skills.map((s: any) => s.skill_name).join(", ")
                      : <span className="text-muted-foreground italic text-xs">No skills listed</span>}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString()}
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
