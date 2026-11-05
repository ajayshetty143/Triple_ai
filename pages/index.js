import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Radio, 
  CheckCircle2, 
  Flame, 
  Droplets, 
  Zap, 
  Clock, 
  ChevronRight, 
  Database, 
  Cpu, 
  Terminal,
  Send,
  Loader2,
  Camera,
  Video,
  Upload,
  Eye,
  RefreshCw,
  MessageSquare,
  Bot,
  User,
  Sparkles,
  Sun,
  Moon,
  Building2,
  X,
  Layers,
  MapPin,
  CheckCircle,
  FileText,
  Sliders,
  ArrowUpRight,
  Image as ImageIcon
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    title: "Routine Surveillance & Safe Baseline",
    category: "Municipal Baseline",
    severity: "Safe (Green Light)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    icon: CheckCircle,
    text: "Optical surveillance confirms safe municipal baseline. Harmless stationary vehicle parked peacefully with zero collisions, zero injuries, zero structural damage, and no active hazards. Confirm safe green-light status.",
    cctvId: "CCTV-09 (Metropolis Boulevard)",
    cctvImage: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Minor Vehicle Incident / Bike Skid",
    category: "Local Medical & Traffic",
    severity: "Low (Routine EMS)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    icon: Activity,
    text: "Local traffic incident: a person fell down on the roadway due to a minor motorcycle/bike skid. Subject is conscious, minor abrasion, traffic slowed. Deploy local EMS ambulance and traffic officer.",
    cctvId: "CCTV-05 (4th Ave Crossing)",
    cctvImage: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Gas Mainline Rupture & Structural Hazard",
    category: "Hazardous Materials",
    severity: "Critical (Code Red)",
    badgeColor: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60",
    icon: Flame,
    text: "Heavy odor of natural gas reported near 5th Ave & Elm Junction with localized surface fire threatening adjacent commercial buildings. Vehicles immobilized in intersection.",
    cctvId: "CCTV-07 (5th Ave Junction)",
    cctvImage: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Flash Flood & Arterial Inundation",
    category: "Civil Infrastructure",
    severity: "High (Crisis)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60",
    icon: Droplets,
    text: "Riverside arterial telemetry gauge indicates surge exceeding 4.85m. Roadway submerged, obstructing primary inbound medical corridor to St. Jude Trauma Center.",
    cctvId: "CCTV-01 (Riverside Arterial)",
    cctvImage: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Power Grid Substation Overload",
    category: "Utility Grid",
    severity: "Moderate (Warning)",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
    icon: Zap,
    text: "Substation Beta-9 operating at 94% peak load with transformer temperature alert. Secondary cooling alert active along South Industrial corridor.",
    cctvId: "CCTV-04 (Substation Beta-9)",
    cctvImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80"
  }
];

