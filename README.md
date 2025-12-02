# OpenAI Chat Proxy (Streaming)

Servidor Node.js simples para intermediar chamadas à API da OpenAI (`/api/chat`), com streaming de respostas (SSE) e sem expor a chave no frontend.

## Uso

1. Defina a chave no ambiente:
   - `export OPENAI_API_KEY='sua_chave'`
2. Inicie o proxy:
   - `npm run api`
3. Inicie o app (Vite):
   - `npm run dev`
4. Acesse:
   - `http://localhost:3000/`

O frontend chama `/api/chat`. O Vite faz proxy para `http://localhost:8787` e o servidor reencaminha para `https://api.openai.com/v1/chat/completions` com `stream: true`.
