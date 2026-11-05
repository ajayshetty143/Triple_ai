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

// Lightweight Raw API Call to Groq (or compatible OpenAI format)
async function callLLM({ systemPrompt, userPrompt, jsonMode = true }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in environment variables.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.2,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  return jsonMode ? cleanAndParseJSON(content) : content;
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
    // STEP 1: AGENT 1 - Data Gatherer & Telemetry Specialist
    // ==========================================
    const agent1SystemPrompt = `You are Agent 1 (Data Gatherer & Optical Specialist) in an autonomous city emergency command system.
Your job is to cross-reference the reported incident with live database sensors and attached camera/image evidence.

CRITICAL SENSOR ISOLATION & DECOUPLING RULE:
- The database contains background sensors (e.g. SENS-GAS-07 gas pipeline, SENS-FLOOD-01 water gauge). THESE ARE AMBIENT CITYWIDE READINGS.
- DO NOT correlate the gas leak or flood sensors with the incident UNLESS the incident text or camera label explicitly describes a gas leak, fire, or major flood!
- If the report or uploaded image is about a motorcycle, bicycle, vehicle skid, pedestrian fall, or traffic issue:
  • You MUST classify this as ROUTINE_LOCAL with priority LOW.
  • All gas and flood sensors MUST be marked as "UNRELATED_BACKGROUND". Leave critical_sensors EMPTY ([])!
  • The visual analysis MUST focus on the vehicle, motorcycle, or street scene shown in the evidence source.
  • UNDER NO CIRCUMSTANCES should you trigger a gas leak, fire, or flood disaster for a motorcycle, bike, or vehicle incident!

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "incident_summary": "Accurate 1-2 sentence summary of what actually happened",
  "affected_sector": "Specific sector or street (e.g. Local Street / Sector 4)",
  "incident_classification": "ROUTINE_LOCAL" | "MODERATE" | "SEVERE" | "CATASTROPHIC",
  "critical_sensors": [
    { "id": "SENSOR_ID", "name": "SENSOR_NAME", "status": "STATUS", "telemetry_finding": "only if genuinely related" }
  ],
  "visual_surveillance_analysis": "Optical description of attached evidence (e.g. motorcycle/vehicle identified, road surface, rider status)",
  "environmental_factors": "Weather, surface condition, or road congestion",
  "data_synthesis": "Crisp paragraph objectively summarizing the situation without exaggerating."
}`;

    const visualContext = mediaEvidence 
      ? `VISUAL EVIDENCE / SURVEILLANCE FEED:
Source Label: "${cameraSource || 'Live Stream / Citizen Upload'}"
Optical File Status: Evidence visual payload attached to dispatch dossier. Cross-reference this optical evidence (e.g. vehicle type, motorcycle, water depth, debris, or fire visible) with the incident and nearby sensors.`
      : `VISUAL EVIDENCE: No live optical feed attached. Relying on reported telemetry.`;

    const agent1UserPrompt = `CITIZEN INCIDENT REPORT:
"${incident}"

${visualContext}

LIVE CITY SENSOR TELEMETRY FROM SUPABASE:
${JSON.stringify(sensors, null, 2)}

Provide your structured JSON data summary now.`;

    const agent1Output = await callLLM({
      systemPrompt: agent1SystemPrompt,
      userPrompt: agent1UserPrompt,
      jsonMode: true,
    });

    // ==========================================
    // STEP 2: AGENT 2 - Infrastructure Risk Analyst
    // ==========================================
    const agent2SystemPrompt = `You are Agent 2 (Infrastructure Risk Analyst) in an autonomous city emergency command system.
You receive the exact telemetry summary from Agent 1.

CRITICAL PROPORTIONALITY RULE:
- If Agent 1 classifies the event as a local vehicle, motorcycle, bike skid, or pedestrian incident (ROUTINE_LOCAL):
  • Overall threat level MUST be "LOW" (or "MEDIUM" if traffic gridlock).
  • Cascading vulnerabilities are strictly limited to local lane blockage, ambulance transit time, or minor traffic congestion.
  • ABSOLUTELY DO NOT invent gas explosions, structural building collapse, or power grid failures for a motorcycle or bike incident!
- Only declare "HIGH" or "CRITICAL" if the incident explicitly involves real infrastructural disasters (e.g. verified gas fire, flood inundation, substation explosion).

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "overall_threat_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "primary_hazards": ["List 1-3 immediate physical hazards (e.g. injured rider, blocked lane)"],
  "cascading_vulnerabilities": [
    { "system": "e.g. Local Road Traffic", "risk": "Description of real risk" }
  ],
  "time_to_critical_failure": "e.g. N/A (Isolated Incident)",
  "analyst_assessment": "Realistic strategic assessment of whether this situation could escalate."
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
Your mission is to authorize a proportionate 3-step Emergency Action & Dispatch Plan.

STRICT DISPATCH PROPORTIONALITY RULE:
- If threat_level is LOW or ROUTINE (e.g. motorcycle incident, bike skid, pedestrian slip):
  • Directive Title: "LOCAL TRAFFIC & MEDICAL RESPONSE DIRECTIVE"
  • Threat Level: "LOW"
  • Phase 1: Dispatch local EMS ambulance squad to check on the rider/motorcyclist and provide first aid.
  • Phase 2: Dispatch local traffic patrol unit to secure the perimeter and move the motorcycle off the lane.
  • Phase 3: Verify road clearance, transport patient if required, and restore normal traffic flow.
  • STRICT NEGATIVE CONSTRAINT: Absolutely DO NOT dispatch Hazmat, Fire Engine Heavy Suppression, Power Grid Isolation squads, or Evacuation Centers! Do NOT issue evacuation orders!
  • Public bulletin: "Minor traffic slowdown. Emergency services responding to local vehicle incident. No civilian evacuation required."
- If threat_level is HIGH or CRITICAL (e.g. verified gas leak, chemical fire, flood):
  • Dispatch specialized Hazmat, heavy fire suppression, power isolation, and order evacuations.

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "directive_title": "Appropriate directive title (e.g. 'LOCAL INCIDENT: MEDICAL & TRAFFIC RESPONSE' for minor, or 'OPERATION SHIELD: CODE RED DIRECTIVE' for disaster)",
  "threat_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "three_step_dispatch_plan": [
    {
      "step": 1,
      "title": "Phase 1: Initial Response & Safety",
      "units_dispatched": ["EMS Ambulance Squad", "Local Traffic Patrol"],
      "action_orders": "Precise tactical command."
    },
    {
      "step": 2,
      "title": "Phase 2: Scene Management & Protection",
      "units_dispatched": ["Local Traffic Patrol"],
      "action_orders": "Precise tactical command."
    },
    {
      "step": 3,
      "title": "Phase 3: Route Clearance & Resolution",
      "units_dispatched": ["EMS Transport Unit"],
      "action_orders": "Precise tactical command."
    }
  ],
  "public_broadcast_alert": "Appropriate civilian advisory (e.g. 'Minor traffic delay. No civilian evacuation required' for minor events)",
  "status": "DISPATCH_AUTHORIZED"
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
