exports.handler = async () => {
  const hasKey = !!process.env.OPENAI_API_KEY;
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, hasKey })
  };
};
