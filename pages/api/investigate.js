// Bypass SSL inspection errors caused by local antivirus, VPN, or corporate proxy on Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { supabase } from '../../lib/supabaseClient';

// Helper to strip markdown code fences and parse JSON safely
function cleanAndParseJSON(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (e1) {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error('Failed to parse JSON from LLM:', rawText);
      return { raw_output: rawText, parse_fallback: true };
    }
  }
}

// Resilient Multi-Model Groq Dispatch with Vision & Failover Pool
async function callLLM({ systemPrompt, userPrompt, jsonMode = true, imageUrl = null }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in environment variables.');
  }

  // If an image is attached, prioritize the multimodal vision model qwen/qwen3.8-27b
  const modelPool = imageUrl 
    ? ['qwen/qwen3.8-27b'] 
    : ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];

  const userMessageContent = imageUrl
    ? [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ]
    : userPrompt;

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
          max_tokens: 450,
          temperature: 0.1,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessageContent },
          ],
        }),
      });

      // Handle 429 Rate Limit seamlessly by failing over to the next model in pool
      if (response.status === 429) {
        console.warn(`Groq 429 Rate Limit hit on model ${currentModel}. Auto-switching to next model in pool...`);
        if (i < modelPool.length - 1) {
          continue; // Seamlessly try next model
        } else {
          console.warn('All models rate limited. Waiting 3.2s cooldown backoff...');
          await new Promise(r => setTimeout(r, 3200));
          const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              max_tokens: 450,
              temperature: 0.1,
              response_format: jsonMode ? { type: 'json_object' } : undefined,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessageContent },
              ],
            }),
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            const content = data.choices[0]?.message?.content || '{}';
            return jsonMode ? cleanAndParseJSON(content) : content;
          }
        }
      }

      if (!response.ok) {
        const errorBody = await response.text();
        if (i < modelPool.length - 1) {
          console.warn(`Error on ${currentModel} (${response.status}), switching model:`, errorBody);
          continue;
        }
        throw new Error(`Groq API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      return jsonMode ? cleanAndParseJSON(content) : content;
    } catch (err) {
      if (i < modelPool.length - 1) {
        console.warn(`Attempt on ${currentModel} failed, trying ${modelPool[i + 1]}:`, err.message);
        continue;
      }
      throw err;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const startTime = Date.now();
  const { incident, mediaEvidence, cameraSource, imagePayload } = req.body;

  if (!incident || typeof incident !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid incident description.' });
  }

  try {
    // ==========================================
    // STEP 0: Query Supabase Database for Sensor Data
    // ==========================================
    let sensors = [];
    try {
      const { data, error } = await supabase.from('city_sensors').select('*');
      if (error) {
        console.warn('Supabase fetch error, using fallback sensor data:', error.message);
      } else if (data && data.length > 0) {
        sensors = data;
      }
    } catch (dbErr) {
      console.warn('Could not connect to Supabase, continuing with fallback:', dbErr.message);
    }

    // ==========================================
    // STEP 1: AGENT 1 - Data Gatherer & Optical Intelligence Specialist
    // ==========================================
    const agent1SystemPrompt = `You are Agent 1 (Data Gatherer & Optical Intelligence Specialist) in an autonomous city emergency command system.
Your job is to critically evaluate the attached optical image evidence (if provided), the incident report, and database sensors.

CRITICAL FIRST QUESTION: IS THERE ANY ACTUAL HARM, HAZARD, OR EMERGENCY PRESENT?
- Examine the attached visual image directly (if provided) and the incident report:
  • If the image shows an active collision, a fallen cyclist or pedestrian lying on the asphalt, an injured person, or a vehicle accident:
    - You MUST mark is_harm_detected as true.
    - You MUST classify this incident as "ROUTINE_LOCAL".
    - Describe the exact scene in visual_surveillance_analysis (e.g. "Visual inspection confirms a cyclist lying on the road next to a fallen bicycle and vehicle. Collision and casualty detected.").
    - critical_sensors MUST be empty ([]).
  • If the image shows a normal peaceful scene, a parked vehicle/motorcycle with no crash damage, an empty street, or normal pedestrian:
    - You MUST mark is_harm_detected as false.
    - You MUST classify this incident as "ALL_CLEAR_SAFE".
    - State clearly in visual_surveillance_analysis: "Visual inspection confirms a safe, normal scene with NO collision, NO fire, NO spill, NO injuries, and NO structural damage."
    - critical_sensors MUST be empty ([]).
  • Only classify as "SEVERE" or "CATASTROPHIC" if an actual hazardous crisis is reported (gas explosion, heavy flood, substation fire).

CRITICAL SENSOR DECOUPLING RULE:
- The database contains background sensors (e.g. SENS-GAS-07 gas pipeline, SENS-FLOOD-01 flood gauge) which are remote citywide monitors.
- DO NOT correlate gas or flood sensors with a vehicle, motorcycle, cyclist, or street observation unless the report explicitly states a gas explosion, fire, or flood!
- If the report or visual feed is about a motorcycle, bicycle, parked vehicle, normal street, or safe baseline:
  • All background gas/flood sensors are UNRELATED.
  • critical_sensors MUST be empty ([]).
  • UNDER NO CIRCUMSTANCES should you trigger a gas leak or evacuation for a vehicle, motorcycle, or peaceful scene!

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "incident_summary": "Accurate 1-2 sentence summary of observation",
  "affected_sector": "Specific sector or street",
  "incident_classification": "ALL_CLEAR_SAFE" | "ROUTINE_LOCAL" | "MODERATE" | "SEVERE" | "CATASTROPHIC",
  "is_harm_detected": true | false,
  "critical_sensors": [
    { "id": "SENSOR_ID", "name": "SENSOR_NAME", "status": "STATUS", "telemetry_finding": "only if genuinely related" }
  ],
  "visual_surveillance_analysis": "Exact optical description of evidence and confirmation whether any harm/damage is observed",
  "environmental_factors": "Normal ambient conditions or specific weather",
  "data_synthesis": "Crisp paragraph objectively evaluating whether an emergency exists or if scene is completely safe."
}`;

    const visualContext = mediaEvidence 
      ? `VISUAL EVIDENCE / SURVEILLANCE FEED:
Source Label: "${cameraSource || 'Live Stream / Citizen Upload'}"
Optical File Status: Attached visual payload provided. Cross-reference this optical evidence directly.`
      : `VISUAL EVIDENCE: No live optical feed attached. Relying on reported telemetry.`;

    const agent1UserPrompt = `CITIZEN INCIDENT REPORT:
"${incident}"

${visualContext}

LIVE CITY SENSOR TELEMETRY FROM SUPABASE:
${JSON.stringify(sensors, null, 2)}

Inspect the optical evidence and provide your structured JSON data summary now.`;

    const validImageUrl = imagePayload && typeof imagePayload === 'string' && (imagePayload.startsWith('data:image/') || imagePayload.startsWith('http')) 
      ? imagePayload 
      : null;

    const agent1Output = await callLLM({
      systemPrompt: agent1SystemPrompt,
      userPrompt: agent1UserPrompt,
      jsonMode: true,
      imageUrl: validImageUrl,
    });

    // ==========================================
    // STEP 2: AGENT 2 - Infrastructure Risk Analyst
    // ==========================================
    const agent2SystemPrompt = `You are Agent 2 (Infrastructure Risk Analyst) in an autonomous city emergency command system.
You receive the exact telemetry summary from Agent 1.

CRITICAL THREAT & PROPORTIONALITY RULE:
- If Agent 1 classifies the event as "ALL_CLEAR_SAFE" (no harm, normal vehicle photo, peaceful scene):
  • overall_threat_level MUST be "ALL_CLEAR".
  • primary_hazards MUST be ["No active hazards detected - Normal municipal operations"].
  • cascading_vulnerabilities MUST be [{ "system": "City Infrastructure", "risk": "Normal safe baseline. No infrastructure risk." }].
  • time_to_critical_failure: "None (System Stable)".
  • analyst_assessment: "Optical and telemetry review confirms baseline stability. Zero emergency risk."
- If Agent 1 classifies as "ROUTINE_LOCAL" (e.g. bike skid, minor road blockage):
  • overall_threat_level MUST be "LOW".
  • Cascading risks are limited to minor traffic delay.
- Only declare "HIGH" or "CRITICAL" if verified disasters exist (gas leak, chemical fire, flood inundation).

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "overall_threat_level": "ALL_CLEAR" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "primary_hazards": ["List of hazards or 'No active hazards'"],
  "cascading_vulnerabilities": [
    { "system": "System name", "risk": "Description of risk" }
  ],
  "time_to_critical_failure": "Timeframe or 'None (System Stable)'",
  "analyst_assessment": "Clear objective risk assessment."
}`;

    const agent2UserPrompt = `AGENT 1 (DATA GATHERER) SITUATIONAL REPORT:
