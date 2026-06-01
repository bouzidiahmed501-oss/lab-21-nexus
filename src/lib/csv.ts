// Lightweight CSV export utility for all modules.
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (value instanceof Date) str = value.toISOString();
  else if (typeof value === "object") str = JSON.stringify(value);
  else str = String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns?: { key: keyof T; label?: string }[],
): string {
  if (rows.length === 0 && !columns) return "";
  const cols: { key: keyof T; label?: string }[] =
    columns ?? (Object.keys(rows[0] ?? {}) as (keyof T)[]).map((k) => ({ key: k }));
  const header = cols.map((c) => escapeCell(c.label ?? String(c.key))).join(",");
  const body = rows
    .map((r) => cols.map((c) => escapeCell(r[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns?: { key: keyof T; label?: string }[],
) {
  downloadCSV(filename, toCSV(rows, columns));
}
