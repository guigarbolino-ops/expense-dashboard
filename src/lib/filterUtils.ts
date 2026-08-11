import { Expense } from "./sheets";
import { FilterState } from "@/components/FilterBubble";

export function parseSheetDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();

  // Handle format MM/DD/YYYY or M/D/YYYY or DD/MM/YYYY
  const parts = str.split('/');
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);

    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      if (p3 < 100) p3 += 2000;
      let month: number;
      let day: number;

      if (p1 > 12) {
        day = p1;
        month = p2 - 1;
      } else if (p2 > 12) {
        month = p1 - 1;
        day = p2;
      } else {
        // Sheet uses MM/DD/YYYY (e.g. 10/15/2023 or 8/10/2026)
        month = p1 - 1;
        day = p2;
      }
      return new Date(p3, month, day);
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function filterExpenses(expenses: Expense[], filters: FilterState): Expense[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return expenses.filter((e) => {
    // Category filter
    if (filters.category !== "all" && e.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }

    // Subcategory filter
    if (filters.subcategory !== "all" && e.subcategory.toLowerCase() !== filters.subcategory.toLowerCase()) {
      return false;
    }

    // Paid by filter
    if (filters.paidBy !== "all" && e.paidBy.toLowerCase() !== filters.paidBy.toLowerCase()) {
      return false;
    }

    // Date preset filtering
    const d = parseSheetDate(e.date);
    if (!d) return true;

    if (filters.datePreset === "current_month") {
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) {
        return false;
      }
    } else if (filters.datePreset === "last_month") {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      if (d.getMonth() !== lastMonth || d.getFullYear() !== lastMonthYear) {
        return false;
      }
    } else if (filters.datePreset === "year_2026") {
      if (d.getFullYear() !== 2026) {
        return false;
      }
    } else if (filters.datePreset === "custom") {
      if (filters.customStartDate) {
        const start = new Date(filters.customStartDate);
        if (d < start) return false;
      }
      if (filters.customEndDate) {
        const end = new Date(filters.customEndDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
    }

    return true;
  });
}

export interface TimeSeriesPoint {
  label: string;
  amount: number;
  rawDate: Date;
}

export function buildTimeSeriesData(expenses: Expense[], datePreset: FilterState["datePreset"]): TimeSeriesPoint[] {
  if (expenses.length === 0) return [];

  const sorted = [...expenses].sort((a, b) => {
    const da = parseSheetDate(a.date)?.getTime() || 0;
    const db = parseSheetDate(b.date)?.getTime() || 0;
    return da - db;
  });

  let groupByMonth = datePreset === "year_2026";
  if (!groupByMonth && sorted.length > 1) {
    const firstDate = parseSheetDate(sorted[0].date);
    const lastDate = parseSheetDate(sorted[sorted.length - 1].date);
    if (firstDate && lastDate) {
      const diffDays = Math.abs(lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 35) {
        groupByMonth = true;
      }
    }
  }

  const grouped: Record<string, { label: string; amount: number; rawDate: Date }> = {};

  sorted.forEach((e) => {
    const d = parseSheetDate(e.date);
    if (!d) return;

    let key: string;
    let label: string;

    if (groupByMonth) {
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      label = `${d.getDate()}/${d.getMonth() + 1}`;
    }

    if (!grouped[key]) {
      grouped[key] = { label, amount: 0, rawDate: d };
    }
    grouped[key].amount += e.amount;
  });

  return Object.values(grouped);
}