${JSON.stringify(agent1Output, null, 2)}

Analyze the risks and produce your structured JSON risk assessment.`;

    const agent2Output = await callLLM({
      systemPrompt: agent2SystemPrompt,
      userPrompt: agent2UserPrompt,
      jsonMode: true,
    });

    // ==========================================
    // STEP 3: AGENT 3 - City Commander & Dispatcher
    // ==========================================
    const agent3SystemPrompt = `You are Agent 3 (City Commander) in the Municipal Emergency Command Center.
You receive the exact cascading risk analysis from Agent 2 and telemetry from Agent 1.
Your mission is to authorize an authoritative, calibrated response.

CRITICAL DISPATCH RULES:
- If threat_level is "ALL_CLEAR" (no harm detected in photo or text, normal parked vehicle, peaceful observation):
  • directive_title: "ALL CLEAR: ROUTINE OBSERVATION DIRECTIVE"
  • threat_level: "ALL_CLEAR" (GREEN LIGHT STATUS)
  • three_step_dispatch_plan: [
      {
        "step": 1,
        "title": "Phase 1: Optical Evidence Verification",
        "units_dispatched": ["Automated City Vision Monitor"],
        "action_orders": "Visual evidence verified clear of hazards. No physical emergency units required."
      },
      {
        "step": 2,
        "title": "Phase 2: Baseline Telemetry Check",
        "units_dispatched": ["IoT Network Telemetry"],
        "action_orders": "Area sensors confirmed operating within normal parameters."
      },
      {
        "step": 3,
        "title": "Phase 3: Log Archival & Passive Surveillance",
        "units_dispatched": ["Municipal Log Archive"],
        "action_orders": "Observation archived to city records. Standard traffic and public flow maintained."
      }
    ]
  • public_broadcast_alert: "All clear. Normal municipal operations active. No emergency response required."
