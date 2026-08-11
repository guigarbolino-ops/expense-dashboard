import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getExpenses } from '@/lib/sheets';

// Allow Vercel Serverless Function up to 60 seconds (prevents 10s timeout error)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar la variable GEMINI_API_KEY en Vercel." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages } = body;
    const userMessage = messages[messages.length - 1]?.content || "";

    // Fetch fresh data from Google Sheets
    const expenses = await getExpenses();
    
    if (!expenses || expenses.length === 0) {
      return NextResponse.json({
        text: "No encontré registros en la planilla de Google Sheets para analizar."
      });
    }

    // Format clean CSV data (latest 300 expenses for high speed and precision)
    const recentExpenses = expenses.slice(-300);
    const csvRows = recentExpenses
      .map(e => `${e.date},${e.description.replace(/,/g, ' ')},${e.amount},${e.paidBy},${e.category},${e.subcategory}`)
      .join('\n');

    const header = "Fecha,Descripción,Importe(ARS),Quién Pagó,Categoría,Subcategoría\n";
    const contextStr = `Base de datos de gastos (${recentExpenses.length} registros más recientes):\n${header}${csvRows}`;

    const systemInstruction = `Eres un asesor financiero profesional para una pareja.
Analiza su historial de gastos provisto en el formato CSV.
Reglas:
- Responde de forma sobria, empática, directa y concisa.
- Los importes están en Pesos Argentinos (ARS).
- Responde preguntas concretas (promedios, categoría con mayor gasto, gastos de mascotas, quién pagó más, etc.).
- Identifica patrones útiles.
- Usa formato Markdown (negritas, listas) para facilitar la lectura.`;

    const fullPrompt = `${systemInstruction}\n\n${contextStr}\n\nPregunta del usuario: ${userMessage}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: fullPrompt,
    });

    const aiText = response.text || "No se obtuvo respuesta de Gemini.";
    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    console.error("AI Assistant API Error:", error);
    return NextResponse.json(
      { error: "Error al procesar tu consulta con Gemini." },
      { status: 500 }
    );
  }
}
