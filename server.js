require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Client, IntentsBitField } = require('discord.js');

const app = express();
const upload = multer();

const allowedOrigins = [
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'https://tethuytruongluu.github.io'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`Bot Discord API đã sẵn sàng! Đăng nhập với tên: ${client.user.tag}`);
});

// Route test để dễ check server sống chưa
app.get('/', (req, res) => {
  res.send('Discord Bot API is running.');
});

app.post('/send-message', upload.single('file'), async (req, res) => {
  try {
    const payload_json = req.body.payload_json;
    console.log('Nhận payload_json:', payload_json);

    if (!payload_json) {
      return res.status(400).send('Thiếu payload_json');
    }

    const payload = JSON.parse(payload_json);
    const { content, embeds } = payload;

    console.log('Gửi message với content:', content);
    console.log('Gửi message với embeds:', JSON.stringify(embeds, null, 2));

    const channel = await client.channels.fetch(process.env.TARGET_CHANNEL_ID);
    if (!channel) {
      return res.status(404).send('Không tìm thấy channel');
    }

    await channel.send({
      content,
      embeds,
      files: req.file ? [{
        attachment: req.file.buffer,
        name: req.file.originalname
      }] : []
    });

    res.status(200).send('Đã gửi message qua bot');
  } catch (err) {
    console.error('Lỗi khi bot gửi message:', err);
    res.status(500).send('Lỗi server bot khi gửi message');
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log(`Bot Discord API đã login thành công.`);

    app.listen(PORT, () => {
      console.log(`Express server đang lắng nghe tại port ${PORT}`);
    });
  } catch (error) {
    console.error('Lỗi đăng nhập bot:', error);
    process.exit(1);
  }
}

startServer();
