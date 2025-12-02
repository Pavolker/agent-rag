export async function askAboutDocument(documentText: string, question: string): Promise<{ text: string, sources: [] }> {
  const reduced = reduceContext(documentText, question);
  const messages = [
    { role: 'system', content: 'Você é um assistente útil que responde com base no contexto fornecido.' },
    { role: 'user', content: `Contexto:\n${reduced}\n\nPergunta: ${question}` }
  ];

  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  const ct = resp.headers.get('content-type') || '';
  if (!resp.ok || (!resp.body && !ct.includes('application/json'))) {
    const errText = await resp.text().catch(() => '');
    let message = 'Falha ao obter uma resposta do modelo de IA.';
    try {
      const json = JSON.parse(errText);
      if (json?.error) message = json.error;
      if (json?.code === 'invalid_api_key') message = 'Chave da OpenAI inválida.';
    } catch {}
    throw new Error(message);
  }

  const ct2 = resp.headers.get('content-type') || '';
  if (ct2.includes('application/json') || !resp.body) {
    const json = await resp.json();
    return { text: json?.text || '', sources: [] };
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let finalText = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // Parse SSE lines: data: {...}\n
    const lines = chunk.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.substring(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') finalText += delta;
      } catch {}
    }
  }

  return { text: finalText, sources: [] };
}

export async function askAboutDocumentStream(
  documentText: string,
  question: string,
  onDelta: (chunk: string) => void
): Promise<void> {
  const reduced = reduceContext(documentText, question);
  const messages = [
    { role: 'system', content: 'Você é um assistente útil que responde com base no contexto fornecido.' },
    { role: 'user', content: `Contexto:\n${reduced}\n\nPergunta: ${question}` }
  ];
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  const ct = resp.headers.get('content-type') || '';
  if (!resp.ok || (!resp.body && !ct.includes('application/json'))) {
    const errText = await resp.text().catch(() => '');
    let message = 'Falha ao obter uma resposta do modelo de IA.';
    try {
      const json = JSON.parse(errText);
      if (json?.error) message = json.error;
      if (json?.code === 'invalid_api_key') message = 'Chave da OpenAI inválida.';
    } catch {}
    throw new Error(message);
  }
  const ct2 = resp.headers.get('content-type') || '';
  if (ct2.includes('application/json') || !resp.body) {
    const json = await resp.json();
    const text = json?.text || '';
    if (text) onDelta(text);
    return;
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.substring(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') onDelta(delta);
      } catch {}
    }
  }
}

function reduceContext(documentText: string, question: string): string {
  const maxChars = 30000;
  const blocks = documentText.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  const terms = question.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t => t.length > 2);
  const stop = new Set(['de','da','do','e','a','o','os','as','um','uma','para','por','com','sem','em','no','na','nos','nas','que','como','qual','quais','porque','the','and','for','with','without','in','on','of']);
  const qset = new Set(terms.filter(t => !stop.has(t)));
  const scored = blocks.map(b => {
    const bw = b.toLowerCase().split(/[^\p{L}\p{N}]+/u);
    let score = 0;
    for (const w of bw) if (qset.has(w)) score++;
    return { b, score };
  });
  scored.sort((x, y) => y.score - x.score);
  let out = '';
  for (const s of scored) {
    if (out.length + s.b.length + 2 > maxChars) break;
    out += s.b + '\n\n';
  }
  if (!out) out = documentText.slice(0, maxChars);
  return out;
}
