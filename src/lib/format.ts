export function formatCurrency(value: number | null | undefined, currency = "TND"): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency,
    minimumFractionDigits: 3,
  }).format(n);
}

export function formatTND(value: number | null | undefined): string {
  return formatCurrency(value, "TND");
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("fr-TN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
