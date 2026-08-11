"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy tu asesor financiero basado en Gemini. He cargado tu historial de gastos compartidos. ¿Qué te gustaría consultar hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await response.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, ocurrió un error de conexión con la IA." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const renderMessageContent = (content: string) => {
    const htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="text-sm leading-relaxed" />;
  };

  return (
    <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100/80 h-[72vh] relative overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar pb-24">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
              }`}
            >
              {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
            </div>
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-xs"
                  : "bg-gray-50/90 text-gray-800 border border-gray-100 rounded-tl-none"
              }`}
            >
              {renderMessageContent(m.content)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
              <Sparkles size={15} className="animate-pulse" />
            </div>
            <div className="bg-gray-50 text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm">
              <span className="animate-pulse">Analizando datos y patrones...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Floating Pill Input Bar */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full border border-gray-200/80 shadow-lg">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-transparent text-gray-900 text-sm px-4 py-2 outline-none placeholder:text-gray-400"
            placeholder="Pregunta algo sobre tus gastos..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition-colors shrink-0 shadow-sm"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
