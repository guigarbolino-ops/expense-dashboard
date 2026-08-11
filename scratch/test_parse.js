const { google } = require('googleapis');
const path = require('path');

function parseAmount(val) {
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

function parseSheetDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.trim();
  const parts = str.split('/');
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);
    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      if (p3 < 100) p3 += 2000;
      let month, day;
      if (p1 > 12) {
        day = p1; month = p2 - 1;
      } else if (p2 > 12) {
        month = p1 - 1; day = p2;
      } else {
        month = p1 - 1; day = p2; // Default MM/DD/YYYY
      }
      return new Date(p3, month, day);
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

async function test() {
  const credsPath = path.join(process.cwd(), 'registro-de-gastos-bot-4b9a69b8b780.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: credsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1U_rol32tTcLWSetRan3XOYCmsg_YZcrDmuy8Hw4kvtw';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'DATOS'!A2:F`,
  });

  const rows = res.data.values || [];
  let parsedCount = 0;
  let totalSum = 0;
  let august2026Count = 0;
  let august2026Sum = 0;

  rows.forEach((r, idx) => {
    if (!r || r.length === 0) return;
    const date = parseSheetDate(r[0]);
    const amount = parseAmount(r[2]);
    if (date && !isNaN(amount)) {
      parsedCount++;
      totalSum += amount;
      if (date.getFullYear() === 2026 && date.getMonth() === 7) { // Month 7 is August (0-indexed)
        august2026Count++;
        august2026Sum += amount;
      }
    }
  });

  console.log(`Parsed ${parsedCount} out of ${rows.length} rows.`);
  console.log(`Total Historical Sum: $${totalSum.toLocaleString('es-AR')}`);
  console.log(`August 2026 (Current Month) Count: ${august2026Count} expenses, Total Sum: $${august2026Sum.toLocaleString('es-AR')}`);
}

test().catch(console.error);
