export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { docs = [], history = [] } = req.body;

  if (!history.length) {
    return res.status(400).json({ error: 'No hay mensajes.' });
  }

  // Build system prompt with RAG context
  let systemPrompt = 'Eres un asistente útil y preciso. Responde siempre en español.';

  if (docs.length > 0) {
    const context = docs
      .map(d => `--- DOCUMENTO: ${d.name} ---\n${d.text.slice(0, 8000)}`)
      .join('\n\n');

    systemPrompt = `Eres un asistente experto en análisis de documentos. Responde siempre en español.
Tienes acceso a los siguientes documentos como contexto. Usa su información para responder con precisión.
Si la respuesta no está en los documentos, indícalo claramente.

${context}`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: history,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.content?.[0]?.text || 'Sin respuesta.';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
