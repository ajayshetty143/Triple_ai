import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
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
  LogIn,
  LogOut,
  ShieldCheck,
  Gauge,
  TrendingUp,
  Crosshair,
  Navigation,
  Map,
  Image as ImageIcon
} from 'lucide-react';

const MUNICIPAL_LOCATIONS = [
  { name: 'Sector 4 - 5th Ave & Elm Junction', type: 'Commercial & Transit Corridor', coords: '28.5355° N, 77.3910° E' },
  { name: 'National Highway 48 (Delhi-Gurgaon km 87)', type: 'High-Speed Arterial Highway', coords: '28.4595° N, 77.0266° E' },
  { name: 'Sector 2 - Regional Trauma & Medical Corridor', type: 'Emergency Hospital Hub', coords: '28.5700° N, 77.3200° E' },
  { name: 'Sector 1 - Nexus Central Plaza & Metro District', type: 'Civic Core & Passenger Concourse', coords: '28.6139° N, 77.2090° E' },
  { name: 'Sector 5 - Petrochemical & Industrial Zone', type: 'Industrial & Hazardous Materials', coords: '28.4089° N, 77.3178° E' },
  { name: 'Riverside Parkway & Floodplain District', type: 'Civil Drainage Basin', coords: '28.6500° N, 77.2500° E' },
];

const MUNICIPAL_ROLES = {
  commander: {
    id: 'commander',
    title: 'City Commander',
    dept: 'Central Executive Command',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    icon: '⭐',
    scope: 'All Sectors (Global Municipal Grid)',
    wsChannel: 'channel("dept:all")',
    focus: 'Cross-Agency Strategic Dispatch & Crisis Defense',
    feedId: 'CCTV-09 (Nexus City Boulevard)',
    defaultLocation: 'Sector 4 - 5th Ave & Elm Junction'
  },
  traffic: {
    id: 'traffic',
    title: 'Traffic & Highway Patrol',
    dept: 'Highway & Roadway Authority',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    icon: '🚦',
    scope: 'Sector 4, NH 48 Corridor & Arterials',
    wsChannel: 'channel("dept:traffic")',
    focus: 'Lane Diversions, Crash Clearances & Traffic Signals',
    feedId: 'CCTV-05 (4th Ave Crossing)',
    defaultLocation: 'National Highway 48 (Delhi-Gurgaon km 87)'
  },
  fire: {
    id: 'fire',
    title: 'Fire & Hazmat Marshal',
    dept: 'Bureau of Fire Suppression & Chemical Safety',
    badge: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
    icon: '🔥',
    scope: 'Sector 5 Petrochemical & Sector 4 Gas Lines',
    wsChannel: 'channel("dept:fire")',
    focus: 'Flashover Suppression, Gas Isolation & Water Pressure',
    feedId: 'CCTV-07 (5th Ave Junction)',
    defaultLocation: 'Sector 4 - 5th Ave & Elm Junction'
  },
  security: {
    id: 'security',
    title: 'Apartment & Facility Security',
    dept: 'Residential & Commercial Wardens',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: '🏢',
    scope: 'Residential Complexes, Lobbies & Perimeter CCTV',
    wsChannel: 'channel("dept:security")',
    focus: 'Resident Check-in, False Alarm Verification & Exit Safety',
    feedId: 'CCTV-09 (Nexus City Boulevard)',
    defaultLocation: 'Sector 1 - Nexus Central Plaza & Metro District'
  },
  ems: {
    id: 'ems',
    title: 'Trauma EMS Paramedic',
    dept: 'Emergency Medical & Hospital Triage',
    badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    icon: '🚑',
    scope: 'Sector 2 Medical Corridor & Trauma Centers',
    wsChannel: 'channel("dept:ems")',
    focus: 'Advanced Life Support (ALS), ICU Bed Triage & Extraction',
    feedId: 'CCTV-05 (4th Ave Crossing)',
    defaultLocation: 'Sector 2 - Regional Trauma & Medical Corridor'
  }
};

