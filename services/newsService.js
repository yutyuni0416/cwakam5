// services/newsService.js

const axios = require('axios');
const xml2js = require('xml2js');

const getAnniversary = async () => {
  const url = 'https://zatsuneta.com/category/anniversary.html';
  try {
    const res = await axios.get(url, { responseEncoding: 'binary' });
    const html = res.data.toString('utf-8');
    
    // HTMLから今日の記念日情報を抽出
    const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'M月d日');
    const regex = new RegExp(`今日\\s*${today}[\\s\\S]*?明日`, 'i');
    const match = html.match(regex);
    let listText = match ? match[0] : null;
    
    if (listText) {
      const titleMatch = listText.match(/今日.*?の記念日・年中行事/);
      const titleText = titleMatch ? titleMatch[0].replace(/\r?\n/g, '') : `今日は何の日？ ${today}`;
      let bodyText = listText.replace(titleText, '').replace(/<[^>]+>/g, '').trim();
      bodyText = bodyText.split('明日')[0].trim();
      return `[info][title]${titleText}[/title]\n${bodyText}\n[/info]`;
    } else {
      return `[info][title]今日は何の日？[/title]情報を取得できませんでした[/info]`;
    }
  } catch (error) {
    console.error('記念日取得エラー:', error);
    return `[info][title]今日は何の日？[/title]取得中にエラーが発生しました: ${error.message}[/info]`;
  }
};

module.exports = { getAnniversary };