- If threat_level is "LOW" or "ROUTINE" (actual minor bike skid, pedestrian slip):
  • directive_title: "LOCAL TRAFFIC & MEDICAL RESPONSE DIRECTIVE"
  • threat_level: "LOW" (GREEN LIGHT STATUS)
  • Units: EMS Ambulance Squad + Local Traffic Patrol (No Hazmat, no evacuations).
  • public_broadcast_alert: "Minor traffic slowdown. Emergency services responding to local vehicle incident. No civilian evacuation required."
- If threat_level is "HIGH" or "CRITICAL" (gas explosion, heavy flood):
  • Deploy Hazmat, Fire Suppression, and Evacuation orders.

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "directive_title": "Directive title",
  "threat_level": "ALL_CLEAR" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "three_step_dispatch_plan": [
    {
      "step": 1,
      "title": "Phase 1 Title",
      "units_dispatched": ["Unit Name"],
      "action_orders": "Action description"
    },
    {
      "step": 2,
      "title": "Phase 2 Title",
      "units_dispatched": ["Unit Name"],
      "action_orders": "Action description"
    },
    {
      "step": 3,
      "title": "Phase 3 Title",
      "units_dispatched": ["Unit Name"],
      "action_orders": "Action description"
    }
  ],
  "public_broadcast_alert": "Public advisory statement",
  "status": "DISPATCH_AUTHORIZED" | "ALL_CLEAR_VERIFIED"
}`;

    const agent3UserPrompt = `AGENT 2 (RISK ANALYST) ASSESSMENT:
${JSON.stringify(agent2Output, null, 2)}

AGENT 1 (TELEMETRY SUMMARY):
${JSON.stringify(agent1Output, null, 2)}

Issue the proportionate 3-Step Emergency Action Plan in JSON.`;

    const agent3Output = await callLLM({
      systemPrompt: agent3SystemPrompt,
      userPrompt: agent3UserPrompt,
      jsonMode: true,
    });

    const executionDurationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      meta: {
        execution_time_ms: executionDurationMs,
        sensors_consulted: sensors.length,
        camera_source: cameraSource || 'Municipal Camera Feed',
        attached_image: imagePayload || null,
        timestamp: new Date().toISOString(),
      },
      pipeline: {
        agent1_data_gatherer: agent1Output,
        agent2_risk_analyst: agent2Output,
        agent3_city_commander: agent3Output,
      },
    });
  } catch (error) {
    const detailedMsg = error.cause ? `${error.message} (${error.cause.message || error.cause.code})` : error.message;
    console.error('Pipeline execution error:', detailedMsg, error);
    return res.status(500).json({
      success: false,
      error: detailedMsg || 'Internal Server Error in Agent Cascade',
    });
  }
}
