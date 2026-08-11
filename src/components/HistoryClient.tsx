"use client";

import { useState, useMemo } from "react";
import { Expense } from "@/lib/sheets";
import { formatCurrency, formatDate } from "@/lib/format";
import FilterBubble, { FilterState, initialFilterState } from "./FilterBubble";
import { filterExpenses } from "@/lib/filterUtils";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Search, Receipt } from "lucide-react";

export default function HistoryClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [filters, setFilters] = useState<FilterState>({
    ...initialFilterState,
    datePreset: "year_2026",
  });
  const [searchTerm, setSearchTerm] = useState("");

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
    let result = filterExpenses(initialExpenses, filters);

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.subcategory.toLowerCase().includes(q) ||
          e.paidBy.toLowerCase().includes(q)
      );
    }

    return [...result].reverse();
  }, [initialExpenses, filters, searchTerm]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, e) => sum + e.amount, 0);
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* 1. Search Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          className="w-full bg-white border border-gray-100/80 text-sm text-gray-900 rounded-2xl pl-11 pr-4 py-3.5 outline-none shadow-sm focus:ring-2 focus:ring-indigo-400 transition-all placeholder:text-gray-400"
          placeholder="Buscar por concepto, categoría o persona..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 2. Independent Collapsible Filter Bubble */}
      <FilterBubble
        filters={filters}
        onChange={setFilters}
        categories={categories}
        subcategories={subcategories}
        persons={persons}
      />

      {/* 3. Summary Pill Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {filtered.length} Movimientos encontrados
        </span>
        <span className="text-sm font-extrabold text-gray-900 bg-white px-3 py-1 rounded-full shadow-xs border border-gray-100">
          Total: {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* 4. Expense List */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100/80">
        <div className="flex flex-col gap-3">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const ItemIcon = getCategoryIcon(item.category);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 hover:bg-gray-100/80 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center shrink-0 text-gray-700">
                      <ItemIcon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 truncate">{item.description}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                        <span className="font-semibold text-gray-500">{formatDate(item.date)}</span>
                        <span>•</span>
                        <span>{item.paidBy}</span>
                        {item.subcategory && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400">{item.subcategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-extrabold text-gray-900">{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium mt-0.5">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-2">
              <Receipt className="w-8 h-8 text-gray-300 stroke-[1.5]" />
              <span>No se encontraron movimientos con los filtros aplicados.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
