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

  // Convert history to Gemini format
  const geminiHistory = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Separate last user message from history
  const lastMessage = geminiHistory.pop();

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el servidor.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [...geminiHistory, lastMessage],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        }
      }),
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch(e) {
      return res.status(500).json({ error: 'Gemini devolvió respuesta inválida: ' + raw.slice(0, 200) });
    }

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
