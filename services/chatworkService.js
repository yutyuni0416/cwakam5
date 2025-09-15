// services/chatworkService.js

const axios = require('axios');
const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';
const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;

const headers = {
  'X-ChatWorkToken': CHATWORK_API_TOKEN,
};

const sendCW = async (roomId, body) => {
  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/messages`;
  await axios.post(url, { body }, { headers });
};

const sendReply = async (roomId, messageId, fromAccountId, replyText) => {
  const replyMessage = `[rp aid=${fromAccountId} to=${roomId}-${messageId}]${replyText}`;
  await sendCW(roomId, replyMessage);
};

const getRoomMembers = async (roomId) => {
  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/members`;
  const response = await axios.get(url, { headers });
  return response.data;
};

const changeMemberRole = async (roomId, targetId, role) => {
  const members = await getRoomMembers(roomId);
  const adminIds = members.filter(m => m.role === 'admin' && String(m.account_id) !== String(targetId)).map(m => m.account_id);
  const memberIds = members.filter(m => m.role === 'member' && String(m.account_id) !== String(targetId)).map(m => m.account_id);
  const readonlyIds = members.filter(m => m.role === 'readonly' && String(m.account_id) !== String(targetId)).map(m => m.account_id);

  if (role === 'admin') adminIds.push(targetId);
  else if (role === 'member') memberIds.push(targetId);
  else if (role === 'readonly') readonlyIds.push(targetId);

  const payload = {
    members_admin_ids: [...new Set(adminIds)].join(','),
    members_member_ids: [...new Set(memberIds)].join(','),
    members_readonly_ids: [...new Set(readonlyIds)].join(',')
  };

  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/members`;
  await axios.put(url, payload, { headers });
};

const removeMember = async (roomId, targetId) => {
  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/members`;
  const members = await getRoomMembers(roomId);
  const adminIds = members.filter(m => m.role === 'admin').map(m => m.account_id);
  const memberIds = members.filter(m => m.role === 'member' && String(m.account_id) !== String(targetId)).map(m => m.account_id);
  const readonlyIds = members.filter(m => m.role === 'readonly' && String(m.account_id) !== String(targetId)).map(m => m.account_id);

  const payload = {
    members_admin_ids: adminIds.join(','),
    members_member_ids: memberIds.join(','),
    members_readonly_ids: readonlyIds.join(',')
  };

  await axios.put(url, payload, { headers });
};

const getRandomMember = async (roomId) => {
  const members = await getRoomMembers(roomId);
  if (!members || members.length === 0) {
    console.error("メンバーが取得できなかった！");
    return null;
  }
  const randomIndex = Math.floor(Math.random() * members.length);
  return members[randomIndex].account_id;
};

module.exports = {
  sendCW,
  sendReply,
  getRoomMembers,
  changeMemberRole,
  removeMember,
  getRandomMember
};
