// services/googleSheetsService.js

const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Renderの環境変数から認証情報を取得
const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: SCOPES,
});
const sheets = google.sheets({ version: 'v4', auth });

const saveMessageToSheet = async (fromAccountId, message) => {
  if (!SPREADSHEET_ID) {
    console.error("スプレッドシートIDが設定されていません。");
    return;
  }
  
  const values = [
    [new Date().toISOString(), fromAccountId, message],
  ];
  
  const resource = { values };
  
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Log!A1',
      valueInputOption: 'RAW',
      resource,
    });
    console.log('メッセージをスプレッドシートに保存しました。');
  } catch (err) {
    console.error('スプレッドシートへの書き込みエラー:', err);
  }
};

module.exports = { saveMessageToSheet };
