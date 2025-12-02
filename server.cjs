// Simple OpenAI proxy server with streaming (SSE)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });
require('dotenv').config({ path: path.resolve(__dirname, '.env.local'), override: true });
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 8787;

app.use(cors({ origin: '*', methods: ['POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.OPENAI_API_KEY;
  res.json({ ok: true, hasKey });
});

app.post('/api/chat', async (req, res) => {
  try {
    let apiKey = process.env.OPENAI_API_KEY;
    let source = 'env';
    if (!apiKey) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPaths = [path.resolve(__dirname, '.env'), path.resolve(__dirname, '.env.local')];
        for (const p of envPaths) {
          if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf8');
            const match = content.match(/OPENAI_API_KEY=(.*)/);
            if (match && match[1]) {
              apiKey = match[1].trim();
              source = p;
              break;
            }
          }
        }
      } catch {}
    }
    if (!apiKey) {
      console.error('OPENAI_API_KEY ausente no process.env e nos arquivos .env/.env.local');
      return res.status(500).json({ error: 'OPENAI_API_KEY não configurada' });
    }
    console.log(`POST /api/chat usando chave de: ${source}`);

    const { messages = [], model = 'gpt-4o-mini' } = req.body || {};

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: 1024
      })
    });

    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => '');
      let payload;
      try { payload = JSON.parse(text); } catch { payload = { error: { message: text } }; }
      const status = resp.status || 500;
      const code = payload?.error?.code || null;
      const message = payload?.error?.message || 'Falha na chamada OpenAI';
      return res.status(status).json({ error: message, code });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = resp.body.getReader();
    const encoder = new TextEncoder();

    async function pump() {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    }
    pump().catch((err) => {
      console.error('Erro no streaming:', err);
      try { res.end(); } catch {}
    });
  } catch (err) {
    console.error('Erro /api/chat:', err);
    res.status(500).json({ error: err?.message || 'Erro desconhecido' });
  }
});

app.listen(PORT, () => {
  console.log(`OpenAI proxy on http://localhost:${PORT}`);
});
