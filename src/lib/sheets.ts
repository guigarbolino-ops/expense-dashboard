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

export function parseAmount(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim();
  str = str.replace(/[$\s]/g, '');
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/,/g, '');
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.every((part, i) => i === 0 || part.length === 3)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }
  return parseFloat(str) || 0;
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

    // 2. Local development fallback
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
    
    // Fetch explicitly from 'DATOS'!A2:F to get all rows from the primary tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "'DATOS'!A2:F",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Filter out completely empty rows and map to Expense objects
    return rows
      .filter((row) => row.length > 0 && row.some(cell => String(cell).trim() !== ''))
      .map((row, index) => {
        const amount = parseAmount(row[2]);

        return {
          id: `row-${index}`,
          date: row[0] ? String(row[0]).trim() : '',
          description: row[1] ? String(row[1]).trim() : '',
          amount,
          paidBy: row[3] ? String(row[3]).trim() : '',
          category: row[4] ? String(row[4]).trim() : '',
          subcategory: row[5] ? String(row[5]).trim() : '',
        };
      });
  } catch (error) {
    console.error('Error fetching expenses from Google Sheets:', error);
    return [];
  }
}
