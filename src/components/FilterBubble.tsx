"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  datePreset: "current_month" | "last_month" | "year_2026" | "custom";
  customStartDate: string;
  customEndDate: string;
  category: string;
  subcategory: string;
  paidBy: string;
}

interface FilterBubbleProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: string[];
  subcategories: string[];
  persons: string[];
}

export const initialFilterState: FilterState = {
  datePreset: "current_month",
  customStartDate: "",
  customEndDate: "",
  category: "all",
  subcategory: "all",
  paidBy: "all",
};

export default function FilterBubble({
  filters,
  onChange,
  categories,
  subcategories,
  persons,
}: FilterBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets: { id: FilterState["datePreset"]; label: string }[] = [
    { id: "current_month", label: "Este mes" },
    { id: "last_month", label: "Mes pasado" },
    { id: "year_2026", label: "2026" },
    { id: "custom", label: "Personalizado" },
  ];

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const activeFiltersCount =
    (filters.datePreset !== "current_month" ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    (filters.subcategory !== "all" ? 1 : 0) +
    (filters.paidBy !== "all" ? 1 : 0);

  return (
    <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100/80 transition-all duration-300">
      {/* Header / Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1 px-1 focus:outline-none group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-gray-900 block leading-tight">Filtros de análisis</span>
            <span className="text-xs text-gray-400">
              {filters.datePreset === "current_month" && "Este mes"}
              {filters.datePreset === "last_month" && "Mes pasado"}
              {filters.datePreset === "year_2026" && "Año 2026"}
              {filters.datePreset === "custom" && "Rango personalizado"}
              {filters.category !== "all" && ` • ${filters.category}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount} activo{activeFiltersCount > 1 ? "s" : ""}
            </span>
          )}
          <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Período de Fecha
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => {
                const isSelected = filters.datePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => updateFilter("datePreset", p.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                      isSelected
                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200/80 hover:bg-gray-100"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Pickers if custom selected */}
          {filters.datePreset === "custom" && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200/60">
              <div>
                <label className="text-[11px] text-gray-500 font-medium block mb-1">Desde</label>
                <input
                  type="date"
                  className="w-full bg-white border border-gray-200 text-xs rounded-xl p-2 outline-none focus:ring-2 focus:ring-indigo-400"
                  value={filters.customStartDate}
                  onChange={(e) => updateFilter("customStartDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-medium block mb-1">Hasta</label>
                <input
                  type="date"
                  className="w-full bg-white border border-gray-200 text-xs rounded-xl p-2 outline-none focus:ring-2 focus:ring-indigo-400"
                  value={filters.customEndDate}
                  onChange={(e) => updateFilter("customEndDate", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Categoría
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200/80 text-xs text-gray-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Subcategoría
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200/80 text-xs text-gray-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                value={filters.subcategory}
                onChange={(e) => updateFilter("subcategory", e.target.value)}
              >
                <option value="all">Todas las subcategorías</option>
                {subcategories.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Quién Pagó
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200/80 text-xs text-gray-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                value={filters.paidBy}
                onChange={(e) => updateFilter("paidBy", e.target.value)}
              >
                <option value="all">Cualquier persona</option>
                {persons.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset */}
          <div className="flex items-center justify-end pt-2 border-t border-gray-100">
            <button
              onClick={() => onChange(initialFilterState)}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer filtros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
