// Bypass SSL inspection errors caused by local antivirus/proxy on Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { messages, evidenceLabel } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
  }

  const systemPrompt = `You are the "City Command AI Intake Operator", an intelligent conversational agent (similar to Google Gemini / ChatGPT) for an autonomous urban emergency dispatch center.
${evidenceLabel ? `CURRENT ATTACHED OPTICAL EVIDENCE IN SURVEILLANCE VIEWPORT: "${evidenceLabel}"` : ''}

YOUR OBJECTIVES:
1. Converse naturally, empathetically, and concisely with citizens, 911 callers, or field responders.
2. Quickly extract critical facts:
   - What happened? (e.g. parked vehicle, peaceful observation, bike skid, fallen pedestrian, fire, flood, power surge)
   - Location / Landmark / Sector
   - Any injuries or trapped persons?
   - Any roadway or transit blockage?
   - Any secondary hazards (fire, power lines, fuel leak)?
3. SCENARIO AWARENESS:
   - If the user indicates or shows a harmless object, parked vehicle/motorcycle, or says "no one is hurt / just a photo / all clear":
     Acknowledge that optical evidence confirms a safe baseline. Compile an ALL CLEAR dossier:
     [INCIDENT DOSSIER READY: "Optical surveillance confirms safe baseline conditions. Harmless stationary vehicle/scene with zero collisions, zero injuries, zero structural damage, and no active hazards. Confirm All Clear green status."]
   - If the user reports a minor incident (e.g. "a person fell down on road by bike skid"):
     Compile a proportional low-priority dossier:
     [INCIDENT DOSSIER READY: "Local traffic incident: conscious individual down on roadway following minor bike skid. Roadway traffic slowed. Routine EMS ambulance and traffic officer requested."]
   - If a major catastrophe is reported (gas explosion, heavy flood, substation fire):
     Compile a critical code-red dossier:
     [INCIDENT DOSSIER READY: "Critical urban hazard: active gas leak / fire / flood reported. Emergency multi-unit Hazmat and Fire suppression required."]
4. Keep replies under 3-4 sentences so emergency triage is fast.
5. In every reply, provide the [INCIDENT DOSSIER READY: "..."] when sufficient context exists.`;

  try {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const modelPool = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    let replyContent = 'Understood. Please provide more details.';

    for (let i = 0; i < modelPool.length; i++) {
      const currentModel = modelPool[i];
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            temperature: 0.4,
            messages: formattedMessages,
          }),
        });

        if (response.status === 429 && i < modelPool.length - 1) {
          console.warn(`Chat operator 429 on ${currentModel}. Switching to ${modelPool[i + 1]}...`);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          if (i < modelPool.length - 1) continue;
          throw new Error(`Groq API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        replyContent = data.choices[0]?.message?.content || replyContent;
        break;
      } catch (err) {
        if (i < modelPool.length - 1) continue;
        throw err;
      }
    }

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

