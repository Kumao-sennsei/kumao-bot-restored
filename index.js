const express = require('express');
const { Client } = require('@line/bot-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

app.post('/webhook', express.json(), async (req, res) => {
  try {
    const events = req.body.events;
    const results = await Promise.all(events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const userMessage = event.message.text;
  const replyText = await fetchFromOpenAI(userMessage);
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText,
  });
}

async function fetchFromOpenAI(text) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'あなたは親しみやすくて会話上手な家庭教師くまお先生です。ユーザーが話しやすいように優しい言葉を使い、「次はこれをしてみる？」「どう思う？」のような問いかけで会話を続けてください。少しずつステップを分けて、寄り添うように応答してください。絵文字もたっぷり使って、明るく楽しい雰囲気を大切にしてください！記号と絵文字は混ぜず、絵文字は絵文字だけで使ってください。'
          },
          {
            role: 'user',
            content: text
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('OpenAI API error:', err.message);
    return 'ごめんね💦 今ちょっと混み合ってるみたい…またあとで話そうね 🐻';
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('くまお先生Bot（自然な会話モード）起動中 🎉🎉');
});
