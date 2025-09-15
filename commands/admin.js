// commands/admin.js

const chatworkService = require('../services/chatworkService');
const fs = require('fs');
const path = require('path');
const permissionsFile = path.join(__dirname, '../data', 'permissions.json');

const handle = async (command, { roomId, messageId, fromAccountId, targetId }) => {
  if (!targetId) {
    await chatworkService.sendReply(roomId, messageId, fromAccountId, "⚠️ 権限変更の対象者が指定されていません。コマンドを打つ前に、対象者にリプライしてください。");
    return;
  }
  
  const members = await chatworkService.getRoomMembers(roomId);
  const targetMember = members.find(m => String(m.account_id) === String(targetId));
  if (!targetMember) {
    await chatworkService.sendReply(roomId, messageId, fromAccountId, `⚠️ [piconname:${targetId}] さんは部屋のメンバーではありません。`);
    return;
  }
  
  let successMessage = "";
  switch (command) {
    case '/kill':
      if (targetMember.role === 'admin' || String(targetId) === process.env.OWNER_ID) {
        await chatworkService.sendReply(roomId, messageId, fromAccountId, "⚠️ 管理者またはオーナーの権限は変更できません。");
        return;
      }
      await chatworkService.changeMemberRole(roomId, targetId, 'readonly');
      successMessage = `✅ [piconname:${targetId}] さんを閲覧者権限に変更しました。`;
      break;
    case '/ban':
      if (targetMember.role === 'admin' || String(targetId) === process.env.OWNER_ID) {
        await chatworkService.sendReply(roomId, messageId, fromAccountId, "⚠️ 管理者またはオーナーは追放できません。");
        return;
      }
      await chatworkService.removeMember(roomId, targetId);
      successMessage = `✅ [piconname:${targetId}] さんを部屋から追放しました。`;
      break;
    case '/atmember':
      await chatworkService.changeMemberRole(roomId, targetId, 'member');
      successMessage = `✅ [piconname:${targetId}] さんをメンバー権限に変更しました。`;
      break;
    case '/atadmin':
      await chatworkService.changeMemberRole(roomId, targetId, 'admin');
      successMessage = `✅ [piconname:${targetId}] さんを管理者権限に変更しました。`;
      break;
  }
  await chatworkService.sendReply(roomId, messageId, fromAccountId, successMessage);
};

const handleAllid = async (roomId, messageId, fromAccountId) => {
  try {
    const membersList = await chatworkService.getRoomMembers(roomId);
    if (!membersList) {
      await chatworkService.sendReply(roomId, messageId, fromAccountId, "⚠️ メンバー情報の取得に失敗しました。");
      return;
    }
    const admins = membersList.filter(m => m.role === 'admin').map(m => String(m.account_id));
    const permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf-8'));
    permissions[roomId] = { admins };
    fs.writeFileSync(permissionsFile, JSON.stringify(permissions, null, 2));
    await chatworkService.sendReply(roomId, messageId, fromAccountId, `✅ 部屋ID ${roomId} の管理者情報を更新しました。`);
  } catch (error) {
    console.error('handleAllid error:', error);
    await chatworkService.sendReply(roomId, messageId, fromAccountId, `❌ 管理者情報の更新中にエラーが発生しました。\n${error.message}`);
  }
};

module.exports = { handle, handleAllid };
