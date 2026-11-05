// Bypass SSL inspection errors caused by local antivirus, VPN, or corporate proxy on Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { supabase } from '../../lib/supabaseClient';

// Helper to strip markdown code fences and parse JSON safely
function cleanAndParseJSON(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (e1) {
    // Strip ```json and ``` if present
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
    return res.status(455).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const startTime = Date.now();
  const { incident } = req.body;

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
Your job is to cross-reference the reported citizen incident with the live sensor telemetry from our database.
Analyze which sensors indicate anomalies, identify the primary affected zone, and summarize the ground truth.

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "incident_summary": "Short 1-2 sentence summary of report",
  "affected_sector": "e.g. Sector 4",
  "critical_sensors": [
    { "id": "SENSOR_ID", "name": "SENSOR_NAME", "status": "STATUS", "telemetry_finding": "brief finding" }
  ],
  "environmental_factors": "e.g. Weather, congestion, or water levels",
  "data_synthesis": "Crisp paragraph summarizing what the data objectively reveals."
}`;

    const agent1UserPrompt = `CITIZEN INCIDENT REPORT:
"${incident}"

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
Your job is to deduce cascading infrastructural vulnerabilities (e.g. what happens if gas lines ignite near power stations, road flooding cutting off trauma centers, grid failure).

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "overall_threat_level": "CRITICAL" | "HIGH" | "MEDIUM",
  "primary_hazards": ["List of 2-3 immediate physical threats"],
  "cascading_vulnerabilities": [
    { "system": "e.g. Power Grid", "risk": "Description of cascading threat" },
    { "system": "e.g. Medical Evacuation", "risk": "Description of access threat" }
  ],
  "time_to_critical_failure": "e.g. 20-30 minutes if uncontained",
  "analyst_assessment": "Crisp strategic explanation of why this situation could escalate."
}`;

    const agent2UserPrompt = `AGENT 1 (DATA GATHERER) SITUATIONAL REPORT:
${JSON.stringify(agent1Output, null, 2)}

Analyze the cascading infrastructure risks and produce your structured JSON risk assessment.`;

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
Your mission is to authorize a decisive, numbered, 3-step Emergency Action & Dispatch Plan.
Each step must dispatch specific municipal units (Hazmat, EMS, Police, Power Utility, Transit).

Strict Rule: Output valid JSON ONLY matching this structure:
{
  "directive_title": "e.g. OPERATION SHIELD: CODE RED CONTAINMENT DIRECTIVE",
  "threat_level": "CRITICAL" | "HIGH",
  "three_step_dispatch_plan": [
    {
      "step": 1,
      "title": "Phase 1: Immediate Hazard Isolation & Evacuation",
      "units_dispatched": ["Unit Name 1", "Unit Name 2"],
      "action_orders": "Precise tactical command."
    },
    {
      "step": 2,
      "title": "Phase 2: Critical Infrastructure Safeguarding",
      "units_dispatched": ["Unit Name 1", "Unit Name 2"],
      "action_orders": "Precise tactical command."
    },
    {
      "step": 3,
      "title": "Phase 3: Route Clearance & Public Protection",
      "units_dispatched": ["Unit Name 1", "Unit Name 2"],
      "action_orders": "Precise tactical command."
    }
  ],
  "public_broadcast_alert": "Urgent SMS/Radio message for civilians in the affected area.",
  "status": "DISPATCH_AUTHORIZED"
}`;

    const agent3UserPrompt = `AGENT 2 (RISK ANALYST) ASSESSMENT:
${JSON.stringify(agent2Output, null, 2)}

AGENT 1 (TELEMETRY SUMMARY):
${JSON.stringify(agent1Output, null, 2)}

Issue the authoritative 3-Step Emergency Action Plan in JSON.`;

    const agent3Output = await callLLM({
      systemPrompt: agent3SystemPrompt,
      userPrompt: agent3UserPrompt,
      jsonMode: true,
    });

    const executionDurationMs = Date.now() - startTime;

    // Return the entire transparent pipeline result to the frontend
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

