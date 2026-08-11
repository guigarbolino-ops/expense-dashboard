import { parseSheetDate } from "./filterUtils";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = parseSheetDate(dateStr);
  if (d) {
    return new Intl.DateTimeFormat("es-AR", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "2-digit" : undefined,
    }).format(d);
  }
  return dateStr;
}
