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
${fileName ? `Incoming Evidence File Name: "${fileName}"` : ''}

Analyze the attached visual evidence carefully and objectively:
1. Examine if there is any visible harm, accident, collision, crashed or damaged vehicle, overturned car, fallen cyclist/motorcyclist/pedestrian, roadway obstruction, fire, smoke, flood, or injury.
2. If an accident, collision, damage, or injury is present:
   - Identify what happened (e.g. overturned car, collision between vehicles, road accident, casualty on asphalt).
   - Identify the vehicles and individuals involved.
   - You MUST mark harm_detected as true.
   - Set severity to "ROUTINE_LOCAL" for road collisions, vehicle accidents, skids, or "CRITICAL" for major fires/explosions.
   - List appropriate response units (e.g. EMS Ambulance Squad, Local Traffic Patrol, Fire & Rescue).
   - In suggested_incident_text: Provide an authoritative dispatch briefing describing the accident and requesting immediate units.
3. If the scene is safe, peaceful, an intact parked vehicle/motorcycle with zero crash damage, an empty street, or normal pedestrians walking:
   - Mark harm_detected as false.
   - Set severity to "ALL_CLEAR".
   - State clearly in scene_description that the scene is peaceful and hazard-free.
   - recommended_units should be [].

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "harm_detected": true | false,
  "severity": "ALL_CLEAR" | "ROUTINE_LOCAL" | "CRITICAL",
  "scene_description": "Precise, objective description of what is visible in the image",
  "objects_detected": ["list of key objects observed, e.g. overturned car, bicycle, debris, person"],
  "recommended_units": ["unit names"],
  "suggested_incident_text": "A clear 1-2 sentence report suitable for emergency dispatch"
}`;

  try {
    let data = null;
    for (let attempt = 0; attempt < 2; attempt++) {
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

        if (response.status === 429 && attempt === 0) {
          console.warn('Groq Vision 429 rate limit, waiting 2s...');
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq Vision API error (${response.status}): ${errText}`);
        }

        data = await response.json();
        break;
      } catch (err) {
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        throw err;
      }
    }
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
