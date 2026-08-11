import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getExpenses } from '@/lib/sheets';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;
    const userMessage = messages[messages.length - 1].content;

    // Fetch fresh data for context
    const expenses = await getExpenses();
    const csvData = expenses.map(e => `${e.date},${e.description},${e.amount},${e.paidBy},${e.category},${e.subcategory}`).join('\n');
    const header = "Fecha,Descripción,Importe,Quién Pagó,Categoría,Subcategoría\n";
    
    const contextStr = `Base de datos de gastos (Formato CSV):\n${header}${csvData}`;
    
    const systemInstruction = "Eres un asesor financiero profesional. Analiza el historial completo de gastos del hogar de esta pareja basándote en los datos CSV provistos en este prompt. Debes responder a sus preguntas de forma clara, directa y concisa. Identifica patrones de consumo y haz sugerencias sobrias basadas únicamente en los datos. El importe está en Pesos Argentinos (ARS). Usa Markdown para formatear las respuestas.";

    const prompt = `${systemInstruction}\n\n${contextStr}\n\nPregunta del usuario: ${userMessage}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const aiText = response.text || "No pude generar una respuesta.";

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: "Error al generar la respuesta." },
      { status: 500 }
    );
  }
}
