require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch'); // Cần cài thêm: npm install node-fetch@2

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

// Route test để check server sống
app.get('/', (req, res) => {
  res.send('Discord Webhook API is running.');
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

    // Gửi qua Webhook
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify({
      content: content || '',
      embeds: embeds || []
    }));

    if (req.file) {
      formData.append('file', req.file.buffer, req.file.originalname);
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).send('Webhook URL chưa được cấu hình.');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      res.status(200).send('Đã gửi message qua Webhook');
    } else {
      console.error('Lỗi khi gửi Webhook:', await response.text());
      res.status(500).send('Lỗi khi gửi Webhook');
    }
  } catch (err) {
    console.error('Lỗi khi xử lý /send-message:', err);
    res.status(500).send('Lỗi server khi xử lý /send-message');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Express server đang lắng nghe tại port ${PORT}`);
});

