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
  ZapOff
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    title: "Gas Leak & Structural Fire",
    icon: Flame,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20",
    text: "Heavy odor of natural gas reported near 5th Ave & Elm Junction with surface fire spreading toward commercial buildings. Multiple vehicles stranded in intersection.",
    cctvId: "CAM-07 (5th Ave Junction)",
    cctvImage: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Flash Flood & Inundation",
    icon: Droplets,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20",
    text: "Riverside arterial water gauge indicates sudden surge above 4.8m. Lower River District roadway submerged, blocking main emergency route to St. Jude Trauma Center.",
    cctvId: "CAM-01 (Riverside Arterial)",
    cctvImage: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Substation Grid Overload",
    icon: Zap,
    color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20",
    text: "Substation Beta-9 reporting 94% load and critical transformer heating. Secondary coolant valve warning triggered in Industrial Park border.",
    cctvId: "CAM-04 (Substation Beta-9)",
    cctvImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80"
  }
];

export default function Dashboard() {
  // Input Mode: 'quick' (CAD entry) or 'chat' (Gemini-style Conversational Triage)
  const [inputMode, setInputMode] = useState('quick'); 

  // Quick CAD Mode State
  const [incidentText, setIncidentText] = useState(PRESET_SCENARIOS[0].text);
  
  // Conversational AI Chatbot State (Gemini Style)
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your City Emergency AI Intake Assistant. Describe any urban incident, accident, or hazard. I'll help triage the situation and prepare a dispatch dossier for the 3-agent command cascade."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeDossier, setActiveDossier] = useState(null);

  // Investigation Pipeline State
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0 = idle, 1 = Agent 1, 2 = Agent 2, 3 = Agent 3
  const [activeTab, setActiveTab] = useState('commander'); // 'commander', 'analyst', 'sensors', 'raw'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Visual Evidence / Live Cam State
  const [mediaSource, setMediaSource] = useState('cctv');
  const [activeMedia, setActiveMedia] = useState(PRESET_SCENARIOS[0].cctvImage);
  const [activeCameraLabel, setActiveCameraLabel] = useState(PRESET_SCENARIOS[0].cctvId);
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [clockTime, setClockTime] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Live HUD clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat window
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Handle Scenario Switch
  const selectScenario = (scenario) => {
    setIncidentText(scenario.text);
    if (mediaSource === 'cctv') {
      setActiveMedia(scenario.cctvImage);
      setActiveCameraLabel(scenario.cctvId);
      setIsVideoMedia(false);
    }
  };

  // Start Live Laptop Webcam
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
      setActiveCameraLabel("LIVE OPERATOR FEED // TERMINAL CAM-01");
    } catch (err) {
      console.error("Webcam error:", err);
      alert("Could not access camera: " + err.message);
      setIsWebcamActive(false);
    }
  };

  // Capture Snapshot from Live Webcam
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
    setActiveCameraLabel("CAPTURED SNAPSHOT // LOCAL SURVEILLANCE");
  };

  // Stop Webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  // Handle File Upload (Image or Video)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopWebcam();
    const isVideo = file.type.startsWith('video/');
    setIsVideoMedia(isVideo);
    setMediaSource('upload');
    setActiveCameraLabel(`UPLOADED EVIDENCE // ${file.name.substring(0, 24)}`);

    const reader = new FileReader();
    reader.onload = (event) => {
      setActiveMedia(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Conversational Chat (Gemini / ChatGPT Style)
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
        body: JSON.stringify({ messages: newHistory }),
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
        { role: 'assistant', content: 'Connection issue with intake service: ' + err.message }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Run 3-Agent Waterfall Pipeline
  const handleRunInvestigation = async (overrideIncidentText = null) => {
    const textToInvestigate = (overrideIncidentText || incidentText || activeDossier || '').trim();
    if (!textToInvestigate) return;

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
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Pipeline investigation failed.');
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
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-sans">
      <Head>
        <title>AUTONOMOUS CITY COMMAND // INCIDENT RESPONSE</title>
        <meta name="description" content="Autonomous 3-Agent Urban Emergency Pipeline with Conversational AI & Surveillance" />
      </Head>

      {/* Top Navigation Bar */}
      <header className="border-b border-gray-800 bg-[#0d1322]/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-red-400 font-semibold">City Command Operations</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">Autonomous Incident Investigation System</h1>
          </div>
        </div>

        {/* System Badges */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Connected</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini-Style Triage Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>3-Agent Cascade</span>
          </div>
          {result?.meta?.execution_time_ms && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{result.meta.execution_time_ms}ms</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Feed, Input & Stepper (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* ==================================================== */}
          {/* VISUAL SURVEILLANCE & CAMERA HUD FEED                */}
          {/* ==================================================== */}
          <div className="bg-[#0f172a]/80 border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-3 border-b border-gray-800 bg-[#0b101d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-[11px] font-bold text-gray-200 tracking-wider">
                  SURVEILLANCE HUD // {activeCameraLabel}
                </span>
              </div>
              <span className="font-mono text-[10px] text-gray-400">{clockTime}</span>
            </div>

            {/* Video Viewfinder with Real Security Cam HUD */}
            <div className="relative bg-black h-44 w-full flex items-center justify-center overflow-hidden border-b border-gray-800/80">
              
              {/* CCTV HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10 p-3 flex flex-col justify-between font-mono text-[10px] text-emerald-400/80">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-red-400 font-bold">REC ●</span>
                  </div>
                  <div className="bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    FPS: 30 // RTSP-STREAM
                  </div>
                </div>
                
                <div className="self-center opacity-30 text-emerald-400 text-lg select-none">
                  +
                </div>

                <div className="flex justify-between items-end">
                  <span className="bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    OPTICAL RES: 1080P
                  </span>
                  <span className="bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    ZONE: SECTOR 4
                  </span>
                </div>
              </div>

              {/* Render Media: Live Webcam, Video, or Image */}
              {isWebcamActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              ) : isVideoMedia && activeMedia ? (
                <video 
                  src={activeMedia} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : activeMedia ? (
                <img 
                  src={activeMedia} 
                  alt="Surveillance Feed" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 text-xs">
                  <Camera className="w-8 h-8 mb-1 opacity-40" />
                  <span>No Optical Signal Connected</span>
                </div>
              )}
            </div>

            {/* Media Action Controls */}
            <div className="p-3 bg-[#0d1424] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                {isWebcamActive ? (
                  <button
                    type="button"
                    onClick={captureWebcamSnapshot}
                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition text-[11px]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap Snapshot</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1.5 transition text-[11px] border border-gray-700"
                  >
                    <Video className="w-3.5 h-3.5 text-red-400" />
                    <span>Live Cam</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1.5 transition text-[11px] border border-gray-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
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
                className="text-[10px] text-gray-400 hover:text-gray-200 flex items-center gap-1"
                title="Reset to Municipal CCTV Feeds"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset CCTV</span>
              </button>
            </div>
          </div>

          {/* ==================================================== */}
          {/* DUAL MODE SELECTOR: QUICK CAD vs GEMINI CHAT BOT    */}
          {/* ==================================================== */}
          <div className="bg-[#0f172a]/70 border border-gray-800/80 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            
            {/* Mode Switch Tabs */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" /> Intake Mechanism
              </span>
              <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setInputMode('quick')}
                  className={`px-3 py-1 rounded-md transition font-medium ${
                    inputMode === 'quick' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  ⚡ Direct Entry
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('chat')}
                  className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                    inputMode === 'chat' 
                      ? 'bg-cyan-600 text-white shadow-sm' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Gemini Intake Bot</span>
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* MODE 1: DIRECT CAD / PRESET ENTRY                   */}
            {/* ---------------------------------------------------- */}
            {inputMode === 'quick' && (
              <div className="space-y-4">
                {/* Presets */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                    Quick One-Click Scenarios:
                  </span>
                  {PRESET_SCENARIOS.map((scenario, idx) => {
                    const IconComponent = scenario.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectScenario(scenario)}
                        className={`text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between gap-3 ${scenario.color}`}
                      >
                        <div className="flex items-center gap-2.5 font-medium">
                          <IconComponent className="w-4 h-4 shrink-0" />
                          <span>{scenario.title}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {/* Input Text Area */}
                <div>
                  <label htmlFor="incident" className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Custom Incident Report
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Proportional Reasoning Active</span>
                  </label>
                  
                  <textarea
                    id="incident"
                    rows={3}
                    value={incidentText}
                    onChange={(e) => setIncidentText(e.target.value)}
                    placeholder="Enter any incident (e.g. 'a person fell down on road by bike skid' or 'transformer fire')..."
                    className="w-full bg-[#080d1a] border border-gray-700/60 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans transition resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRunInvestigation()}
                  disabled={loading || !incidentText.trim()}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing 3-Agent Cascade...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Initiate Autonomous Investigation</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* MODE 2: CONVERSATIONAL GEMINI-STYLE INTAKE BOT      */}
            {/* ---------------------------------------------------- */}
            {inputMode === 'chat' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Chatting with Virtual Emergency Operator</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Contextual Triage</span>
                </div>

                {/* Chat Scrollbox */}
                <div 
                  ref={chatScrollRef}
                  className="h-64 overflow-y-auto bg-[#070b14] border border-gray-800 rounded-lg p-3 space-y-3 font-sans text-xs"
                >
                  {chatMessages.map((msg, mIdx) => (
                    <div 
                      key={mIdx}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role !== 'user' && (
                        <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-800/90 text-gray-200 border border-gray-700/60 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>AI Intake Operator is thinking & analyzing context...</span>
                    </div>
                  )}
                </div>

                {/* Chat Input Field */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message: 'a person fell down on road by bike skid'..."
                    className="flex-1 bg-[#080d1a] border border-gray-700/60 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition disabled:opacity-40"
                  >
                    Send
                  </button>
                </form>

                {/* Hand-off to 3 Agents Button */}
                <button
                  type="button"
                  onClick={() => {
                    const textToSend = activeDossier || chatMessages[chatMessages.length - 1]?.content || incidentText;
                    handleRunInvestigation(textToSend);
                  }}
                  disabled={loading || chatMessages.length < 2}
                  className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transferring to 3-Agent Dispatch Cascade...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Authorize 3-Agent Dispatch from this Chat</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* 3-Agent Waterfall Stepper */}
          <div className="bg-[#0f172a]/70 border border-gray-800/80 rounded-xl p-5 shadow-lg">
            <h2 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Autonomous Pipeline Cascade
            </h2>

            <div className="space-y-4 font-mono text-xs">
              {/* Agent 1 */}
              <div className={`p-3 rounded-lg border transition ${
                activeStep >= 1 ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' : 'border-gray-800 bg-gray-900/40 text-gray-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">1</span>
                    <span>AGENT 1: DATA & OPTICAL GATHERER</span>
                  </div>
                  {activeStep >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="mt-1 text-[11px] text-gray-400 font-sans">
                  Fuses live intake report with Supabase sensors (Proportional Relevance Filter).
                </p>
              </div>

              {/* Agent 2 */}
              <div className={`p-3 rounded-lg border transition ${
                activeStep >= 2 ? 'border-amber-500/40 bg-amber-950/20 text-amber-300' : 'border-gray-800 bg-gray-900/40 text-gray-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px]">2</span>
                    <span>AGENT 2: RISK ANALYST</span>
                  </div>
                  {activeStep >= 2 && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="mt-1 text-[11px] text-gray-400 font-sans">
                  Calculates real cascading risks (Calibrated LOW, MEDIUM, HIGH, CRITICAL).
                </p>
              </div>

              {/* Agent 3 */}
              <div className={`p-3 rounded-lg border transition ${
                activeStep >= 3 ? 'border-red-500/40 bg-red-950/20 text-red-300' : 'border-gray-800 bg-gray-900/40 text-gray-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[10px]">3</span>
                    <span>AGENT 3: CITY COMMANDER</span>
                  </div>
                  {activeStep >= 3 && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                </div>
                <p className="mt-1 text-[11px] text-gray-400 font-sans">
                  Authorizes proportionate 3-step action orders (EMS for falls, Hazmat for fires).
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Right Column: Output Command Deck & Transparency Tabs (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Tab Selector Header */}
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto text-xs font-mono">
            <button
              onClick={() => setActiveTab('commander')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === 'commander' 
                  ? 'bg-red-500/20 border border-red-500/50 text-red-300' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Dispatch Directive (Agent 3)
            </button>
            <button
              onClick={() => setActiveTab('analyst')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === 'analyst' 
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Risk Assessment (Agent 2)
            </button>
            <button
              onClick={() => setActiveTab('sensors')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === 'sensors' 
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Telemetry & Visuals (Agent 1)
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === 'raw' 
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Raw Pipeline JSON
            </button>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-600/50 text-red-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold">Investigation Pipeline Error</p>
                <p className="text-xs text-red-400/90 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State before running */}
          {!result && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl border border-gray-800/80 bg-[#0f172a]/30">
              <ShieldAlert className="w-12 h-12 text-gray-600 mb-3" />
              <h3 className="font-bold text-gray-300 text-base">Awaiting Emergency Dispatch Trigger</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Enter an incident via Direct Entry or chat with the Gemini Intake Bot on the left, then launch the investigation.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-xl border border-cyan-800/40 bg-cyan-950/10 animate-pulse">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
              <h3 className="font-bold text-cyan-300 text-sm font-mono">FUSING OPTICAL FEED & SENSOR DATA...</h3>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Data Gatherer is checking Supabase relevance, Analyst is determining proportionate risks, Commander is drafting targeted dispatch orders.
              </p>
            </div>
          )}

          {/* TAB 1: Commander Final 3-Step Dispatch Orders */}
          {result && activeTab === 'commander' && agent3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-red-400 font-bold">Commander Directive Authorized</span>
                  <h2 className="text-base font-bold text-white mt-0.5">{agent3.directive_title}</h2>
                </div>
                <span className={`px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-wider ${
                  agent3.threat_level === 'CRITICAL' ? 'bg-red-600 text-white' :
                  agent3.threat_level === 'HIGH' ? 'bg-orange-600 text-white' :
                  agent3.threat_level === 'MEDIUM' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  THREAT: {agent3.threat_level || 'ROUTINE'}
                </span>
              </div>

              {/* 3 Step Dispatch Plan Cards */}
              <div className="space-y-3">
                {agent3.three_step_dispatch_plan?.map((stepItem, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0f172a]/80 border border-gray-800 shadow-md flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-xs font-bold font-mono">
                          {stepItem.step || i + 1}
                        </span>
                        <h4 className="text-sm font-bold text-gray-200">{stepItem.title}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed pl-8">
                      {stepItem.action_orders}
                    </p>

                    {stepItem.units_dispatched?.length > 0 && (
                      <div className="pl-8 pt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-gray-500 mr-1">Units Dispatched:</span>
                        {stepItem.units_dispatched.map((unit, uIdx) => (
                          <span key={uIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-cyan-300">
                            {unit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Public Broadcast Box */}
              {agent3.public_broadcast_alert && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                    <Radio className="w-4 h-4" /> PUBLIC CIVILIAN ADVISORY
                  </div>
                  <p className="text-xs leading-relaxed italic text-amber-200/90">
                    &ldquo;{agent3.public_broadcast_alert}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Analyst Cascading Risk Tree */}
          {result && activeTab === 'analyst' && agent2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold">Agent 2 Risk Assessment</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">Cascading Infrastructure Vulnerabilities</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-gray-400 block">Critical Window</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{agent2.time_to_critical_failure}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0f172a] border border-gray-800">
                <h4 className="text-xs font-mono uppercase text-gray-400 mb-2">Strategic Assessment</h4>
                <p className="text-xs text-gray-300 leading-relaxed">{agent2.analyst_assessment}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-gray-400">Cascading Failures Identified</h4>
                {agent2.cascading_vulnerabilities?.map((vuln, vIdx) => (
                  <div key={vIdx} className="p-3 rounded-lg bg-gray-900/60 border border-gray-800 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-amber-300">{vuln.system}</span>
                      <p className="text-xs text-gray-300 mt-0.5">{vuln.risk}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Agent 1 Sensor Telemetry & Visual Surveillance Summary */}
          {result && activeTab === 'sensors' && agent1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold">Agent 1 Ground-Truth</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                    {agent1.incident_classification || 'ASSESSED'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">Database & Optical Fusion Summary</h3>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">{agent1.data_synthesis}</p>
              </div>

              {agent1.visual_surveillance_analysis && (
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-1.5">
                    <Eye className="w-4 h-4" /> Optical Surveillance Corroboration
                  </div>
                  <p className="text-xs text-cyan-200 leading-relaxed">
                    {agent1.visual_surveillance_analysis}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-gray-400">Critical Sensors Flagged in Supabase</h4>
                {agent1.critical_sensors?.length > 0 ? (
                  agent1.critical_sensors.map((sens, sIdx) => (
                    <div key={sIdx} className="p-3 rounded-lg bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">{sens.id}</span>
                          <span className="text-xs text-gray-200">{sens.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{sens.telemetry_finding}</p>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        sens.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {sens.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                    No anomalous city sensors correlate with this localized incident.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Raw JSON Handoff (Proof for Judges) */}
          {result && activeTab === 'raw' && (
            <div className="bg-[#050811] rounded-xl border border-gray-800 p-4 font-mono text-[11px] overflow-auto max-h-[600px] text-emerald-400">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800 text-gray-400">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-300">
                  <Terminal className="w-4 h-4 text-cyan-400" /> Transparent Pipeline Payloads
                </span>
                <span className="text-[10px] text-gray-500">Pure sequential fetch()</span>
              </div>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
