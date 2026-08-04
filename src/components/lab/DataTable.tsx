import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, ChevronsUpDown, ChevronUp, ChevronDown, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => unknown;
  cell?: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchableKeys?: (keyof T | string)[];
  pageSize?: number;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  enableExport?: boolean;
  exportFilename?: string;
  dense?: boolean;
  /** Rich empty state shown instead of a plain message when there is no data at all. */
  emptyState?: ReactNode;
  /** When set, the search text is remembered between visits (TRV-14). */
  storageKey?: string;
  /** Enable multi-selection with a bulk actions bar (TRV-13). */
  selectable?: boolean;
  /** Rendered in the bulk bar; receives the currently selected rows. */
  bulkActions?: (rows: T[]) => ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading,
  emptyMessage = "Aucune donnée",
  searchPlaceholder = "Rechercher…",
  searchableKeys,
  pageSize = 25,
  rowKey,
  onRowClick,
  toolbarLeft,
  toolbarRight,
  enableExport = true,
  exportFilename = "export",
  dense = true,
  emptyState,
  storageKey,
  selectable = false,
  bulkActions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!storageKey) return;
    const saved = sessionStorage.getItem(`dt:${storageKey}:q`);
    if (saved) setQuery(saved);
  }, [storageKey]);

  useEffect(() => {
    if (storageKey) sessionStorage.setItem(`dt:${storageKey}:q`, query);
  }, [storageKey, query]);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    const keys = searchableKeys ?? Object.keys(data[0] ?? {});
    return data.filter((row) =>
      keys.some((k) => {
        const v = row[k as string];
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [data, query, searchableKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const acc = col.accessor ?? ((r: T) => r[sort.key]);
    return [...filtered].sort((a, b) => {
      const va = acc(a);
      const vb = acc(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return sort.dir === "asc" ? va - vb : vb - va;
      }
      return sort.dir === "asc"
        ? String(va).localeCompare(String(vb), "fr")
        : String(vb).localeCompare(String(va), "fr");
    });
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (key: string) => {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const exportCSV = () => {
    const headers = columns.map((c) => c.header);
    const rows = sorted.map((row) =>
      columns.map((c) => {
        const v = c.accessor ? c.accessor(row) : row[c.key];
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return /[,;"\n]/.test(s) ? `"${s}"` : s;
      }),
    );
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-xs"
            />
          </div>
          {toolbarLeft}
        </div>
        <div className="flex items-center gap-2">
          {toolbarRight}
          {enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="h-8 gap-1.5 text-xs"
              disabled={sorted.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
        </div>
      </div>

      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <span className="font-medium text-foreground">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {bulkActions?.(sorted.filter((r) => selected.has(rowKey(r))))}
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelected(new Set())}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="max-h-[calc(100vh-16rem)] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted/95 backdrop-blur">
              <tr>
                {selectable && (
                  <th className="w-9 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      className="h-3.5 w-3.5 accent-[var(--primary)]"
                      checked={paginated.length > 0 && paginated.every((r) => selected.has(rowKey(r)))}
                      onChange={(e) => {
                        const next = new Set(selected);
                        paginated.forEach((r) => (e.target.checked ? next.add(rowKey(r)) : next.delete(rowKey(r))));
                        setSelected(next);
                      }}
                    />
                  </th>
                )}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                      c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                      c.sortable !== false && "cursor-pointer select-none hover:text-foreground",
                      c.className,
                    )}
                    style={c.width ? { width: c.width } : undefined}
                    onClick={() => c.sortable !== false && handleSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable !== false && (
                        <SortIcon dir={sort?.key === c.key ? sort.dir : null} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {selectable && <td className="px-3" />}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-3", dense ? "py-2" : "py-3")}>
                        <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                    {emptyState && !query ? (
                      <div className="p-4">{emptyState}</div>
                    ) : (
                      <div className="px-3 py-12 text-center text-sm text-muted-foreground">
                        {query ? `Aucun résultat pour « ${query} »` : emptyMessage}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border/40 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/40",
                    )}
                  >
                    {selectable && (
                      <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="Sélectionner la ligne"
                          className="h-3.5 w-3.5 accent-[var(--primary)]"
                          checked={selected.has(rowKey(row))}
                          onChange={(e) => {
                            const next = new Set(selected);
                            e.target.checked ? next.add(rowKey(row)) : next.delete(rowKey(row));
                            setSelected(next);
                          }}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 align-middle",
                          dense ? "py-1.5" : "py-2.5",
                          c.align === "right" ? "text-right text-numeric" : c.align === "center" ? "text-center" : "text-left",
                          c.className,
                        )}
                      >
                        {c.cell ? c.cell(row) : (c.accessor ? String(c.accessor(row) ?? "") : String(row[c.key] ?? ""))}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading ? (
            "Chargement…"
          ) : (
            <>
              {sorted.length} ligne{sorted.length > 1 ? "s" : ""}
              {query && ` (filtré sur ${data.length})`}
            </>
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Préc.
            </Button>
            <span className="px-2 text-numeric">
              {safePage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Suiv.
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  if (dir === "asc") return <ChevronUp className="h-3 w-3" />;
  if (dir === "desc") return <ChevronDown className="h-3 w-3" />;
  return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
}
