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
  const { incident, mediaEvidence, cameraSource } = req.body;

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
    const agent1SystemPrompt = `You are Agent 1 (Data Gatherer & Urban Sensor Specialist) in an autonomous city emergency command system.
Your job is to cross-reference the reported citizen incident with live sensor telemetry from our database AND any visual camera evidence.

CRUCIAL RULE OF RELEVANCE:
- Evaluate whether the reported incident is an isolated, minor, or routine event (e.g. a bike skid, slip and fall, minor traffic bump) OR a major infrastructure disaster (e.g. gas explosion, flood, structural failure).
- Do NOT associate unrelated sensors! If someone fell off a bicycle and there is no mention or physical evidence of a gas rupture or flood, state clearly that the gas and flood sensors are UNRELATED baseline readings.
- Calibrate the incident severity objectively.

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "incident_summary": "Accurate 1-2 sentence summary of what actually happened",
  "affected_sector": "Specific sector (e.g. Sector 4, Sector 2, or Local Street)",
  "incident_classification": "ROUTINE_LOCAL" | "MODERATE" | "SEVERE" | "CATASTROPHIC",
  "critical_sensors": [
    { "id": "SENSOR_ID", "name": "SENSOR_NAME", "status": "STATUS", "telemetry_finding": "brief finding only if relevant" }
  ],
  "visual_surveillance_analysis": "Optical findings from camera feed or visual evidence",
  "environmental_factors": "Weather, surface condition, or road congestion",
  "data_synthesis": "Crisp paragraph objectively summarizing the situation without exaggerating."
}`;

    const visualContext = mediaEvidence 
      ? `VISUAL EVIDENCE / SURVEILLANCE FEED:
Source: ${cameraSource || 'Live Stream / Citizen Upload'}
Visual Analysis Payload: Visual evidence attached and active.`
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

CRUCIAL PROPORTIONALITY RULE:
- Assess cascading risks in proportion to the real event.
- For minor or localized incidents (e.g. bike fall, medical slip), cascading risks are typically minimal (e.g. minor lane obstruction, ambulance arrival time, rubbernecking). Do NOT invent power outages or chemical explosions for minor events!
- For major disasters (e.g. gas leak, major flood, substation fire), analyze full cascading infrastructure failures.

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "overall_threat_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "primary_hazards": ["List 1-3 immediate physical hazards"],
  "cascading_vulnerabilities": [
    { "system": "System name (e.g. Traffic Flow, Local Medical Access, Power Grid)", "risk": "Description of real risk" }
  ],
  "time_to_critical_failure": "Estimated timeframe (e.g. N/A for minor, or '15-30 mins' for severe)",
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

CRUCIAL DISPATCH PROPORTIONALITY RULE:
- If threat_level is LOW or ROUTINE (e.g. bike skid, fallen pedestrian):
  • Step 1: Dispatch local EMS ambulance/paramedic to treat the injured person.
  • Step 2: Dispatch local traffic officer to clear the blocked lane.
  • Step 3: Monitor route clearance and patient transport.
  • Do NOT dispatch Hazmat, do NOT shut down the power grid, and do NOT order citywide evacuations!
- If threat_level is HIGH or CRITICAL (e.g. gas fire, flood, grid failure):
  • Dispatch specialized Hazmat, heavy fire suppression, power isolation, and order evacuations.

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "directive_title": "Appropriate directive title (e.g. 'LOCAL INCIDENT: MEDICAL & TRAFFIC RESPONSE' for minor, or 'OPERATION SHIELD: CODE RED DIRECTIVE' for disaster)",
  "threat_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "three_step_dispatch_plan": [
    {
      "step": 1,
      "title": "Phase 1: Initial Response & Safety",
      "units_dispatched": ["Unit Name 1", "Unit Name 2"],
      "action_orders": "Precise tactical command."
    },
    {
      "step": 2,
      "title": "Phase 2: Scene Management & Protection",
      "units_dispatched": ["Unit Name 1"],
      "action_orders": "Precise tactical command."
    },
    {
      "step": 3,
      "title": "Phase 3: Route Clearance & Resolution",
      "units_dispatched": ["Unit Name 1"],
      "action_orders": "Precise tactical command."
    }
  ],
  "public_broadcast_alert": "Appropriate civilian advisory (or 'No civilian evacuation required. Minor traffic slowdown expected' for minor events)",
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