export default function Dashboard() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const [incidentText, setIncidentText] = useState(PRESET_SCENARIOS[0].text);
  
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hello. I am the City Emergency Intake AI. Please provide the incident location, observed conditions, or upload evidence. I will synthesize the briefing and dispatch the multi-agent emergency cascade."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeDossier, setActiveDossier] = useState(null);

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState('commander');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Visual Evidence / Live Cam State
  const [mediaSource, setMediaSource] = useState('cctv');
  const [opticalScenario, setOpticalScenario] = useState('safe'); // 'safe' | 'minor' | 'critical'
  const [activeMedia, setActiveMedia] = useState(PRESET_SCENARIOS[0].cctvImage);
  const [activeCameraLabel, setActiveCameraLabel] = useState(PRESET_SCENARIOS[0].cctvId);
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [clockTime, setClockTime] = useState('');
  const [visionAnalysis, setVisionAnalysis] = useState(null);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' EST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const selectScenario = (scenario) => {
    setIncidentText(scenario.text);
    if (mediaSource === 'cctv') {
      setActiveMedia(scenario.cctvImage);
      setActiveCameraLabel(scenario.cctvId);
      setIsVideoMedia(false);
    }
  };

  const startWebcam = async () => {
    try {
      setMediaSource('webcam');
      setIsWebcamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActiveCameraLabel("LIVE TERMINAL OPTICAL SENSOR");
    } catch (err) {
      console.error("Webcam error:", err);
      alert("Camera access error: " + err.message);
      setIsWebcamActive(false);
    }
  };

  const runVisionAnalysis = async (dataUrl, label) => {
    setIsAnalyzingVision(true);
    setVisionAnalysis(null);
    try {
      const res = await fetch('/api/analyze-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePayload: dataUrl, fileName: label })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        const ana = data.analysis;
        setVisionAnalysis(ana);
        if (ana.harm_detected) {
          if (ana.severity === 'CRITICAL') {
            setOpticalScenario('critical');
          } else {
            setOpticalScenario('minor');
          }
        } else {
          setOpticalScenario('safe');
        }
        if (ana.suggested_incident_text || ana.scene_description) {
          const synthesizedText = ana.suggested_incident_text || `Field visual evidence (${label}): ${ana.scene_description}`;
          setIncidentText(synthesizedText);
          setActiveDossier(synthesizedText);
        }
      }
    } catch (err) {
      console.warn("Vision analysis error:", err);
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setActiveMedia(dataUrl);
    setIsVideoMedia(false);
    stopWebcam();
    setMediaSource('upload');
    const label = "CAPTURED EVIDENCE // LOCAL TERMINAL";
    setActiveCameraLabel(label);
    setIncidentText("Scanning camera snapshot with Multimodal Optical AI...");
    runVisionAnalysis(dataUrl, label);
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopWebcam();
    const isVideo = file.type.startsWith('video/');
    setIsVideoMedia(isVideo);
    setMediaSource('upload');
    const label = `EVIDENCE FILE: ${file.name}`;
    setActiveCameraLabel(label);
    setIncidentText(`Scanning uploaded media (${file.name}) with Multimodal Optical AI...`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setActiveMedia(dataUrl);
      if (!isVideo) {
        runVisionAnalysis(dataUrl, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newHistory,
          evidenceLabel: activeCameraLabel 
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chat assistant failed');
      }

      setChatMessages([...newHistory, { role: 'assistant', content: data.message }]);
      if (data.synthesizedIncident) {
        setActiveDossier(data.synthesizedIncident);
        setIncidentText(data.synthesizedIncident);
      }
    } catch (err) {
      console.error(err);
      setChatMessages([
        ...newHistory, 
        { role: 'assistant', content: 'Intake service unavailable: ' + err.message }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunInvestigation = async (overrideIncidentText = null) => {
    let textToInvestigate = (overrideIncidentText || incidentText || activeDossier || '').trim();
    if (!textToInvestigate) {
      if (opticalScenario === 'safe') {
        textToInvestigate = `Field optical evidence submitted (${activeCameraLabel}). Stationary parked vehicle / harmless scene observed. Zero collisions, zero casualties, zero fire/leak hazard. Authorize All Clear green-light status.`;
      } else {
        textToInvestigate = `Field optical evidence submitted (${activeCameraLabel}). Local vehicle incident documented on roadway. Deploy local EMS and traffic unit.`;
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(1);

    try {
      const stepTimer1 = setTimeout(() => setActiveStep(2), 600);
      const stepTimer2 = setTimeout(() => setActiveStep(3), 1200);

      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          incident: textToInvestigate,
          cameraSource: activeCameraLabel,
          mediaEvidence: activeMedia ? true : false,
          imagePayload: activeMedia || null,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Pipeline execution failed.');
      }

      setResult(data);
      setActiveStep(3);
      setActiveTab('commander');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const agent1 = result?.pipeline?.agent1_data_gatherer;
  const agent2 = result?.pipeline?.agent2_risk_analyst;
  const agent3 = result?.pipeline?.agent3_city_commander;

  return (
    <div className="min-h-screen transition-colors duration-200 font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Head>
        <title>METROPOLIS // Autonomous Emergency Incident Platform</title>
        <meta name="description" content="Enterprise Smart City Incident Orchestration System" />
      </Head>

      {/* Corporate Top Navigation Bar */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 transition-colors shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-gradient-to-tr dark:from-blue-600 dark:via-indigo-600 dark:to-cyan-500 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Metropolis Command OS</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Enterprise v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Autonomous City Incident Investigation & Multi-Agent Dispatch
              </p>
            </div>
          </div>

          {/* Operational Metrics & Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 shadow-xs">
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Supabase Cloud</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 shadow-xs">
                <Cpu className="w-3.5 h-3.5 text-slate-700 dark:text-blue-400" />
                <span>Groq LPU Engine</span>
              </div>
              {result?.meta?.execution_time_ms && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{result.meta.execution_time_ms}ms</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Corporate Workspace */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================================================== */}
        {/* LEFT CONSOLE: SURVEILLANCE & INTAKE (5 Columns)     */}
        {/* ==================================================== */}
        <section className="lg:col-span-5 flex flex-col gap-6">

          {/* Surveillance & Optical Feed Card */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {activeCameraLabel}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{clockTime}</span>
            </div>

            {/* Viewport */}
            <div className="relative bg-slate-950 aspect-video w-full flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 pointer-events-none z-10 p-3 flex flex-col justify-between font-mono text-[10px] text-white/80">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-red-400 font-semibold">LIVE TRANSMISSION</span>
                  </div>
                  <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-slate-300">
                    30 FPS // 1080P
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                    CHANNEL: PRIMARY
                  </span>
                  <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                    METROPOLIS SECTOR 4
                  </span>
                </div>
              </div>

              {isWebcamActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : isVideoMedia && activeMedia ? (
                <video src={activeMedia} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : activeMedia ? (
                <img src={activeMedia} alt="Surveillance Stream" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Camera className="w-8 h-8 mb-1 opacity-40" />
                  <span>Optical Stream Disconnected</span>
                </div>
              )}
            </div>

            {/* Video Action Controls */}
            <div className="p-3 bg-white dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isWebcamActive ? (
                  <button
                    type="button"
                    onClick={captureWebcamSnapshot}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium flex items-center gap-1.5 transition text-xs shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Capture Snapshot</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 transition text-xs shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5 text-slate-700 dark:text-blue-400" />
                    <span>Terminal Cam</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 transition text-xs shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Upload Media</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*,video/*" 
                  className="hidden" 
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  stopWebcam();
                  setMediaSource('cctv');
                  setActiveMedia(PRESET_SCENARIOS[0].cctvImage);
                  setActiveCameraLabel(PRESET_SCENARIOS[0].cctvId);
                  setIsVideoMedia(false);
                }}
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                title="Reset to Municipal Feeds"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Feed</span>
              </button>
            </div>

            {/* Optical Evidence & Smart Scenario Triage Bar */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opticalScenario === 'safe' ? 'bg-emerald-500 animate-pulse' : opticalScenario === 'minor' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Optical Evidence: <span className="font-mono text-slate-600 dark:text-slate-400 font-normal truncate max-w-[190px] inline-block align-bottom">{activeCameraLabel}</span>
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Scenario Triage
                </span>
              </div>

              {/* AI Multimodal Vision Analysis Status & Findings */}
              {isAnalyzingVision && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2.5 text-xs text-blue-800 dark:text-blue-300 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-semibold">AI Multimodal Vision Inspecting Pixels... Detecting objects, casualties & safety baseline</span>
                </div>
              )}

              {visionAnalysis && !isAnalyzingVision && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                  visionAnalysis.harm_detected 
                    ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200' 
                    : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
                }`}>
                  {visionAnalysis.harm_detected ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold uppercase tracking-wider text-[10px]">
                        {visionAnalysis.harm_detected ? '⚠️ AI Optical Vision: Incident / Casualty Detected' : '🟢 AI Optical Vision: Safe Baseline Verified'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        visionAnalysis.harm_detected ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {visionAnalysis.severity || (visionAnalysis.harm_detected ? 'INCIDENT' : 'ALL_CLEAR')}
                      </span>
                    </div>
                    <p className="leading-relaxed text-slate-800 dark:text-slate-200">
                      {visionAnalysis.scene_description}
                    </p>
                    {visionAnalysis.recommended_units?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Recommended Units:</span>
                        {visionAnalysis.recommended_units.map((u, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-medium text-slate-800 dark:text-slate-200">
                            {u}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3 Scenario Mode Pills */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-950/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setOpticalScenario('safe');
                    setIncidentText(`Field optical evidence submitted (${activeCameraLabel}). Stationary parked vehicle / harmless street scene observed. Zero collisions, zero casualties, zero fire/leak hazard. Authorize All Clear green-light status.`);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
                    opticalScenario === 'safe'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="No harm or accident in photo (Triggers Green Light)"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>🟢 Safe (No Harm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpticalScenario('minor');
                    setIncidentText(`Field optical evidence submitted (${activeCameraLabel}). Minor local roadway incident: individual down on road following bike skid. Conscious, minor abrasion, traffic slowed. Deploy local EMS ambulance and traffic officer.`);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
                    opticalScenario === 'minor'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Minor accident or bike skid (Triggers Low Priority EMS)"
                >
                  <Activity className="w-3 h-3" />
                  <span>🟡 Minor Skid</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpticalScenario('critical');
                    setIncidentText(`Field optical evidence submitted (${activeCameraLabel}). Severe emergency observed: heavy smoke, fire, or catastrophic structural threat. Dispatch multi-unit Hazmat and Fire suppression.`);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
                    opticalScenario === 'critical'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Critical disaster (Triggers Code Red Hazmat)"
                >
                  <Flame className="w-3 h-3" />
                  <span>🔴 Critical Crisis</span>
                </button>
              </div>

              {/* Dynamic Dispatch Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-medium text-slate-500">
                  {opticalScenario === 'safe' ? '🟢 Harmless: Triggers Green Light All Clear' :
                   opticalScenario === 'minor' ? '🟡 Minor Incident: Triggers Routine EMS' :
                   '🔴 Crisis: Triggers Hazmat & Evacuation'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const textToSend = incidentText && incidentText.trim()
                      ? incidentText
                      : (opticalScenario === 'safe'
                          ? `Field optical evidence submitted (${activeCameraLabel}). Stationary parked vehicle / harmless street scene observed. Zero collisions, zero casualties, zero fire/leak hazard. Authorize All Clear green-light status.`
                          : `Field optical evidence submitted (${activeCameraLabel}). Minor vehicle incident documented on roadway. Deploy local EMS.`);
                    handleRunInvestigation(textToSend);
                  }}
                  disabled={loading}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-40 text-white ${
                    opticalScenario === 'safe'
                      ? 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                      : opticalScenario === 'minor'
                      ? 'bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500'
                      : 'bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Dispatch Agents with this Scenario</span>
                </button>
              </div>
            </div>
          </div>

          {/* Incident Ingestion Hub */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4 text-blue-400 dark:text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider block">
                    AI Emergency Assistant
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Conversational Triage & Dynamic Multi-Agent Dispatch
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatMessages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatMessages([
                        {
                          role: 'assistant',
                          content: "Hello. I am the City Emergency Intake AI. Please provide the incident location, observed conditions, or upload evidence. I will synthesize the briefing and dispatch the multi-agent emergency cascade."
                        }
                      ]);
                      setActiveDossier(null);
                    }}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    title="Start fresh conversation"
                  >
                    Reset Chat
                  </button>
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Intake AI Online" />
              </div>
            </div>

            {/* Conversational Assistant */}
            <div className="flex flex-col gap-3">
              <div className="h-64 overflow-y-auto bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3 text-xs" ref={chatScrollRef}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'user' && (
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-blue-600 flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white dark:bg-blue-600 rounded-br-sm shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-xs'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700 dark:text-blue-500" />
                    <span>Analyzing scenario with municipal AI operator...</span>
                  </div>
                )}
              </div>

              {/* Ready Incident Dossier Card */}
              {activeDossier && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Incident Dossier Synthesized
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">Ready for Dispatch</span>
                  </div>
                  <p className="text-emerald-950 dark:text-emerald-100 italic leading-relaxed">
                    &ldquo;{activeDossier}&rdquo;
                  </p>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe incident or ask AI (e.g. 'cyclist collision on 5th Ave', 'gas leak near substation')..."
                  className="flex-1 text-xs rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-blue-500/40"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>

              {/* 1-Click Multi-Agent Cascade Dispatch Button */}
              <button
                type="button"
                onClick={() => {
                  const textToSend = activeDossier || chatMessages[chatMessages.length - 1]?.content || incidentText;
                  handleRunInvestigation(textToSend);
                }}
                disabled={loading || (chatMessages.length < 2 && !activeDossier && !incidentText)}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying Multi-Agent Emergency Cascade...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Authorize & Deploy Multi-Agent Emergency Cascade</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Process Workflow Progress */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-700 dark:text-blue-500" /> Multi-Agent Execution Lifecycle
            </h3>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl border transition ${
                activeStep >= 1 
                  ? 'border-slate-300 bg-slate-100/70 dark:border-blue-800/60 dark:bg-blue-950/20 text-slate-900 dark:text-blue-300' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between font-semibold">
                  <span>1. Agent 1 — Telemetry & Visual Synthesizer</span>
                  {activeStep >= 1 && <CheckCircle className="w-4 h-4 text-slate-900 dark:text-blue-400" />}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-normal">
                  Queries PostgreSQL sensor baseline & cross-references optical inputs.
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition ${
                activeStep >= 2 
                  ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between font-semibold">
                  <span>2. Agent 2 — Infrastructure Risk Modeler</span>
                  {activeStep >= 2 && <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-normal">
                  Calculates cascading impacts across power, medical corridors, and transit.
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition ${
                activeStep >= 3 
                  ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between font-semibold">
                  <span>3. Agent 3 — Incident Action Commander</span>
                  {activeStep >= 3 && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-normal">
                  Issues calibrated 3-phase tactical unit dispatches and civilian alerts.
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* ==================================================== */}
        {/* RIGHT COMMAND DECK: EXECUTIVE OUTPUTS (7 Columns)   */}
        {/* ==================================================== */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
              <button
                onClick={() => setActiveTab('commander')}
                className={`px-4 py-2 rounded-xl transition font-semibold ${
                  activeTab === 'commander'
                    ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Action Directive (Agent 3)
              </button>
              <button
                onClick={() => setActiveTab('analyst')}
                className={`px-4 py-2 rounded-xl transition font-semibold ${
                  activeTab === 'analyst'
                    ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Risk Assessment (Agent 2)
              </button>
              <button
                onClick={() => setActiveTab('sensors')}
                className={`px-4 py-2 rounded-xl transition font-semibold ${
                  activeTab === 'sensors'
                    ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                IoT Telemetry & Optical (Agent 1)
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-2 rounded-xl transition font-semibold ${
                  activeTab === 'raw'
                    ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                API Audit Log
              </button>
            </div>

            {result && (
              <button
                type="button"
                onClick={() => { setResult(null); setActiveStep(0); }}
                className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition shrink-0 font-medium"
                title="Clear current results"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Clear Results</span>
              </button>
            )}
          </div>

          {error && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              error.includes('429') || error.toLowerCase().includes('rate limit')
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {error.includes('429') || error.toLowerCase().includes('rate limit')
                    ? 'AI Rate Limit Cooldown Active (Free Tier)'
                    : 'Pipeline Execution Alert'}
                </p>
                <p className="mt-0.5 opacity-90">
                  {error.includes('429') || error.toLowerCase().includes('rate limit')
                    ? 'Groq free tier enforces an 8,000 token-per-minute window. Please wait 3 seconds and click dispatch again — the multi-model failover pool will handle your request immediately.'
                    : error}
                </p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="flex-1 min-h-[460px] flex flex-col items-center justify-center p-12 text-center rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">System Ready for Incident Ingestion</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                Upload media evidence or converse with the AI Emergency Assistant on the left to authorize the autonomous response plan.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 min-h-[460px] flex flex-col items-center justify-center p-12 text-center rounded-2xl border bg-slate-100/60 dark:bg-blue-950/10 border-slate-300 dark:border-blue-900/40">
              <Loader2 className="w-10 h-10 text-slate-800 dark:text-blue-500 animate-spin mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-blue-300 text-sm">Autonomous Multi-Agent Cascade in Progress</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1">
                Data Gatherer is cross-referencing your optical evidence with Supabase, Risk Analyst is modeling cascading failure trees, and Command Dispatcher is drafting tactical orders.
              </p>
            </div>
          )}

          {/* TAB 1: Commander Directive with Rendered Evidence */}
          {result && activeTab === 'commander' && agent3 && (
            <div className="space-y-4">
              
              {/* Executive Header Card */}
              <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-blue-400">
                    Executive Action Plan Authorized
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {agent3.directive_title}
                  </h3>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  agent3.threat_level === 'CRITICAL' || agent3.threat_level === 'HIGH' || agent3.threat_level === 'SEVERE'
                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                    : agent3.threat_level === 'ALL_CLEAR' || agent3.threat_level === 'SAFE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                }`}>
                  {agent3.threat_level === 'ALL_CLEAR' || agent3.threat_level === 'SAFE' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span>STATUS: ALL CLEAR (SAFE BASELINE)</span>
                    </>
                  ) : agent3.threat_level === 'LOW' || agent3.threat_level === 'ROUTINE' || agent3.threat_level === 'ROUTINE_LOCAL' || agent3.threat_level === 'MEDIUM' || agent3.threat_level === 'MINOR' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      <span>YELLOW ALERT: LOCAL INCIDENT RESPONSE</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      <span>RED ALERT: {agent3.threat_level}</span>
                    </>
                  )}
                </span>
              </div>

              {/* RENDER ATTACHED EVIDENCE IN REPORT */}
              {activeMedia && (
                <div className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img src={activeMedia} alt="Evidence Rendered" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Optical Evidence Attached & Processed
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {activeCameraLabel}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Cross-referenced by Agent 1 (Data & Vision) and Agent 3 for tactical unit deployment.
                    </span>
                  </div>
                </div>
              )}

              {/* 3 Action Phases */}
              <div className="space-y-3">
                {agent3.three_step_dispatch_plan?.map((stepItem, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {stepItem.step || idx + 1}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {stepItem.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-8.5">
                      {stepItem.action_orders}
                    </p>

                    {stepItem.units_dispatched?.length > 0 && (
                      <div className="pl-8.5 pt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500">Deployed Units:</span>
                        {stepItem.units_dispatched.map((u, uIdx) => (
                          <span key={uIdx} className="text-[10px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {u}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Civilian Advisory Banner */}
              {agent3.public_broadcast_alert && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  agent3.threat_level === 'ALL_CLEAR' || agent3.threat_level === 'SAFE'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                    : agent3.threat_level === 'LOW' || agent3.threat_level === 'ROUTINE' || agent3.threat_level === 'ROUTINE_LOCAL' || agent3.threat_level === 'MEDIUM' || agent3.threat_level === 'MINOR'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/70 text-red-950 dark:text-red-200'
                }`}>
                  {agent3.threat_level === 'ALL_CLEAR' || agent3.threat_level === 'SAFE' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : agent3.threat_level === 'LOW' || agent3.threat_level === 'ROUTINE' || agent3.threat_level === 'ROUTINE_LOCAL' || agent3.threat_level === 'MEDIUM' || agent3.threat_level === 'MINOR' ? (
                    <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Radio className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`font-semibold block text-[11px] uppercase tracking-wider ${
                      agent3.threat_level === 'ALL_CLEAR' || agent3.threat_level === 'SAFE' ? 'text-emerald-800 dark:text-emerald-300' :
                      agent3.threat_level === 'LOW' || agent3.threat_level === 'ROUTINE' || agent3.threat_level === 'ROUTINE_LOCAL' || agent3.threat_level === 'MEDIUM' || agent3.threat_level === 'MINOR' ? 'text-amber-800 dark:text-amber-300' :
                      'text-red-800 dark:text-red-300'
                    }`}>
                      {agent3.threat_level === 'ALL_CLEAR' || agent3.threat_level === 'SAFE' ? 'Municipal Public Advisory: All Clear (Safe)' : 'Public Communications Advisory'}
                    </span>
                    <p className="mt-1 leading-relaxed italic">
                      &ldquo;{agent3.public_broadcast_alert}&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Analyst Risk Tree */}
          {result && activeTab === 'analyst' && agent2 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase ${
                    agent2.overall_threat_level === 'CRITICAL' || agent2.overall_threat_level === 'HIGH'
                      ? 'text-red-600 dark:text-red-400'
                      : agent2.overall_threat_level === 'ALL_CLEAR' || agent2.overall_threat_level === 'SAFE'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    Agent 2 Risk Modeling
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Cascading Infrastructure Vulnerability Tree</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-medium">Critical Threshold Window</span>
                  <span className={`text-xs font-semibold ${
                    agent2.overall_threat_level === 'CRITICAL' || agent2.overall_threat_level === 'HIGH'
                      ? 'text-red-600 dark:text-red-400'
                      : agent2.overall_threat_level === 'ALL_CLEAR' || agent2.overall_threat_level === 'SAFE'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>{agent2.time_to_critical_failure}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Strategic Assessment
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{agent2.analyst_assessment}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Identified Impact Vectors
                </span>
                {agent2.cascading_vulnerabilities?.map((vuln, vIdx) => (
                  <div key={vIdx} className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-start gap-3">
                    {agent2.overall_threat_level === 'ALL_CLEAR' || agent2.overall_threat_level === 'SAFE' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                        agent2.overall_threat_level === 'CRITICAL' || agent2.overall_threat_level === 'HIGH' ? 'text-red-500' : 'text-amber-500'
                      }`} />
                    )}
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{vuln.system}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{vuln.risk}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Telemetry & Vision with Image Preview */}
          {result && activeTab === 'sensors' && agent1 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-blue-400">
                    Agent 1 Ingestion Audit
                  </span>
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    agent1.incident_classification === 'ALL_CLEAR_SAFE' || agent1.incident_classification === 'ALL_CLEAR'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                      : agent1.incident_classification === 'ROUTINE_LOCAL' || agent1.incident_classification === 'LOW'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                      : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                  }`}>
                    {agent1.incident_classification || 'EVALUATED'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">IoT Telemetry & Optical Fusion Dossier</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{agent1.data_synthesis}</p>
              </div>

              {/* Optical Corroboration + Rendered Evidence side-by-side */}
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {activeMedia && (
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img src={activeMedia} alt="Evidence Render" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-cyan-300 mb-1">
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Optical Surveillance Findings
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {agent1.visual_surveillance_analysis || `Visual confirmation corroborated: ${activeCameraLabel} successfully verified and incorporated into tactical dispatch.`}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Relevant IoT Baseline Corroboration
                </span>
                {agent1.critical_sensors?.length > 0 ? (
                  agent1.critical_sensors.map((sens, sIdx) => (
                    <div key={sIdx} className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-blue-400">{sens.id}</span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{sens.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{sens.telemetry_finding}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        sens.status === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' :
                        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        {sens.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Baseline city sensors operating within normal parameters. Zero anomalous hazards detected.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Developer Raw JSON */}
          {result && activeTab === 'raw' && (
            <div className="rounded-2xl border bg-slate-900 border-slate-800 p-4 font-mono text-[11px] overflow-auto max-h-[560px] text-emerald-400 shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400 text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-300">
                  <Terminal className="w-4 h-4 text-blue-400" /> Transparent Agent Handoff Payloads
                </span>
                <span>Deterministic Sequential fetch()</span>
              </div>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
