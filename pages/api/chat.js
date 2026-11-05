// Bypass SSL inspection errors caused by local antivirus/proxy on Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
  }

  const systemPrompt = `You are the "City Command AI Intake Operator", an intelligent conversational agent (similar to Google Gemini / ChatGPT) for an autonomous urban emergency dispatch center.

YOUR OBJECTIVES:
1. Converse naturally, empathetically, and concisely with citizens, 911 callers, or field responders.
2. Quickly extract critical facts:
   - What happened? (e.g. bike skid, fallen pedestrian, fire, flood, power surge)
   - Location / Landmark / Sector
   - Any injuries or trapped persons?
   - Any roadway or transit blockage?
   - Any secondary hazards (fire, power lines, fuel leak)?
3. If the user gives brief input (e.g. "a person fell down on road by bike skid"), ask 1-2 focused, helpful triage questions (e.g., "Understood. Is the cyclist conscious or bleeding? Is traffic currently blocked?").
4. Keep replies under 3-4 sentences so emergency triage is fast.
5. In every reply, provide a ready-to-dispatch summary if sufficient info exists, ending with:
   [INCIDENT DOSSIER READY: "<A crisp 1-sentence description suitable for the 3-agent dispatch engine>"]`;

  try {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        temperature: 0.4,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const replyContent = data.choices[0]?.message?.content || 'Understood. Please provide more details.';

    // Check if an incident dossier was generated
    const dossierMatch = replyContent.match(/\[INCIDENT DOSSIER READY:\s*"([^"]+)"\]/i);
    const synthesizedIncident = dossierMatch ? dossierMatch[1] : null;

    return res.status(200).json({
      success: true,
      message: replyContent,
      synthesizedIncident: synthesizedIncident,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chat operator error',
    });
  }
}
