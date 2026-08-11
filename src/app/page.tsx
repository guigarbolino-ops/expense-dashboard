import { getExpenses } from "@/lib/sheets";
import HomeClient from "@/components/HomeClient";

export const revalidate = 0;

export default async function Home() {
  const expenses = await getExpenses();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Home</h1>
          <p className="text-xs text-gray-500 mt-0.5">Control inteligente de gastos compartidos</p>
        </div>
      </header>
      
      <HomeClient initialExpenses={expenses} />
    </div>
  );
}
