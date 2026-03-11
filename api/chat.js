const https = require('https');

// ⚠️ 把 YOUR_KEY_HERE 替换成你的 DeepSeek API Key
const DEEPSEEK_KEY = 'YOUR_KEY_HERE';
const TIMEOUT = 25000;

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.DEEPSEEK_KEY || sk-4bd3837a6afe4d6aab671116523fb81c
;
  if (!key || key === 'sk-4bd3837a6afe4d6aab671116523fb81c
') {
    return res.status(500).json({ error: '请先配置 DeepSeek API Key' });
  }

  const messages = req.body && req.body.messages;
  if (!messages) return res.status(400).json({ error: '参数错误' });

  const body = JSON.stringify({
    model: 'deepseek-chat',
    max_tokens: 800,
    temperature: 0.7,
    messages
  });

  const options = {
    hostname: 'api.deepseek.com',
    path: '/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise((resolve) => {
    let finished = false;
    const done = () => { finished = true; resolve(); };

    const timer = setTimeout(() => {
      if (!finished) {
        request.destroy();
        res.status(504).json({ error: '⏱ 生成超时，请点击重试' });
        done();
      }
    }, TIMEOUT);

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        clearTimeout(timer);
        if (finished) return;
        try {
          const json = JSON.parse(data);
          if (response.statusCode !== 200) {
            res.status(response.statusCode).json({ error: json?.error?.message || '请求失败' });
          } else {
            res.json({ text: json.choices?.[0]?.message?.content || '' });
          }
        } catch (e) {
          res.status(500).json({ error: '解析失败：' + e.message });
        }
        done();
      });
    });

    request.on('error', (e) => {
      clearTimeout(timer);
      if (!finished) {
        res.status(500).json({ error: '网络错误：' + e.message });
        done();
      }
    });

    request.write(body);
    request.end();
  });
};