const PRESET_SCENARIOS = [
  {
    title: "Routine Surveillance & Safe Baseline",
    category: "Municipal Baseline",
    severity: "Safe (Green Light)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    icon: CheckCircle,
    text: "Optical surveillance confirms safe municipal baseline. Harmless stationary vehicle parked peacefully with zero collisions, zero injuries, zero structural damage, and no active hazards. Confirm safe green-light status.",
    cctvId: "CCTV-09 (Nexus City Boulevard)",
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
    cctvImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"
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
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [operatorSession, setOperatorSession] = useState(null);
  const [operatorRole, setOperatorRole] = useState('commander');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('smartcity_auth_token');
      const email = localStorage.getItem('smartcity_user_email');
      const name = localStorage.getItem('smartcity_operator_name');
      const role = localStorage.getItem('smartcity_operator_role');

      if (!token && !email) {
        router.replace('/login');
        return;
      }
      setOperatorSession(name || (email ? email.split('@')[0] : 'Commander'));
      if (role && MUNICIPAL_ROLES[role]) {
        setOperatorRole(role);
      }
      setAuthChecked(true);
    } catch (e) {
      router.replace('/login');
    }
  }, [router]);

  const handleSwitchRole = (roleKey) => {
    if (!MUNICIPAL_ROLES[roleKey]) return;
    setOperatorRole(roleKey);
    localStorage.setItem('smartcity_operator_role', roleKey);
    const roleCfg = MUNICIPAL_ROLES[roleKey];
    setIncidentLocation(roleCfg.defaultLocation);
    setIsRoleModalOpen(false);
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('smartcity_auth_token');
      localStorage.removeItem('smartcity_user_email');
      localStorage.removeItem('smartcity_operator_name');
      localStorage.removeItem('smartcity_operator_role');
      localStorage.removeItem('smartcity_registered');
    } catch (e) {}
    setOperatorSession(null);
    setAuthChecked(false);
    router.replace('/login');
  };

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

  // Geolocation & Sector State
  const [incidentLocation, setIncidentLocation] = useState('Sector 4 - 5th Ave & Elm Junction');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  const handleDetectGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        const locString = `Field GPS: ${lat}° N, ${lon}° E (Operator Fix)`;
        setIncidentLocation(locString);
        setIsDetectingGPS(false);
        setIsLocationModalOpen(false);
      },
      (err) => {
        console.warn("GPS lookup fallback:", err.message);
        setIncidentLocation("Field GPS: 28.5355° N, 77.3910° E (Triangulated)");
        setIsDetectingGPS(false);
        setIsLocationModalOpen(false);
      },
      { timeout: 7000 }
    );
  };

  // Live Municipal IoT Sensors
  const [citySensors, setCitySensors] = useState([
    { id: 'SENS-GAS-07', name: 'Mainline Gas Pipeline Monitor G-7', type: 'gas_pipeline', location: 'Sector 4 - 5th Ave', status: 'NORMAL', metric: '44.8 PSI' },
    { id: 'SENS-FLOOD-01', name: 'Stormwater Surge Drainage Gauge F-1', type: 'flood_gauge', location: 'Nexus City Riverfront', status: 'NORMAL', metric: '1.2m Depth' },
    { id: 'SENS-PWR-12', name: 'High-Voltage Substation Transformer T-12', type: 'power_grid', location: 'Downtown Grid Core', status: 'NORMAL', metric: '13.8 kV Stable' },
    { id: 'SENS-MED-04', name: 'Central Trauma Hospital Medical Hub', type: 'medical_hub', location: 'Sector 2 Medical Corridor', status: 'NORMAL', metric: '88% ICU Avail' },
    { id: 'SENS-TRAF-09', name: 'Arterial Traffic Flow Optical Sensor', type: 'traffic_camera', location: '5th Ave & Elm Junction', status: 'NORMAL', metric: '42 km/h Flow' }
  ]);

  useEffect(() => {
    async function loadCitySensors() {
      try {
        const { data } = await supabase.from('city_sensors').select('*');
        if (data && data.length > 0) {
          setCitySensors(data.map(d => ({
            id: d.id,
            name: d.sensor_name,
            type: d.sensor_type,
            location: d.location,
            status: d.status || 'NORMAL',
            metric: d.telemetry ? (d.telemetry.pressure_psi ? `${d.telemetry.pressure_psi} PSI` : (d.telemetry.water_level_m ? `${d.telemetry.water_level_m}m Depth` : 'Nominal')) : 'Nominal'
          })));
        }
      } catch (err) {}
    }
    loadCitySensors();
  }, []);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);
  const chatInputRef = useRef(null);

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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Vision analysis failed');
      }
      if (data.success && data.analysis) {
        const ana = data.analysis;
        setVisionAnalysis(ana);
        const hasHarm = ana.harm_detected === true || 
          ['ROUTINE_LOCAL', 'CRITICAL', 'LOW', 'MEDIUM', 'HIGH', 'SEVERE'].includes(ana.severity?.toUpperCase());
        
        if (hasHarm) {
          if (['CRITICAL', 'HIGH', 'SEVERE'].includes(ana.severity?.toUpperCase())) {
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
          setChatInput(synthesizedText);
          setChatMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `Optical evidence analyzed (${label}): ${ana.scene_description}. ${hasHarm ? 'Incident detected: action plan formulated below.' : 'Scene verified safe baseline.'}`,
              dossier: synthesizedText
            }
          ]);
        }
      }
    } catch (err) {
      console.warn("Vision analysis error:", err);
      setError(`AI Optical Vision Notice: ${err.message}. Please retry or select scenario manually.`);
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
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
      const rawDataUrl = event.target.result;
      if (isVideo) {
        setActiveMedia(rawDataUrl);
        return;
      }

      // Universal Browser Canvas Normalization:
      // Converts ANY format (.avif, .webp, .png, .jpg, .bmp, etc.) to standard image/jpeg
      // and constrains max dimension to 1280px for optimal speed and Groq compatibility
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width || 800;
          let height = img.naturalHeight || img.height || 600;
          const maxDim = 1280;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const normalizedJpeg = canvas.toDataURL('image/jpeg', 0.88);
          setActiveMedia(normalizedJpeg);
          runVisionAnalysis(normalizedJpeg, file.name);
        } catch (canvasErr) {
          console.warn("Canvas conversion fallback:", canvasErr);
          setActiveMedia(rawDataUrl);
          runVisionAnalysis(rawDataUrl, file.name);
        }
      };
      img.onerror = () => {
        setActiveMedia(rawDataUrl);
        runVisionAnalysis(rawDataUrl, file.name);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    const userMessage = { role: 'user', content: userText };
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
          evidenceLabel: activeCameraLabel,
          incidentLocation: incidentLocation
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chat assistant failed');
      }

      setChatMessages([
        ...newHistory, 
        { 
          role: 'assistant', 
          content: data.message,
          dossier: data.synthesizedIncident || null
        }
      ]);
      if (data.synthesizedIncident) {
        setActiveDossier(data.synthesizedIncident);
        setIncidentText(data.synthesizedIncident);
      }

      // Automatically sync priority scenario & CCTV camera feed if detected from dialogue
      const priority = data.suggestedPriority;
      if (priority) {
        setOpticalScenario(priority);
        if (mediaSource === 'cctv') {
          if (priority === 'critical') {
            setActiveMedia(PRESET_SCENARIOS[2].cctvImage);
            setActiveCameraLabel(PRESET_SCENARIOS[2].cctvId);
          } else if (priority === 'minor') {
            setActiveMedia(PRESET_SCENARIOS[1].cctvImage);
            setActiveCameraLabel(PRESET_SCENARIOS[1].cctvId);
          } else if (priority === 'safe') {
            setActiveMedia(PRESET_SCENARIOS[0].cctvImage);
            setActiveCameraLabel(PRESET_SCENARIOS[0].cctvId);
          }
        }
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

  const handleRunInvestigation = async (overrideIncidentText = null, overrideMedia = undefined, overrideCamera = undefined, overrideLocation = undefined) => {
    // Intelligent priority extraction for incident dispatch:
    // 1. Explicit argument override
    // 2. Active synthesized dossier
    // 3. Most recent synthesized dossier in chat history
    // 4. Most recent citizen/user message in chat (e.g. "fire accident to neighbour building")
    // 5. Current chat input
    // 6. Configured incident text
    let textToInvestigate = (
      overrideIncidentText || 
      activeDossier || 
      chatMessages.slice().reverse().find(m => m.dossier)?.dossier || 
      (chatMessages.slice().reverse().find(m => m.role === 'user')?.content ? `Citizen Incident Report: ${chatMessages.slice().reverse().find(m => m.role === 'user')?.content}` : null) ||
      chatInput.trim() || 
      incidentText || 
      ''
    ).trim();

    if (!textToInvestigate) {
      if (opticalScenario === 'safe') {
        textToInvestigate = `Field optical surveillance confirms safe municipal baseline. Harmless stationary vehicle parked peacefully with zero collisions, zero injuries, zero structural damage, and no active hazards. Confirm safe green-light status.`;
      } else if (opticalScenario === 'critical') {
        textToInvestigate = `Critical urban crisis: active structural fire / major emergency reported. Immediate multi-unit Fire Suppression, Hazmat, and EMS rescue required.`;
      } else {
        textToInvestigate = `Local vehicle incident: cyclist down on roadway after collision with vehicle. Deploy routine EMS and local traffic patrol.`;
      }
    }

    // Decoupling Rule:
    // If overrideMedia is passed (e.g. from preset scenario test button), use it.
    // If user explicitly uploaded evidence or took a camera snapshot (mediaSource === 'upload'), use activeMedia.
    // Otherwise, when chatting directly without uploading, do NOT attach the default CCTV image so the chat is never overridden.
    const mediaToUse = overrideMedia !== undefined 
      ? overrideMedia 
      : (mediaSource === 'upload' ? activeMedia : null);

    const cameraToUse = overrideCamera !== undefined 
      ? overrideCamera 
      : (mediaSource === 'upload' ? activeCameraLabel : 'Citizen Emergency Dialogue Intake');

    const locationToUse = overrideLocation !== undefined 
      ? overrideLocation 
      : incidentLocation;

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
          cameraSource: cameraToUse,
          mediaEvidence: mediaToUse ? true : false,
          imagePayload: mediaToUse || null,
          incidentLocation: locationToUse,
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

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#070a14] flex flex-col items-center justify-center text-white font-sans p-4">
        <Head>
          <title>NEXUS CITY OS // Verifying Gateway Access</title>
        </Head>
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <div className="absolute w-8 h-8 rounded-full bg-cyan-500/20 animate-ping" />
        </div>
        <div className="text-sm font-mono tracking-widest text-cyan-400 uppercase text-center">
          NEXUS CITY SECURITY GATEWAY // VERIFYING OPERATOR AUTHORIZATION
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">
          Connecting to central smart city neural core...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-200 font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Head>
        <title>NEXUS CITY // Autonomous Emergency Incident Platform</title>
        <meta name="description" content="NEXUS CITY — Autonomous Smart City Incident Investigation using Collaborative AI Agents" />
      </Head>

      {/* Master Top Navigation Bar & Unified View Switcher (ALL IN ONE PLACE) */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-[#0b1122]/95 border-slate-200 dark:border-slate-800/80 transition-colors shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-gradient-to-tr dark:from-blue-600 dark:via-indigo-600 dark:to-cyan-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">NEXUS CITY Command OS</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                  Enterprise v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Autonomous City Incident Investigation & Multi-Agent Dispatch
              </p>
            </div>
          </div>

          {/* UNIFIED MASTER VIEW SWITCHER TABS (ALL IN ONE PLACE) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('commander')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'commander'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Tactical Directive (Agent 3)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analyst')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'analyst'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Risk Matrix (Agent 2)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sensors')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'sensors'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>IoT & Optical (Agent 1)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'raw'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-slate-300" />
              <span>Audit Log</span>
            </button>
          </div>

          {/* Operational Metrics, Theme Toggle, Operator Profile & Stakeholder RBAC */}
          <div className="flex items-center gap-2 text-xs">
            <div className="hidden xl:flex items-center gap-2 font-medium">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono">Supabase Online</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                  {MUNICIPAL_ROLES[operatorRole]?.wsChannel || 'channel("dept:all")'}
                </span>
              </div>
              {result?.meta?.execution_time_ms && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{result.meta.execution_time_ms}ms</span>
                </div>
              )}
            </div>

            {/* Stakeholder Persona / RBAC Switcher Pill */}
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-2xs ${
                MUNICIPAL_ROLES[operatorRole]?.badge || 'bg-blue-50 text-blue-700'
              }`}
              title="Click to switch municipal stakeholder console (RBAC)"
            >
              <span>{MUNICIPAL_ROLES[operatorRole]?.icon}</span>
              <span className="font-bold text-[11px] max-w-[130px] truncate">{MUNICIPAL_ROLES[operatorRole]?.title}</span>
              <span className="text-[10px] opacity-75">▼</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Operator Session */}
            {operatorSession ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span className="font-semibold max-w-[90px] truncate text-[11px]">{operatorSession}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-500 transition cursor-pointer"
                  title="Sign Out to Gateway"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Connect to Nexus City Gateway"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gateway Login</span>
              </button>
            )}
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
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="pointer-events-auto bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded border border-white/20 text-slate-200 hover:text-white hover:bg-black/90 flex items-center gap-1 transition cursor-pointer"
                    title="Click to change or geotag incident location"
                  >
                    <MapPin className="w-2.5 h-2.5 text-red-400 animate-pulse" />
                    <span className="truncate max-w-[170px]">{incidentLocation}</span>
                  </button>
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

                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 transition text-xs shadow-xs cursor-pointer"
                  title="Tag or upload incident location / GPS fix"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Location</span>
                </button>
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

              {/* Optical Geotag Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  <span>Optical Geotag: <strong className="font-mono text-slate-800 dark:text-slate-200">{incidentLocation}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline text-[10px] shrink-0 ml-2 cursor-pointer"
                >
                  Edit / GPS
                </button>
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

            {/* Active Incident Geotag Bar for Conversation */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[11px] text-slate-500 font-semibold shrink-0">Incident Geotag:</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate font-mono">
                  {incidentLocation}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-semibold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 ml-2 shadow-2xs"
              >
                Change / GPS
              </button>
            </div>

            {/* Conversational Assistant */}
            <div className="flex flex-col gap-3">
              <div className="h-64 overflow-y-auto bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3.5 text-xs" ref={chatScrollRef}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'user' && (
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-blue-600 flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 max-w-[85%]`}>
                      <div className={`p-3 rounded-2xl leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-slate-900 text-white dark:bg-blue-600 rounded-br-sm shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-xs'
                      }`}>
                        {msg.content}
                      </div>

                      {/* Action Handoff Card right after conversation response */}
                      {msg.dossier && (
                        <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Incident Solution Ready
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Action Plan Ready</span>
                          </div>
                          <p className="text-[11px] text-slate-800 dark:text-slate-200 italic leading-relaxed bg-white/80 dark:bg-slate-950/70 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                            &ldquo;{msg.dossier}&rdquo;
                          </p>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleRunInvestigation(msg.dossier)}
                              disabled={loading}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-40 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                              <span>Authorize & Deploy Multi-Agent Cascade</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => chatInputRef.current?.focus()}
                              className="py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-600 transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Send to AI (Refine)</span>
                            </button>
                          </div>
                        </div>
                      )}
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
              {activeDossier && (() => {
                const isCrit = opticalScenario === 'critical' || /fire|blaze|burn|explosion|gas|leak|flood|critical|hazard|trapped|smoke|truck|crush|highway|pileup|head-on/i.test(activeDossier);
                const isMin = !isCrit && (opticalScenario === 'minor' || /accident|collision|skid|injured|cyclist|pedestrian|hurt|fall/i.test(activeDossier));

                const cardBg = isCrit 
                  ? 'bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-800/80' 
                  : isMin 
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80' 
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80';

                const badgeColor = isCrit 
                  ? 'text-red-700 dark:text-red-300' 
                  : isMin 
                  ? 'text-amber-700 dark:text-amber-300' 
                  : 'text-emerald-700 dark:text-emerald-300';

                const btnBg = isCrit 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : isMin 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white';

                const badgeLabel = isCrit 
                  ? '🔴 CODE RED EMERGENCY DOSSIER READY' 
                  : isMin 
                  ? '🟡 LOCAL INCIDENT RESPONSE DOSSIER' 
                  : '🟢 ALL CLEAR BASELINE DOSSIER';

                return (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${cardBg}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${badgeColor}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> {badgeLabel}
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${badgeColor}`}>Ready for Dispatch</span>
                    </div>
                    <p className="text-slate-900 dark:text-slate-100 italic leading-relaxed text-xs">
                      &ldquo;{activeDossier}&rdquo;
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRunInvestigation(activeDossier)}
                        disabled={loading}
                        className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-40 cursor-pointer ${btnBg}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>Authorize & Deploy Multi-Agent Emergency Cascade</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => chatInputRef.current?.focus()}
                        className="py-2 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send to AI (Refine)</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* User Incident Priority & Scenario Controls */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" /> Incident Priority & Scenario
                  </span>
                  <span className="text-[10px] font-semibold">
                    {opticalScenario === 'safe' ? (
                      <span className="text-emerald-700 dark:text-emerald-400">🟢 All Clear (Safe Baseline)</span>
                    ) : opticalScenario === 'minor' ? (
                      <span className="text-amber-700 dark:text-amber-400">🟡 Minor Skid (Yellow Alert)</span>
                    ) : (
                      <span className="text-red-700 dark:text-red-400">🔴 Critical Crisis (Red Alert)</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOpticalScenario('safe');
                      if (mediaSource === 'cctv') {
                        setActiveMedia(PRESET_SCENARIOS[0].cctvImage);
                        setActiveCameraLabel(PRESET_SCENARIOS[0].cctvId);
                      }
                      const text = PRESET_SCENARIOS[0].text;
                      setIncidentText(text);
                      setActiveDossier(text);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      opticalScenario === 'safe'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>🟢 Safe (All Clear)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpticalScenario('minor');
                      if (mediaSource === 'cctv') {
                        setActiveMedia(PRESET_SCENARIOS[1].cctvImage);
                        setActiveCameraLabel(PRESET_SCENARIOS[1].cctvId);
                      }
                      const text = PRESET_SCENARIOS[1].text;
                      setIncidentText(text);
                      setActiveDossier(text);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      opticalScenario === 'minor'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>🟡 Minor Skid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpticalScenario('critical');
                      if (mediaSource === 'cctv') {
                        setActiveMedia(PRESET_SCENARIOS[2].cctvImage);
                        setActiveCameraLabel(PRESET_SCENARIOS[2].cctvId);
                      }
                      const text = PRESET_SCENARIOS[2].text;
                      setIncidentText(text);
                      setActiveDossier(text);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      opticalScenario === 'critical'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>🔴 Critical Crisis</span>
                  </button>
                </div>
              </div>

              {/* Chat Input Bar with Embedded Geotag Pin */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <div className="relative flex-1 flex items-center">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Describe incident at ${incidentLocation.split(' - ')[0] || 'location'}...`}
                    className="w-full text-xs rounded-xl pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-blue-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="absolute right-2.5 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Change or geotag location"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Send input to AI assistant"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to AI</span>
                </button>
              </form>

              {/* 1-Click Multi-Agent Cascade Dispatch Button */}
              <button
                type="button"
                onClick={() => {
                  const latestDossier = activeDossier || chatMessages.slice().reverse().find(m => m.dossier)?.dossier;
                  const latestUserMsg = chatMessages.slice().reverse().find(m => m.role === 'user')?.content;
                  const textToSend = latestDossier || (latestUserMsg ? `Citizen Emergency Report: ${latestUserMsg}` : '') || chatInput.trim() || incidentText;
                  handleRunInvestigation(textToSend);
                }}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  opticalScenario === 'critical' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : opticalScenario === 'minor' 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
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
          
          {/* Active Investigation Tactical Status Bar (Visible when result exists) */}
          {result && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  agent3?.threat_level === 'CRITICAL' || agent3?.threat_level === 'HIGH'
                    ? 'bg-red-500 animate-ping'
                    : agent3?.threat_level === 'ALL_CLEAR' || agent3?.threat_level === 'SAFE'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500 animate-pulse'
                }`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {agent3?.threat_level === 'ALL_CLEAR' || agent3?.threat_level === 'SAFE' ? '🟢 Code Green: All Clear Dossier' :
                   agent3?.threat_level === 'LOW' || agent3?.threat_level === 'ROUTINE' ? '🟡 Yellow Alert: Local Response Plan' :
                   '🔴 Code Red: Emergency Crisis Plan'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {result.meta?.timestamp ? new Date(result.meta.timestamp).toLocaleTimeString() : 'Live'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setResult(null); setActiveStep(0); }}
                className="text-xs text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition font-medium cursor-pointer"
                title="Clear current results and return to Live City Grid"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset / Ingest New Incident</span>
              </button>
            </div>
          )}

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

          {loading && (
            <div className="flex-1 min-h-[460px] flex flex-col items-center justify-center p-12 text-center rounded-2xl border bg-slate-100/60 dark:bg-blue-950/10 border-slate-300 dark:border-blue-900/40">
              <Loader2 className="w-10 h-10 text-slate-800 dark:text-blue-500 animate-spin mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-blue-300 text-sm">Autonomous Multi-Agent Cascade in Progress</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1">
                Data Gatherer is cross-referencing your optical evidence with Supabase, Risk Analyst is modeling cascading failure trees, and Command Dispatcher is drafting tactical orders.
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ZERO-EMPTY-SPACE: LIVE CITY OPERATIONS DECK (Rendered when result is null) */}
          {/* ========================================================================= */}
          {!result && !loading && (
            <div className="space-y-4">
              
              {/* 1. Real-Time City Infrastructure KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">City Grid Defense</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Nominal (Safe)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Zero Active Disasters</span>
                </div>

                <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Emergency Units</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">48 Ready</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">EMS, Traffic & Patrol</span>
                </div>

                <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Municipal IoT</span>
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">5 Feeds Online</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Supabase PostgreSQL</span>
                </div>

                <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Optical Stream</span>
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">1080P // 30 FPS</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">VLM Vision Ready</span>
                </div>
              </div>

              {/* 2. Live Municipal IoT Sensor Telemetry Matrix (From Supabase) */}
              <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Municipal IoT Telemetry Matrix (Supabase Connected)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    ● Real-Time Feeds Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {citySensors.map((sensor) => (
                    <div 
                      key={sensor.id}
                      className="p-3 rounded-xl border bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-cyan-400">
                          {sensor.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          sensor.status === 'CRITICAL'
                            ? 'bg-red-500 text-white'
                            : sensor.status === 'WARNING'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {sensor.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block truncate">
                          {sensor.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          📍 {sensor.location}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Live Reading:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sensor.metric}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Rapid Tactical Scenario Launchpad (Interactive 1-Click Triggers) */}
              <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Rapid Scenario Simulation & Incident Launchpad
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Click to test multi-agent decisioning
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Scenario 1: Safe Baseline */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>🟢 Safe Observation</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Stationary parked vehicle / harmless street scene. Tests optical verification & all-clear baseline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpticalScenario('safe');
                        setActiveMedia(PRESET_SCENARIOS[0].cctvImage);
                        setActiveCameraLabel(PRESET_SCENARIOS[0].cctvId);
                        const text = PRESET_SCENARIOS[0].text;
                        setIncidentText(text);
                        setActiveDossier(text);
                        handleRunInvestigation(text, PRESET_SCENARIOS[0].cctvImage, PRESET_SCENARIOS[0].cctvId);
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-200" />
                      <span>Run Safe Baseline Test</span>
                    </button>
                  </div>

                  {/* Scenario 2: Minor Skid */}
                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold mb-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span>🟡 Minor Bike Skid</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Cyclist down on roadway with minor injuries. Tests routine EMS and traffic patrol dispatch.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpticalScenario('minor');
                        setActiveMedia(PRESET_SCENARIOS[1].cctvImage);
                        setActiveCameraLabel(PRESET_SCENARIOS[1].cctvId);
                        const text = PRESET_SCENARIOS[1].text;
                        setIncidentText(text);
                        setActiveDossier(text);
                        handleRunInvestigation(text, PRESET_SCENARIOS[1].cctvImage, PRESET_SCENARIOS[1].cctvId);
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Run Minor Skid Test</span>
                    </button>
                  </div>

                  {/* Scenario 3: Critical Hazard */}
                  <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/40 dark:bg-red-950/20 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 text-xs font-bold mb-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>🔴 Code Red Hazard</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Gas mainline rupture with surface fire. Tests multi-unit Hazmat, Fire & Rescue, and civil evacuation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpticalScenario('critical');
                        setActiveMedia(PRESET_SCENARIOS[2].cctvImage);
                        setActiveCameraLabel(PRESET_SCENARIOS[2].cctvId);
                        const text = PRESET_SCENARIOS[2].text;
                        setIncidentText(text);
                        setActiveDossier(text);
                        handleRunInvestigation(text, PRESET_SCENARIOS[2].cctvImage, PRESET_SCENARIOS[2].cctvId);
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-red-200" />
                      <span>Run Code Red Test</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Multi-Agent Pipeline Architecture Guide */}
              <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" /> Deterministic Agent Cascade Architecture
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">3 Autonomous Reasoning Tiers</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-cyan-400 block text-[11px]">Tier 1: Data Gatherer</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ingests optical tokens, verifies casualties, and queries Supabase SQL.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-indigo-400 block text-[11px]">Tier 2: Risk Analyst</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Models cascading infrastructure vulnerability trees & critical thresholds.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-emerald-400 block text-[11px]">Tier 3: Tactical Commander</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Dispatches tactical units (EMS/Hazmat) and issues public bulletins.</p>
                  </div>
                </div>
              </div>

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
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>Target Sector: <strong className="font-mono text-slate-900 dark:text-white">{result?.meta?.incident_location || incidentLocation}</strong></span>
                  </div>
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
              {result?.meta?.attached_image ? (
                <div className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img src={result.meta.attached_image} alt="Evidence Rendered" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Optical Evidence Attached & Processed
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {result?.meta?.camera_source || activeCameraLabel}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>Incident Geotag: <strong className="font-mono text-slate-800 dark:text-slate-200">{result?.meta?.incident_location || incidentLocation}</strong></span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Cross-referenced by Agent 1 (Multimodal Vision) and Agent 3 for tactical unit deployment.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Citizen Dialogue Dispatch // Text Triage Mode
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      Direct Incident Ingestion (Decoupled from background municipal cameras)
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>Incident Geotag: <strong className="font-mono text-slate-800 dark:text-slate-200">{result?.meta?.incident_location || incidentLocation}</strong></span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Multi-agent cascade executed directly on reported emergency context with zero optical bias.
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

              {/* Segregated Departmental Routing Matrix (WebSockets) */}
              <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Multi-Stakeholder Segregated Dispatch Matrix (WebSocket Routing)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                    RBAC Partitioned
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Fire Bureau */}
                  <div className={`p-3 rounded-xl border text-xs transition ${
                    operatorRole === 'fire' 
                      ? 'border-red-500 bg-red-50/80 dark:bg-red-950/40 text-red-950 dark:text-red-200 ring-2 ring-red-500/30' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <span>🔥</span> Fire & Hazmat Bureau
                      </span>
                      {operatorRole === 'fire' && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-mono font-bold">YOUR CONSOLE</span>}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {agent3.three_step_dispatch_plan?.[0]?.action_orders || 'Phase 1: Fire suppression, water pressure boost & gas line isolation.'}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                      <span>Units:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{agent3.three_step_dispatch_plan?.[0]?.units_dispatched?.join(', ') || 'Engine Co 9, Ladder 3'}</span>
                    </div>
                  </div>

                  {/* Traffic Command */}
                  <div className={`p-3 rounded-xl border text-xs transition ${
                    operatorRole === 'traffic' 
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <span>🚦</span> Traffic & Roadway Command
                      </span>
                      {operatorRole === 'traffic' && <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded font-mono font-bold">YOUR CONSOLE</span>}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {agent3.three_step_dispatch_plan?.[2]?.action_orders || agent3.three_step_dispatch_plan?.[1]?.action_orders || 'Phase 2: Enforce arterial lane lockdown; divert civilian traffic upstream.'}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                      <span>Units:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{agent3.three_step_dispatch_plan?.[2]?.units_dispatched?.join(', ') || 'Nexus City Traffic Patrol'}</span>
                    </div>
                  </div>

                  {/* Trauma EMS */}
                  <div className={`p-3 rounded-xl border text-xs transition ${
                    operatorRole === 'ems' 
                      ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-200 ring-2 ring-cyan-500/30' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                        <span>🚑</span> Regional Trauma EMS
                      </span>
                      {operatorRole === 'ems' && <span className="text-[9px] bg-cyan-600 text-white px-2 py-0.5 rounded font-mono font-bold">YOUR CONSOLE</span>}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {agent3.three_step_dispatch_plan?.[1]?.action_orders || 'Phase 2: Establish forward trauma triage point; prep emergency ICU transport.'}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                      <span>Units:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{agent3.three_step_dispatch_plan?.[1]?.units_dispatched?.join(', ') || 'Nexus City Trauma EMS Squad'}</span>
                    </div>
                  </div>

                  {/* Apartment Security */}
                  <div className={`p-3 rounded-xl border text-xs transition ${
                    operatorRole === 'security' 
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span>🏢</span> Apartment & Facility Security
                      </span>
                      {operatorRole === 'security' && <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded font-mono font-bold">YOUR CONSOLE</span>}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Phase 3: Sound building alarms; secure perimeter exit corridors and verify false alarms or residential evacuations.
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                      <span>Units:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Building Warden Unit & Civil Defense Squad</span>
                    </div>
                  </div>
                </div>
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
                {result?.meta?.attached_image ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img src={result.meta.attached_image} alt="Evidence Render" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                    <MessageSquare className="w-7 h-7" />
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

        {/* ========================================================================= */}
        {/* INCIDENT GEOLOCATION & SECTOR PICKER MODAL */}
        {/* ========================================================================= */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Set Incident Geolocation & Sector
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Geotags optical evidence & routes conversational multi-agent dispatch
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1-Click GPS Auto-Detection */}
              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                    Live Device GPS Auto-Detection
                  </span>
                  <span className="text-[11px] text-blue-700/80 dark:text-blue-400 block">
                    Fix coordinates via browser sensor
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingGPS}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isDetectingGPS ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fixing GPS...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Detect GPS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Municipal Sectors */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Nexus City Municipal Grid Sectors
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {MUNICIPAL_LOCATIONS.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIncidentLocation(loc.name);
                        setIsLocationModalOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col cursor-pointer ${
                        incidentLocation === loc.name
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-semibold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{loc.name}</span>
                        {incidentLocation === loc.name && <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{loc.type}</span>
                        <span className="font-mono">{loc.coords}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Location Input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Or Enter Custom Street, Landmark, or Coordinates:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLocationInput}
                    onChange={(e) => setCustomLocationInput(e.target.value)}
                    placeholder="e.g. 5th Ave & Pine St, Sector 3, Building 14"
                    className="flex-1 text-xs rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customLocationInput.trim()) {
                        setIncidentLocation(customLocationInput.trim());
                        setCustomLocationInput('');
                        setIsLocationModalOpen(false);
                      }
                    }}
                    disabled={!customLocationInput.trim()}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Current Active Location Display */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Active Incident Geotag:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono truncate max-w-[250px]">
                  {incidentLocation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MUNICIPAL STAKEHOLDER PERSONA SWITCHER MODAL (RBAC) */}
        {/* ========================================================================= */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
                    <span>👥</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Switch Stakeholder Persona (RBAC)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Simulates role-based access control & segregated real-time WebSockets
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {Object.values(MUNICIPAL_ROLES).map((roleItem) => (
                  <button
                    key={roleItem.id}
                    type="button"
                    onClick={() => handleSwitchRole(roleItem.id)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      operatorRole === roleItem.id
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{roleItem.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {roleItem.title}
                        </span>
                        {operatorRole === roleItem.id && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                            ACTIVE CONSOLE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{roleItem.dept}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">WebSocket:</span>
                        <code className="bg-slate-200/70 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{roleItem.wsChannel}</code>
                        <span className="opacity-40">•</span>
                        <span>Scope: {roleItem.scope}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Multi-Tenancy Protocol:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Row-Level Security & Topic Isolation Active
                </span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
