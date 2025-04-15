const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@line/bot-sdk');
const sqlite3 = require('sqlite3').verbose();

require('dotenv').config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new Client(config);
const app = express();
app.use(bodyParser.json());

const db = new sqlite3.Database('./database.db');

app.post('/webhook', (req, res) => {
  const events = req.body.events;
  if (!Array.isArray(events)) {
    return res.sendStatus(200);
  }

  events.forEach(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      const msg = event.message.text;
      const userId = event.source.userId;

      if (msg.startsWith("報修#")) {
        const name = msg.split("#")[1];
        db.all("SELECT serial FROM products WHERE owner = ?", [name], (err, rows) => {
          if (err || rows.length === 0) {
            return client.replyMessage(event.replyToken, {
              type: 'text',
              text: `查無此人或無產品紀錄。`
            });
          }

          const list = rows.map((r, i) => `${i + 1}. ${r.serial}`).join("\n");
          return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `✅ ${name} 的產品：\n${list}`
          });
        });
      }
    }
  });

  res.sendStatus(200);
});

app.listen(3000);
