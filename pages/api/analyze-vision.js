// Bypass SSL inspection errors caused by local antivirus/proxy on Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { imagePayload, fileName } = req.body;
  if (!imagePayload) {
    return res.status(400).json({ error: 'Image payload is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
  }

  const promptText = `You are the Optical Intelligence Computer Vision Specialist in an autonomous municipal emergency command system.
Analyze the attached visual evidence carefully and objectively:
1. Examine if there is any visible harm, accident, collision, fallen pedestrian/cyclist, fire, smoke, flood, or injury.
2. If an accident or injury is present:
   - Identify the victims (e.g. fallen cyclist on pavement, injured pedestrian).
   - Identify the vehicles involved (e.g. bicycle, compact car, motorcycle).
   - Mark harm_detected as true.
   - Set severity to "ROUTINE_LOCAL" for minor/moderate accidents (e.g. cyclist fall, vehicle scrape) or "CRITICAL" for major fires/explosions.
   - List appropriate response units (e.g. EMS Ambulance Squad, Local Traffic Patrol).
3. If the scene is safe, peaceful, a parked vehicle/motorcycle with no crash damage, an empty street, or normal pedestrians walking:
   - Mark harm_detected as false.
   - Set severity to "ALL_CLEAR".
   - State clearly in scene_description that the scene is peaceful and hazard-free.
   - recommended_units should be [].

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "harm_detected": true | false,
  "severity": "ALL_CLEAR" | "ROUTINE_LOCAL" | "CRITICAL",
  "scene_description": "Precise, objective description of what is visible in the image",
  "objects_detected": ["list of key objects observed, e.g. bicycle, person lying down, car"],
  "recommended_units": ["unit names"],
  "suggested_incident_text": "A clear 1-2 sentence report suitable for emergency dispatch"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        max_tokens: 350,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: { url: imagePayload },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq Vision API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.status(200).json({
      success: true,
      analysis: parsed,
    });
  } catch (error) {
    console.error('Vision analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Vision analysis failed',
    });
  }
}
