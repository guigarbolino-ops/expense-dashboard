const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function test() {
  const credsPath = path.join(process.cwd(), 'registro-de-gastos-bot-4b9a69b8b780.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: credsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1U_rol32tTcLWSetRan3XOYCmsg_YZcrDmuy8Hw4kvtw';

  // 1. Get spreadsheet metadata (sheet names)
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  console.log("Sheet tabs:", meta.data.sheets.map(s => s.properties.title));

  // 2. Fetch A1:Z1000
  const firstSheetName = meta.data.sheets[0].properties.title;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${firstSheetName}'!A1:Z`,
  });

  const rows = res.data.values || [];
  console.log(`Total rows in '${firstSheetName}': ${rows.length}`);
  if (rows.length > 0) {
    console.log("Header row (row 0):", rows[0]);
    console.log("Sample first 3 data rows:", rows.slice(1, 4));
    console.log("Sample last 3 data rows:", rows.slice(-3));
  }
}

test().catch(console.error);
