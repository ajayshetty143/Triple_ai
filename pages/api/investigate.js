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

  // Model Pool: Try vision first if image is provided, with text model failovers
  const modelPool = imageUrl 
    ? ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'] 
    : ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];

  let activeImageUrl = imageUrl;

  for (let i = 0; i < modelPool.length; i++) {
    const currentModel = modelPool[i];
    const isVision = Boolean(activeImageUrl && currentModel === 'qwen/qwen3.8-27b');

    const userMessageContent = isVision
      ? [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: activeImageUrl } },
        ]
      : userPrompt;

    for (let tryJsonMode of [jsonMode, false]) {
      try {
        const bodyPayload = {
          model: currentModel,
          max_tokens: 450,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessageContent },
          ],
        };
        if (tryJsonMode) {
          bodyPayload.response_format = { type: 'json_object' };
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (response.status === 429) {
          console.warn(`Groq 429 Rate Limit hit on model ${currentModel}. Auto-switching to next model in pool...`);
          break; // Switch to next model in pool
        }

        if (!response.ok) {
          const errorBody = await response.text();

          // 1. If image URL is 404 or fails retrieval, recover gracefully by analyzing text report
          if (errorBody.includes('failed to retrieve media') || errorBody.includes('404')) {
            console.warn('Image retrieval failed on remote URL, falling back to text-only investigation...');
            activeImageUrl = null;
            continue;
          }

          // 2. If Groq's grammar validator failed with json_validate_failed, retry without strict response_format
          if (errorBody.includes('json_validate_failed')) {
            console.warn('Groq json_validate_failed, retrying without strict json_object constraint...');
            continue; // will retry with tryJsonMode = false
          }

          if (i < modelPool.length - 1) {
            console.warn(`Error on ${currentModel} (${response.status}), switching model:`, errorBody);
            break;
          }
          throw new Error(`Groq API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '{}';
        return jsonMode ? cleanAndParseJSON(content) : content;
      } catch (err) {
        if (i < modelPool.length - 1) {
          console.warn(`Attempt on ${currentModel} failed, trying next:`, err.message);
          break;
        }
        throw err;
      }
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
Your job is to critically evaluate the citizen incident report, database sensors, and attached optical image evidence (if provided).

CRITICAL INCIDENT TRIAGE & SOURCE HIERARCHY RULES:

1. THE VISUAL OVERRIDE (HIGHEST PRIORITY):
   - You MUST deeply analyze the image. If the visual evidence shows ANY hazard (e.g., smoke, fire, vehicle collision, fallen person, crashed car, overturned vehicle, blocked roadway, debris, blood, structural damage, crowds panicking):
     • You MUST mark is_harm_detected as TRUE, REGARDLESS of how harmless or neutral the text report sounds.
     • For fire, smoke, explosions, or floods: classify incident_classification as "SEVERE" (or "CATASTROPHIC").
     • For vehicle accidents, fallen pedestrians, or obstacles: classify as "ROUTINE_LOCAL" or "MODERATE".
     • Describe the exact visual hazard you see in visual_surveillance_analysis.

2. TEXT-BASED EMERGENCIES (IF IMAGE IS NORMAL OR MISSING):
   - If the Incident Report explicitly describes an emergency (e.g. "fire", "collision", "gas leak", "injured", "fall down"), but the image looks normal or is just a street view:
     • You MUST mark is_harm_detected as TRUE. 
     • Explain in visual_surveillance_analysis that the fixed camera is likely monitoring background traffic and lacks direct line-of-sight to the reported emergency. Priority dispatch is authorized based on the text report.

3. WHEN TO DECLARE ALL_CLEAR_SAFE (STRICT CONDITIONS):
   - You may ONLY mark is_harm_detected as FALSE and classify as "ALL_CLEAR_SAFE" when BOTH conditions are met:
     • The text report describes a routine safe baseline AND
     • The visual evidence confirms no active fire, no collision, no injury, and no damage.

4. SENSOR DECOUPLING RULE:
   - DO NOT correlate gas or flood sensors with a vehicle collision or building fire unless the report explicitly states a gas leak or flood. If unrelated, critical_sensors MUST be empty ([]).

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
You receive the exact situational report from Agent 1.

CRITICAL THREAT & PROPORTIONALITY RULES:
- If Agent 1 classifies as "SEVERE" or "CATASTROPHIC" (active fire, building fire, explosion, gas main rupture, flood):
  • overall_threat_level MUST be "CRITICAL".
  • primary_hazards MUST identify the urgent fire/life-safety risks (e.g. ["Active Structure Fire", "Rapid Flame Propagation to Adjacent Buildings", "Smoke Inhalation", "Structural Collapse Risk"]).
  • cascading_vulnerabilities MUST identify adjacent infrastructure, residential/commercial power isolation, and civilian transit grid.
  • time_to_critical_failure: "Immediate (< 8 minutes to flashover/structure compromise)".
  • analyst_assessment: "High-urgency emergency detected. Immediate multi-unit fire suppression and emergency cordon required."
- If Agent 1 classifies as "ROUTINE_LOCAL" or "MODERATE" (e.g. bike skid, fallen cyclist, local collision):
  • overall_threat_level MUST be "LOW" (or "MEDIUM").
  • primary_hazards: ["Local Roadway Obstruction", "Minor Civilian Injury"].
  • cascading_vulnerabilities: [{ "system": "Transit Corridors", "risk": "Localized lane slowdown. Primary arterials open." }].
  • time_to_critical_failure: "15-30 minutes (Traffic queue build-up)".
  • analyst_assessment: "Routine local traffic incident. Routine paramedic and patrol dispatch required."
- If Agent 1 classifies the event as "ALL_CLEAR_SAFE" (safe baseline, parked vehicle, peaceful scene):
  • overall_threat_level MUST be "ALL_CLEAR".
  • primary_hazards MUST be ["No active hazards detected - Normal municipal operations"].
  • cascading_vulnerabilities MUST be [{ "system": "City Infrastructure", "risk": "Normal safe baseline. No infrastructure risk." }].
  • time_to_critical_failure: "None (System Stable)".
  • analyst_assessment: "Optical and telemetry review confirms baseline stability. Zero emergency risk."

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
- If threat_level is "CRITICAL" or "HIGH" (active fire, building fire, gas explosion, heavy flood):
  • directive_title: "OPERATION SHIELD: CODE RED EMERGENCY DIRECTIVE"
  • threat_level: "CRITICAL" (RED LIGHT STATUS - CRISIS RESPONSE)
  • status: "DISPATCH_AUTHORIZED"
  • three_step_dispatch_plan: [
      {
        "step": 1,
        "title": "Phase 1: Rapid Fire Suppression & Rescue Deployment",
        "units_dispatched": ["Engine Company 9", "Ladder Truck 3", "Battalion Chief"],
        "action_orders": "Deploy heavy fire engines with aerial master streams to halt structure fire propagation and commence primary search & rescue."
      },
      {
        "step": 2,
        "title": "Phase 2: Medical Triage & Utility Isolation",
        "units_dispatched": ["Nexus City Trauma EMS", "Municipal Gas & Power Isolation Squad"],
        "action_orders": "Establish forward medical triage point; isolate electrical mains and gas valves to prevent secondary structural explosions."
      },
      {
        "step": 3,
        "title": "Phase 3: Civilian Evacuation & Sector Cordon",
        "units_dispatched": ["Nexus City Police Tactical", "Civil Defense Evacuation Squad"],
        "action_orders": "Evacuate adjacent buildings within 300-meter safety radius; enforce arterial lockdown for incoming emergency apparatus."
      }
    ]
  • public_broadcast_alert: "EMERGENCY ADVISORY: Active structure fire reported. Avoid sector immediately. Clear all transit corridors for emergency apparatus."
- If threat_level is "LOW" or "ROUTINE" or "MEDIUM" (bike skid, cyclist down, pedestrian slip, minor vehicle collision):
  • directive_title: "LOCAL TRAFFIC & MEDICAL RESPONSE DIRECTIVE"
  • threat_level: "LOW" (YELLOW LIGHT STATUS - ROUTINE LOCAL RESPONSE)
  • status: "DISPATCH_AUTHORIZED"
  • three_step_dispatch_plan: [
      {
        "step": 1,
        "title": "Phase 1: Immediate Paramedic Triage",
        "units_dispatched": ["EMS Ambulance Squad 4", "Rapid Response Paramedic"],
        "action_orders": "Deploy local ambulance to provide on-scene stabilization and evaluate injuries."
      },
      {
        "step": 2,
        "title": "Phase 2: Traffic Safety & Lane Diversion",
        "units_dispatched": ["Nexus City Traffic Patrol"],
        "action_orders": "Establish temporary safety cordon around incident and divert oncoming traffic."
      },
      {
        "step": 3,
        "title": "Phase 3: Roadway Clearance & Log Archival",
        "units_dispatched": ["Municipal Tow Unit", "Central Command Log Archive"],
        "action_orders": "Clear roadway obstruction, verify lane re-opening, and log incident to municipal records."
      }
    ]
  • public_broadcast_alert: "Minor traffic slowdown. Emergency services responding to local vehicle incident. No civilian evacuation required."
- If threat_level is "ALL_CLEAR" (safe baseline, parked vehicle, peaceful observation):
  • directive_title: "ALL CLEAR: ROUTINE OBSERVATION DIRECTIVE"
  • threat_level: "ALL_CLEAR" (GREEN LIGHT STATUS - SAFE BASELINE)
  • status: "ALL_CLEAR_VERIFIED"
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
