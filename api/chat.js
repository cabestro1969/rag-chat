export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { docs = [], history = [] } = req.body;

  if (!history.length) {
    return res.status(400).json({ error: 'No hay mensajes.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada en el servidor.' });
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

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch(e) {
      return res.status(500).json({ error: 'Respuesta inválida del servidor: ' + raw.slice(0, 200) });
    }

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sin respuesta.';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
