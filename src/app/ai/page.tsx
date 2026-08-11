import AIChat from "@/components/AIChat";

export const metadata = {
  title: "Asistente Financiero IA",
};

export default function AIPage() {
  return (
    <div className="flex flex-col gap-6 h-full min-h-[80vh]">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Asistente IA</h1>
        <p className="text-sm text-muted-foreground mt-1">Preguntale a Gemini sobre tus gastos</p>
      </header>
      
      <AIChat />
    </div>
  );
}
