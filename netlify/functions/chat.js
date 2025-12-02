exports.handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'OPENAI_API_KEY não configurada' })
      };
    }

    const { messages = [], model = 'gpt-4o-mini' } = JSON.parse(event.body || '{}');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        max_tokens: 1024
      })
    });

    const text = await resp.text();
    if (!resp.ok) {
      let payload;
      try { payload = JSON.parse(text); } catch { payload = { error: { message: text } }; }
      const status = resp.status || 500;
      const code = payload?.error?.code || null;
      const message = payload?.error?.message || 'Falha na chamada OpenAI';
      return {
        statusCode: status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: message, code })
      };
    }

    let data;
    try { data = JSON.parse(text); } catch { data = { choices: [{ message: { content: text } }] }; }
    const content = data?.choices?.[0]?.message?.content || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, sources: [] })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err?.message || 'Erro desconhecido' })
    };
  }
};
