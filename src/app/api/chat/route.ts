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

    // Build conversation history (last 6 messages before current)
    const history = messages.slice(0, -1).slice(-6);
    let historyStr = "";
    if (history.length > 0) {
      historyStr = "\n\nHistorial de la conversación reciente:\n" + history
        .map((m: any) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
        .join('\n');
    }

    const fullPrompt = `${systemInstruction}\n\n${contextStr}${historyStr}\n\nPregunta actual del usuario: ${userMessage}`;

    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];
    let aiText = "";
    let lastErr = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
        });
        aiText = response.text || "";
        if (aiText) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!aiText && lastErr) {
      throw lastErr;
    }

    return NextResponse.json({ text: aiText || "No se obtuvo respuesta de Gemini." });
  } catch (error: any) {
    console.error("AI Assistant API Error:", error);
    return NextResponse.json(
      { error: `Error al procesar tu consulta con Gemini: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
