import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, ChevronsUpDown, ChevronUp, ChevronDown, Download, Columns3, Rows3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
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
  /** Hidden by default in the column picker (TRV-15). */
  hidden?: boolean;
}

type SortRule = { key: string; dir: "asc" | "desc" };

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
  emptyState?: ReactNode;
  storageKey?: string;
  selectable?: boolean;
  bulkActions?: (rows: T[]) => ReactNode;
  /** Default business sort (TRV-16). If omitted, a `created_at`/date column is sorted newest first. */
  defaultSort?: SortRule[];
}

function cellText<T extends Record<string, any>>(c: Column<T>, row: T): string {
  const v = c.accessor ? c.accessor(row) : row[c.key];
  return v == null ? "" : String(v);
}

function compare(va: unknown, vb: unknown) {
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  if (typeof va === "number" && typeof vb === "number") return va - vb;
  return String(va).localeCompare(String(vb), "fr", { numeric: true });
}

export function DataTable<T extends Record<string, any>>({
  data, columns, loading, emptyMessage = "Aucune donnée", searchPlaceholder = "Rechercher…",
  searchableKeys, pageSize = 25, rowKey, onRowClick, toolbarLeft, toolbarRight,
  enableExport = true, exportFilename = "export", dense: denseProp = true, emptyState,
  storageKey, selectable = false, bulkActions, defaultSort,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dense, setDense] = useState(denseProp);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.hidden).map((c) => c.key)),
  );
  const initialSort = useMemo<SortRule[]>(() => {
    if (defaultSort) return defaultSort;
    const k = columns.find((c) => /created_at|^date/.test(c.key) && c.sortable !== false)?.key;
    return k ? [{ key: k, dir: "desc" }] : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sort, setSort] = useState<SortRule[]>(initialSort);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!storageKey) return;
    const saved = sessionStorage.getItem(`dt:${storageKey}:q`);
    if (saved) setQuery(saved);
    try {
      const prefs = JSON.parse(localStorage.getItem(`dt:${storageKey}:prefs`) ?? "null");
      if (prefs?.hidden) setHiddenCols(new Set(prefs.hidden));
      if (typeof prefs?.dense === "boolean") setDense(prefs.dense);
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey) sessionStorage.setItem(`dt:${storageKey}:q`, query);
  }, [storageKey, query]);

  useEffect(() => {
    if (storageKey)
      localStorage.setItem(`dt:${storageKey}:prefs`, JSON.stringify({ hidden: [...hiddenCols], dense }));
  }, [storageKey, hiddenCols, dense]);

  const visibleCols = columns.filter((c) => !hiddenCols.has(c.key));

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
    if (sort.length === 0) return filtered;
    const rules = sort
      .map((s) => {
        const col = columns.find((c) => c.key === s.key);
        return col ? { acc: col.accessor ?? ((r: T) => r[s.key]), dir: s.dir } : null;
      })
      .filter(Boolean) as { acc: (r: T) => unknown; dir: "asc" | "desc" }[];
    return [...filtered].sort((a, b) => {
      for (const r of rules) {
        const c = compare(r.acc(a), r.acc(b));
        if (c !== 0) return r.dir === "asc" ? c : -c;
      }
      return 0;
    });
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  /** Click = sort on this column only; Shift+click = add as secondary sort. */
  const handleSort = (key: string, additive: boolean) => {
    setSort((s) => {
      const existing = s.find((r) => r.key === key);
      const next: SortRule | null = !existing ? { key, dir: "asc" } : existing.dir === "asc" ? { key, dir: "desc" } : null;
      if (additive) {
        const others = s.filter((r) => r.key !== key);
        return next ? [...others, next] : others;
      }
      return next ? [next] : [];
    });
  };

  const exportRows = () => {
    const rows = selected.size > 0 ? sorted.filter((r) => selected.has(rowKey(r))) : sorted;
    return { rows, cols: visibleCols };
  };

  const download = (content: string, type: string, ext: string) => {
    const blob = new Blob(["\ufeff" + content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const { rows, cols } = exportRows();
    const esc = (s: string) => (/[,;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const csv = [cols.map((c) => esc(c.header)), ...rows.map((r) => cols.map((c) => esc(cellText(c, r))))]
      .map((r) => r.join(";"))
      .join("\n");
    download(csv, "text/csv;charset=utf-8;", "csv");
  };

  const exportExcel = () => {
    const { rows, cols } = exportRows();
    const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html =
      `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">` +
      `<tr>${cols.map((c) => `<th>${h(c.header)}</th>`).join("")}</tr>` +
      rows.map((r) => `<tr>${cols.map((c) => `<td>${h(cellText(c, r))}</td>`).join("")}</tr>`).join("") +
      `</table></body></html>`;
    download(html, "application/vnd.ms-excel", "xls");
  };

  const toggleRow = (row: T, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(rowKey(row)) : next.delete(rowKey(row));
    setSelected(next);
  };

  const renderCell = (c: Column<T>, row: T) => (c.cell ? c.cell(row) : cellText(c, row));

  const emptyBlock =
    emptyState && !query ? (
      <div className="p-4">{emptyState}</div>
    ) : (
      <div className="px-3 py-12 text-center text-sm text-muted-foreground">
        {query ? `Aucun résultat pour « ${query} »` : emptyMessage}
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative min-w-[10rem] max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-xs"
            />
          </div>
          {toolbarLeft}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbarRight}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Affichage">
                <Columns3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Colonnes</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Colonnes visibles</DropdownMenuLabel>
              {columns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  className="text-xs"
                  checked={!hiddenCols.has(c.key)}
                  disabled={!hiddenCols.has(c.key) && visibleCols.length === 1}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(v) => {
                    const next = new Set(hiddenCols);
                    v ? next.delete(c.key) : next.add(c.key);
                    setHiddenCols(next);
                  }}
                >
                  {c.header || c.key}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onSelect={() => setDense((d) => !d)}>
                <Rows3 className="h-3.5 w-3.5" /> Densité : {dense ? "compacte" : "confortable"}
              </DropdownMenuItem>
              {sort.length > 0 && (
                <DropdownMenuItem className="text-xs" onSelect={() => setSort(initialSort)}>
                  Réinitialiser le tri
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {enableExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={sorted.length === 0}>
                  <Download className="h-3.5 w-3.5" />
                  Exporter{selected.size > 0 ? ` (${selected.size})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {selected.size > 0 ? `${selected.size} ligne(s) sélectionnée(s)` : `${sorted.length} ligne(s) affichée(s)`}
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-xs" onSelect={exportCSV}>CSV</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onSelect={exportExcel}>Excel (.xls)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {isMobile ? (
        /* TRV-18 : vue cartes sous 768 px */
        <div className="flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-muted" />)
          ) : paginated.length === 0 ? (
            <div className="rounded-md border border-border bg-card">{emptyBlock}</div>
          ) : (
            paginated.map((row) => {
              const [first, ...rest] = visibleCols;
              return (
                <div
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("rounded-md border border-border bg-card p-3 text-sm", onRowClick && "cursor-pointer active:bg-muted/40")}
                >
                  <div className="mb-2 flex items-start gap-2">
                    {selectable && (
                      <input
                        type="checkbox"
                        aria-label="Sélectionner la ligne"
                        className="mt-1 h-4 w-4 accent-[var(--primary)]"
                        checked={selected.has(rowKey(row))}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => toggleRow(row, e.target.checked)}
                      />
                    )}
                    <div className="min-w-0 flex-1 font-medium">{first && renderCell(first, row)}</div>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    {rest.filter((c) => c.header).map((c) => (
                      <div key={c.key} className="contents">
                        <dt className="text-muted-foreground">{c.header}</dt>
                        <dd className="min-w-0 text-right">{renderCell(c, row)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })
          )}
        </div>
      ) : (
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
                  {visibleCols.map((c) => {
                    const idx = sort.findIndex((s) => s.key === c.key);
                    return (
                      <th
                        key={c.key}
                        className={cn(
                          "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                          c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                          c.sortable !== false && "cursor-pointer select-none hover:text-foreground",
                          c.className,
                        )}
                        style={c.width ? { width: c.width } : undefined}
                        title={c.sortable !== false ? "Cliquer pour trier — Maj+clic pour un tri secondaire" : undefined}
                        onClick={(e) => c.sortable !== false && handleSort(c.key, e.shiftKey)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {c.header}
                          {c.sortable !== false && <SortIcon dir={idx >= 0 ? sort[idx].dir : null} />}
                          {idx >= 0 && sort.length > 1 && <span className="text-[9px] text-primary">{idx + 1}</span>}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {selectable && <td className="px-3" />}
                      {visibleCols.map((c) => (
                        <td key={c.key} className={cn("px-3", dense ? "py-2" : "py-3")}>
                          <div className="h-3 w-full animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length + (selectable ? 1 : 0)} className="p-0">{emptyBlock}</td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr
                      key={rowKey(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn("border-b border-border/40 transition-colors", onRowClick && "cursor-pointer hover:bg-muted/40")}
                    >
                      {selectable && (
                        <td className="px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label="Sélectionner la ligne"
                            className="h-3.5 w-3.5 accent-[var(--primary)]"
                            checked={selected.has(rowKey(row))}
                            onChange={(e) => toggleRow(row, e.target.checked)}
                          />
                        </td>
                      )}
                      {visibleCols.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "px-3 align-middle",
                            dense ? "py-1.5" : "py-2.5",
                            c.align === "right" ? "text-right text-numeric" : c.align === "center" ? "text-center" : "text-left",
                            c.className,
                          )}
                        >
                          {renderCell(c, row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading ? "Chargement…" : (
            <>
              {sorted.length} ligne{sorted.length > 1 ? "s" : ""}
              {query && ` (filtré sur ${data.length})`}
            </>
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Préc.
            </Button>
            <span className="px-2 text-numeric">{safePage + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
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
