"use client";

import { useMemo, useState } from "react";
import { Expense } from "@/lib/sheets";
import { formatCurrency, formatDate } from "@/lib/format";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { Filter, TrendingUp, DollarSign, Award, XCircle } from "lucide-react";

export default function DashboardClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [excludeHousing, setExcludeHousing] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("current");
  const [selectedPerson, setSelectedPerson] = useState<string>("all");

  const currentMonthNum = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filter logic
  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((e) => {
      // Handle missing dates
      if (!e.date) return false;
      
      const parts = e.date.split("/");
      if (parts.length === 3) {
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (selectedMonth === "current") {
          if (month !== currentMonthNum || year !== currentYear) return false;
        }
      }

      if (excludeHousing && e.category.toLowerCase().includes("vivienda")) {
        return false;
      }

      if (selectedPerson !== "all" && e.paidBy !== selectedPerson) {
        return false;
      }

      return true;
    });
  }, [initialExpenses, excludeHousing, selectedMonth, selectedPerson, currentMonthNum, currentYear]);

  // KPIs
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const maxExpense = filteredExpenses.reduce((max, e) => e.amount > max.amount ? e : max, filteredExpenses[0] || null);
  
  const categoryTotals = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const topCategory = categoryTotals[0];

  // Daily Trend Data
  const dailyData = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const d = formatDate(e.date);
      acc[d] = (acc[d] || 0) + e.amount;
    });
    // Assuming sorted by date mostly, but ideally we'd sort by parsed date
    return Object.entries(acc).map(([date, amount]) => ({ date, amount }));
  }, [filteredExpenses]);

  // Recent 10
  const recent10 = [...filteredExpenses].reverse().slice(0, 10);

  // Persons for filter
  const persons = Array.from(new Set(initialExpenses.map(e => e.paidBy))).filter(Boolean);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  return (
    <div className="flex flex-col gap-8 pb-8">
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4 text-primary" />
          Filtros
        </div>
        <div className="flex flex-wrap gap-3">
          <select 
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="current">Mes Actual</option>
            <option value="all">Todos los tiempos</option>
          </select>
          
          <select 
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
          >
            <option value="all">Todos (Personas)</option>
            {persons.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button 
            onClick={() => setExcludeHousing(!excludeHousing)}
            className={`text-sm px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${excludeHousing ? 'bg-primary/10 border-primary/20 text-primary-dark' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
          >
            {excludeHousing ? <XCircle className="w-4 h-4" /> : null}
            Sin Vivienda
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xs uppercase font-semibold tracking-wider">Total Gastado</span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totalSpent)}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <span className="text-xs uppercase font-semibold tracking-wider">Mayor Gasto</span>
          </div>
          <span className="text-lg font-bold text-gray-900 truncate">
            {maxExpense ? formatCurrency(maxExpense.amount) : "$0"}
          </span>
          <span className="text-xs text-gray-400 mt-1 truncate">{maxExpense?.description || "-"}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Award className="w-5 h-5 text-blue-500" />
            <span className="text-xs uppercase font-semibold tracking-wider">Categoría Top</span>
          </div>
          <span className="text-lg font-bold text-gray-900 truncate">
            {topCategory ? topCategory.name : "-"}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            {topCategory ? formatCurrency(topCategory.value) : "$0"}
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-6">Tendencia Diaria</h3>
          <div className="h-64 w-full">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: "var(--color-primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sin datos para mostrar</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-6">Distribución por Categoría</h3>
          <div className="h-64 w-full relative">
            {categoryTotals.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sin datos para mostrar</div>
            )}
            
            {/* Custom Legend */}
            <div className="absolute top-0 right-0 max-h-full overflow-y-auto no-scrollbar w-1/3 flex flex-col gap-2 pt-2 pb-2 text-xs">
              {categoryTotals.slice(0, 5).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate text-gray-600">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-800">Últimos Gastos</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recent10.length > 0 ? (
            recent10.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col gap-1 overflow-hidden pr-4">
                  <span className="text-sm font-medium text-gray-900 truncate">{expense.description}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">{expense.category}</span>
                    <span>•</span>
                    <span className="truncate">{expense.paidBy}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                  <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              No hay gastos recientes para los filtros aplicados.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
