# 🚨 Autonomous Smart City Incident Investigation System

An autonomous, multi-agent emergency response and dispatch platform built for urban crisis management. 

When an incident is reported, the platform triggers a sequential, lightweight 3-agent AI cascade that cross-references ground-truth municipal sensor telemetry from Supabase to formulate a coordinated emergency action plan in seconds.

---

## 🏛️ System Architecture

```
[Citizen / Sensor Incident Submitted]
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  AGENT 1: Data Gatherer & Telemetry          │
│  • Queries Supabase PostgreSQL sensor feeds  │
│  • Compiles ground-truth situational report  │
└──────────────────────┬───────────────────────┘
                       │ (Strict JSON Handoff)
                       ▼
┌──────────────────────────────────────────────┐
│  AGENT 2: Infrastructure Risk Analyst        │
│  • Evaluates cascading urban hazards         │
│  • Flags power grid, medical & transit risks │
└──────────────────────┬───────────────────────┘
                       │ (Strict JSON Handoff)
                       ▼
┌──────────────────────────────────────────────┐
│  AGENT 3: City Commander & Dispatcher        │
│  • Authorizes decisive 3-phase dispatch plan │
│  • Dispatches units (Hazmat, EMS, Utilities) │
│  • Issues emergency public broadcast bulletin│
└──────────────────────┬───────────────────────┘
                       │
                       ▼
       [Live Tactical Command Dashboard]
```

---

## ⚡ Key Highlights
* **Zero Bloat, Lightweight Architecture:** Direct, sequential HTTP API calls with native JSON handoffs instead of heavy, fragile agent frameworks.
* **Database-Grounded Context:** Integrates with Supabase (PostgreSQL) storing live sensor states (flood gauges, power substations, gas pressure lines, trauma center capacity).
* **High-Speed Execution:** Powered by Groq LPU acceleration (`llama-3.3-70b-versatile` / `openai/gpt-oss-120b`) for rapid response times.
* **Full Transparency Deck:** Features real-time pipeline status steppers and inspectable raw JSON payloads for verification.

---

## 🛠️ Tech Stack
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS (Dark-Mode Command Center)
* **Database:** Supabase (PostgreSQL with JSONB telemetry)
* **AI Model Engine:** Groq Cloud API
* **Icons:** Lucide React

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/karthikdevanath10-hue/Triple_ai.git
cd Triple_ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
```

### 4. Seed the Database
Run the SQL script located in [`supabase_schema.sql`](./supabase_schema.sql) in your Supabase SQL Editor.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the command dashboard.

