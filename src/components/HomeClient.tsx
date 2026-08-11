"use client";

import { useState, useMemo } from "react";
import { Expense } from "@/lib/sheets";
import { formatCurrency, formatDate } from "@/lib/format";
import FilterBubble, { FilterState, initialFilterState } from "./FilterBubble";
import { filterExpenses, buildTimeSeriesData } from "@/lib/filterUtils";
import { getCategoryIcon } from "@/lib/categoryIcons";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Receipt, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const CHART_COLORS = [
  "#818cf8", // Periwinkle / Soft Indigo
  "#fbbf24", // Warm Yellow / Gold
  "#34d399", // Mint Green
  "#f87171", // Soft Coral
  "#c084fc", // Pastel Purple
  "#38bdf8", // Sky Blue
  "#f472b6", // Soft Pink
];

export default function HomeClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Extract unique filter values
  const categories = useMemo(() => {
    return Array.from(new Set(initialExpenses.map((e) => e.category))).filter(Boolean);
  }, [initialExpenses]);

  const subcategories = useMemo(() => {
    return Array.from(new Set(initialExpenses.map((e) => e.subcategory))).filter(Boolean);
  }, [initialExpenses]);

  const persons = useMemo(() => {
    return Array.from(new Set(initialExpenses.map((e) => e.paidBy))).filter(Boolean);
  }, [initialExpenses]);

  // Apply filters
  const filtered = useMemo(() => {
    return filterExpenses(initialExpenses, filters);
  }, [initialExpenses, filters]);

  // Total amount
  const totalSpent = useMemo(() => {
    return filtered.reduce((sum, e) => sum + e.amount, 0);
  }, [filtered]);

  // Category Breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    const entries = Object.entries(map).map(([name, value]) => ({ name, value }));
    entries.sort((a, b) => b.value - a.value);

    return entries.map((item, idx) => ({
      ...item,
      percentage: totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [filtered, totalSpent]);

  // Time evolution data
  const timeSeriesData = useMemo(() => {
    return buildTimeSeriesData(filtered, filters.datePreset);
  }, [filtered, filters.datePreset]);

  // Recent 10 Expenses
  const recent10 = useMemo(() => {
    return [...filtered].reverse().slice(0, 10);
  }, [filtered]);

  // Custom Slice Label for Donut Chart (Icon + Dark Percentage inside the slice ring with elegant medium stroke)
  const renderPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (percent < 0.05) return null; // Hide labels on tiny slices to avoid crowding

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const Icon = getCategoryIcon(name);

    return (
      <foreignObject
        x={x - 20}
        y={y - 18}
        width={40}
        height={36}
        className="overflow-visible pointer-events-none"
      >
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 leading-none">
          <Icon className="w-3.5 h-3.5 text-slate-800 stroke-[1.5]" />
          <span className="text-[10px] font-semibold text-slate-900 mt-0.5 tracking-tight">
            {Math.round(percent * 100)}%
          </span>
        </div>
      </foreignObject>
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-24 font-sans">
      {/* 1. Hero Card - Total & Donut Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">Gastos del Período</h2>
            <p className="text-xs text-gray-400">
              {filters.datePreset === "current_month" && "Mes actual en curso"}
              {filters.datePreset === "last_month" && "Resumen mes anterior"}
              {filters.datePreset === "year_2026" && "Año 2026 completo"}
              {filters.datePreset === "custom" && "Rango personalizado"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        {/* Enlarged Center Donut with Scaled Total Text */}
        <div className="h-80 sm:h-96 w-full relative flex items-center justify-center my-1">
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={78}
                    outerRadius={135}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), "Monto"]}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Total inside the expanded Donut hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Total</span>
                <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5 max-w-[140px] truncate">
                  {formatCurrency(totalSpent)}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 font-medium bg-gray-100/80 px-2 py-0.5 rounded-full">
                  {filtered.length} registros
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <Receipt className="w-8 h-8 text-gray-300 mb-2 stroke-[1.5]" />
              <span>Sin gastos para este período</span>
            </div>
          )}
        </div>

        {/* Categories showing Category Icon & Total Amount */}
        {categoryData.length > 0 && (
          <div className="mt-2 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              {categoryData.slice(0, 3).map((cat) => {
                const CatIcon = getCategoryIcon(cat.name);
                return (
                  <div key={cat.name} className="flex flex-col gap-1 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100/60">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-gray-800"
                        style={{ backgroundColor: `${cat.color}40` }}
                      >
                        <CatIcon className="w-3 h-3 text-gray-800 stroke-[1.5]" />
                      </div>
                      <span className="text-xs text-gray-500 font-medium truncate">{cat.name}</span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-gray-900 truncate">
                      {formatCurrency(cat.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Collapsible Filter Bubble */}
      <FilterBubble
        filters={filters}
        onChange={setFilters}
        categories={categories}
        subcategories={subcategories}
        persons={persons}
      />

      {/* 3. Time Evolution Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Evolución en el Tiempo</h3>
            <p className="text-xs text-gray-400">
              Escala adaptativa ({filters.datePreset === "year_2026" ? "Por Meses" : "Por Días"})
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="h-56 w-full">
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  dy={8}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), "Gasto"]}
                  contentStyle={{
                    borderRadius: "14px",
                    border: "none",
                    boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Sin movimientos registrados en este rango
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Expenses List (Last 10) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Últimos Gastos</h3>
          <Link
            href="/history"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {recent10.length > 0 ? (
            recent10.map((item) => {
              const ItemIcon = getCategoryIcon(item.category);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 hover:bg-gray-100/60 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center shrink-0 text-gray-700">
                      <ItemIcon className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 truncate">{item.description}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{formatDate(item.date)}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-500">{item.paidBy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium mt-0.5">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              No hay movimientos recientes que coincidan con los filtros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
