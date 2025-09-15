// server.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const chatworkService = require('./services/chatworkService');
const googleSheetsService = require('./services/googleSheetsService');
const adminCommands = require('./commands/admin');
const miscCommands = require('./commands/misc');

const app = express();
app.use(bodyParser.json());

const BOT_ACCOUNT_ID = process.env.BOT_ACCOUNT_ID;
const OWNER_ID = process.env.OWNER_ID;
const permissionsFile = path.join(__dirname, 'data', 'permissions.json');

app.post('/webhook', async (req, res) => {
  try {
    const { webhook_event } = req.body;
    const { room_id, message_id, account_id, body } = webhook_event;
    
    // Bot自身の発言は無視
    if (String(account_id) === String(BOT_ACCOUNT_ID)) {
      return res.sendStatus(200);
    }
    
    // ログにメッセージを保存
    googleSheetsService.saveMessageToSheet(account_id, body);
    
    // Botへのメンションから始まるか確認
    if (body.startsWith(`[To:${BOT_ACCOUNT_ID}]`)) {
      const parts = body.split(/\s+/);
      const command = parts[1];
      const replyMatch = body.match(/\[(?:rp|返信) aid=(\d+).*?\]/);
      let targetIdFromReply = null;
      if (replyMatch && replyMatch[1]) {
        targetIdFromReply = replyMatch[1];
      }
      
      // 権限チェック
      const permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf-8'));
      const roomAdmins = permissions[room_id]?.admins || [];
      const allAdmins = [...new Set([...roomAdmins, OWNER_ID])];

      if (!allAdmins.includes(String(account_id))) {
        await chatworkService.sendReply(
          room_id,
          message_id,
          account_id,
          "⚠️ あなたにはその権限がありません。"
        );
        return res.sendStatus(200);
      }

      // 権限操作コマンドを処理
      if (['/kill', '/ban', '/atmember', '/atadmin'].includes(command)) {
        await adminCommands.handle(command, {
          roomId: room_id,
          messageId: message_id,
          fromAccountId: account_id,
          targetId: targetIdFromReply
        });
      } else if (command === '/allid') {
        await adminCommands.handleAllid(room_id, message_id, account_id);
      } else {
        await chatworkService.sendReply(room_id, message_id, account_id, `⚠️ 不明なコマンドです。`);
      }
    } else {
      // メンションなしの雑多なコマンドを処理
      await miscCommands.handle(body, { roomId: room_id, messageId: message_id, fromAccountId: account_id });
    }
    
    res.sendStatus(200);
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
