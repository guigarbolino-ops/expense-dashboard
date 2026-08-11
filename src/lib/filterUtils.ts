import { Expense } from "./sheets";
import { FilterState } from "@/components/FilterBubble";

export function parseArgentineDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

export function filterExpenses(expenses: Expense[], filters: FilterState): Expense[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return expenses.filter((e) => {
    // Category filter
    if (filters.category !== "all" && e.category !== filters.category) {
      return false;
    }

    // Subcategory filter
    if (filters.subcategory !== "all" && e.subcategory !== filters.subcategory) {
      return false;
    }

    // Paid by filter
    if (filters.paidBy !== "all" && e.paidBy !== filters.paidBy) {
      return false;
    }

    // Date preset filtering
    const d = parseArgentineDate(e.date);
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
    const da = parseArgentineDate(a.date)?.getTime() || 0;
    const db = parseArgentineDate(b.date)?.getTime() || 0;
    return da - db;
  });

  let groupByMonth = datePreset === "year_2026";
  if (!groupByMonth && sorted.length > 1) {
    const firstDate = parseArgentineDate(sorted[0].date);
    const lastDate = parseArgentineDate(sorted[sorted.length - 1].date);
    if (firstDate && lastDate) {
      const diffDays = Math.abs(lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 35) {
        groupByMonth = true;
      }
    }
  }

  const grouped: Record<string, { label: string; amount: number; rawDate: Date }> = {};

  sorted.forEach((e) => {
    const d = parseArgentineDate(e.date);
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
