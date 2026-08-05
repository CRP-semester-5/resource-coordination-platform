import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterDef {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search...",
  filters = [],
  right,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  filters?: FilterDef[];
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="bg-card pl-9"
        />
      </div>
      {filters.map((f) => (
        <Select key={f.label} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger className="w-44 bg-card">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {right}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-14 text-center">
      <p className="text-sm font-medium">Nothing to show</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
