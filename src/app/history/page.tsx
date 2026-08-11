import { getExpenses } from "@/lib/sheets";
import HistoryClient from "@/components/HistoryClient";

export const revalidate = 0;

export default async function HistoryPage() {
  const expenses = await getExpenses();

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Historial</h1>
        <p className="text-sm text-muted-foreground mt-1">Todos los movimientos registrados</p>
      </header>
      
      <HistoryClient initialExpenses={expenses} />
    </div>
  );
}
