// commands/misc.js

const chatworkService = require('../services/chatworkService');
const newsService = require('../services/newsService');

const handle = async (messageBody, { roomId, messageId, fromAccountId }) => {
  switch (messageBody.trim()) {
    case '＃ルーレット':
    case '＃るーれっと':
      const rM = await chatworkService.getRandomMember(roomId);
      const rMz = `[piconname:${rM}]さんが当選しました！`
      await chatworkService.sendReply(roomId, messageId, fromAccountId, rMz);
      break;
    
    case '優一、今日はなんの日？':
      const anniversaryMessage = await newsService.getAnniversary();
      await chatworkService.sendReply(roomId, messageId, fromAccountId, anniversaryMessage);
      break;

    default:
      break;
  }
};

module.exports = { handle };
