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

  const systemPrompt = `You are the "City Command AI Intake Operator", an intelligent emergency triage conversational agent (similar to Google Gemini / ChatGPT) for an autonomous urban emergency dispatch center.
${evidenceLabel ? `CURRENT ATTACHED OPTICAL EVIDENCE IN SURVEILLANCE VIEWPORT: "${evidenceLabel}"` : ''}

YOUR OBJECTIVES:
1. Converse naturally, empathetically, and concisely with citizens, 911 callers, or field responders.
2. Quickly extract critical facts:
   - What happened? (e.g. building fire, structure fire, collision, fallen cyclist, flood, explosion, gas leak, or harmless parked vehicle)
   - Location / Landmark / Sector
   - Any injuries or trapped persons?
   - Any secondary hazards (fire spreading, power lines, fuel leak)?
3. SCENARIO AWARENESS:
   - If the user reports an active fire, building on fire, explosion, or major crisis:
     Acknowledge immediate dispatch, ask for nearest address/trapped victims, and IMMEDIATELY generate a CODE RED dossier:
     [INCIDENT DOSSIER READY: "Critical structural fire / emergency reported at building. Immediate multi-unit Fire Suppression, EMS Rescue, and Hazard Isolation dispatched."]
   - If the user reports a traffic accident, fallen cyclist, or medical incident:
     Compile a proportional routine/moderate dossier:
     [INCIDENT DOSSIER READY: "Local traffic incident: collision / person down on roadway. Routine EMS ambulance squad and traffic patrol dispatched."]
   - If the user indicates or shows a harmless object, parked vehicle/motorcycle, or says "no one is hurt / just a photo / all clear":
     Compile an ALL CLEAR dossier:
     [INCIDENT DOSSIER READY: "Optical surveillance confirms safe municipal baseline. Harmless stationary vehicle/scene with zero collisions, zero injuries, zero structural damage, and no active hazards. Confirm All Clear green status."]
4. Keep replies under 2-3 sentences so emergency triage is instantaneous.
5. MANDATORY EMERGENCY RULE: In EVERY SINGLE turn where the user describes any emergency, fire, hazard, accident, or asks for dispatch, YOU MUST ALWAYS APPEND [INCIDENT DOSSIER READY: "..."] at the very end of your response! NEVER omit the dossier, even when asking clarifying questions!`;

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
            max_tokens: 300,
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
    const dossierMatch = replyContent.match(/\[INCIDENT DOSSIER READY:\s*["']?([\s\S]*?)["']?\]/i);
    let synthesizedIncident = dossierMatch ? dossierMatch[1].trim() : null;
    const cleanMessage = replyContent.replace(/\[INCIDENT DOSSIER READY:[\s\S]*?\]/gi, '').trim();

    // Fallback: If model did not emit the exact dossier bracket tag, programmatically synthesize one
    const lastUserMsg = messages.slice().reverse().find(m => m.role === 'user')?.content || '';
    const lastUserLower = lastUserMsg.toLowerCase();

    if (!synthesizedIncident && lastUserMsg) {
      if (lastUserLower.includes('fire') || lastUserLower.includes('blaze') || lastUserLower.includes('burn') || lastUserLower.includes('smoke') || lastUserLower.includes('explosion') || lastUserLower.includes('gas') || lastUserLower.includes('flood')) {
        synthesizedIncident = `Critical Emergency Report: ${lastUserMsg.trim()}. Multi-unit Fire Suppression, Hazmat, and EMS rescue dispatched.`;
      } else if (lastUserLower.includes('accident') || lastUserLower.includes('crash') || lastUserLower.includes('skid') || lastUserLower.includes('injured') || lastUserLower.includes('cyclist') || lastUserLower.includes('fell') || lastUserLower.includes('down')) {
        synthesizedIncident = `Local Traffic Incident Report: ${lastUserMsg.trim()}. Routine EMS Ambulance and Traffic Patrol response dispatched.`;
      } else if (lastUserLower.includes('safe') || lastUserLower.includes('clear') || lastUserLower.includes('normal') || lastUserLower.includes('parked')) {
        synthesizedIncident = `Routine Baseline Observation: Optical surveillance confirms safe municipal baseline conditions.`;
      }
    }

    // Determine suggested priority for UI synchronization
    let suggestedPriority = 'minor';
    const textToCheck = `${synthesizedIncident || ''} ${cleanMessage} ${lastUserMsg}`.toLowerCase();
    if (textToCheck.includes('fire') || textToCheck.includes('blaze') || textToCheck.includes('burn') || textToCheck.includes('explosion') || textToCheck.includes('gas') || textToCheck.includes('leak') || textToCheck.includes('flood') || textToCheck.includes('critical') || textToCheck.includes('trapped')) {
      suggestedPriority = 'critical';
    } else if (textToCheck.includes('safe') || textToCheck.includes('all clear') || textToCheck.includes('peaceful') || textToCheck.includes('normal baseline') || textToCheck.includes('parked motorcycle') || textToCheck.includes('parked vehicle')) {
      suggestedPriority = 'safe';
    }

    return res.status(200).json({
      success: true,
      message: cleanMessage || replyContent,
      rawMessage: replyContent,
      synthesizedIncident: synthesizedIncident,
      suggestedPriority: suggestedPriority,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chat operator error',
    });
  }
}

