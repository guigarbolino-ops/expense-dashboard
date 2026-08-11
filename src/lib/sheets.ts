import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  paidBy: string;
  category: string;
  subcategory: string;
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    let auth;

    // 1. Support raw JSON string in Vercel env var (Production)
    if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
      try {
        const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      } catch (err) {
        console.error("Error parsing GCP_SERVICE_ACCOUNT_JSON environment variable:", err);
      }
    }

    // 2. Local development fallback (Ignored by Turbopack tracing in production)
    if (!auth && process.env.NODE_ENV !== 'production') {
      try {
        const credsFile = process.env.GCP_SERVICE_ACCOUNT_FILE || 'registro-de-gastos-bot-4b9a69b8b780.json';
        const credsPath = path.join(/*turbopackIgnore: true*/ process.cwd(), credsFile);
        if (fs.existsSync(credsPath)) {
          auth = new google.auth.GoogleAuth({
            keyFile: credsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });
        }
      } catch (err) {
        console.warn("Local credentials read skipped:", err);
      }
    }

    if (!auth) {
      console.warn("[getExpenses] No auth mechanism available. Returning empty array.");
      return [];
    }

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Fetch A2:F to skip header
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'A2:F',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Filter out completely empty rows and map to objects
    return rows
      .filter((row) => row.length > 0 && row.some(cell => cell.trim() !== ''))
      .map((row, index) => {
        const amountStr = row[2] ? String(row[2]).replace(/[$\s]/g, '').replace(',', '.') : '0';
        const amount = parseFloat(amountStr) || 0;

        return {
          id: `row-${index}`,
          date: row[0] || '',
          description: row[1] || '',
          amount,
          paidBy: row[3] || '',
          category: row[4] || '',
          subcategory: row[5] || '',
        };
      });
  } catch (error) {
    console.error('Error fetching expenses from Google Sheets:', error);
    return [];
  }
}
