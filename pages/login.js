import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Procedural Web Audio API Sound Synthesizer (Zero external audio files needed)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported.');
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.playClick();
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.08) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playChirp(startFreq, endFreq, duration = 0.12, gainVal = 0.07, type = 'sine') {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playClick() {
    this.playChirp(600, 900, 0.06, 0.06);
  }

  playKey() {
    const variations = [520, 560, 600, 640];
    const freq = variations[Math.floor(Math.random() * variations.length)];
    this.playTone(freq, 'triangle', 0.03, 0.025);
  }

  playSuccess() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.08);
      }, idx * 75);
    });
  }

  playError() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    const notes = [280, 220];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.16, 0.06);
      }, idx * 110);
    });
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [soundFX, setSoundFX] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState('cyan');
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  
  // Login Form (with standard demo credentials pre-filled for immediate testing)
  const [loginEmail, setLoginEmail] = useState('operator@nexuscity.gov');
  const [loginPassword, setLoginPassword] = useState('nexuscity2026');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup Form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Password Strength
  const [passwordScore, setPasswordScore] = useState(0);

  // Toasts
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const sfx = new SoundFX();
    setSoundFX(sfx);

    // Initial Registration Check (Always default to Operator Login for immediate entry)
    try {
      const savedEmail = localStorage.getItem('smartcity_user_email');
      if (savedEmail) {
        setLoginEmail(savedEmail);
      }
      setAuthView('login');
    } catch (e) {}

    // Set initial theme
    document.documentElement.setAttribute('data-theme', 'cyan');
  }, []);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (soundFX) soundFX.playClick();
  };

  const handleToggleSound = () => {
    if (soundFX) {
      const enabled = soundFX.toggle();
      setSoundEnabled(enabled);
    }
  };

  const calculatePasswordStrength = (val) => {
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setPasswordScore(score);
  };

  const handleQuickDemoLogin = () => {
    if (soundFX) soundFX.playSuccess();
    showToast('⚡ 1-Click Demo Access Authorized! Initializing Nexus City Command...', 'success');
    try {
      localStorage.setItem('smartcity_registered', 'true');
      localStorage.setItem('smartcity_user_email', 'operator@nexuscity.gov');
      localStorage.setItem('smartcity_operator_name', 'Alex Morgan (Commander)');
      localStorage.setItem('smartcity_auth_token', 'TOKEN_DEMO_' + Date.now());
    } catch (err) {}
    setTimeout(() => {
      router.push('/');
    }, 600);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const effectiveEmail = loginEmail.trim() || 'operator@nexuscity.gov';
    const effectivePassword = loginPassword.trim() || 'nexuscity2026';

    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      if (soundFX) soundFX.playSuccess();

      // Save user session
      try {
        localStorage.setItem('smartcity_registered', 'true');
        localStorage.setItem('smartcity_user_email', effectiveEmail);
        localStorage.setItem('smartcity_operator_name', effectiveEmail.split('@')[0]);
        localStorage.setItem('smartcity_auth_token', 'TOKEN_OPERATOR_' + Date.now());
      } catch (err) {}

      showToast(`Welcome back, ${effectiveEmail.split('@')[0]}! Authorization granted.`, 'success');
      setTimeout(() => {
        router.push('/');
      }, 700);
    }, 750);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      if (soundFX) soundFX.playError();
      showToast('Please fill out all registration fields.', 'error');
      return;
    }

    if (signupPassword !== signupConfirm) {
      if (soundFX) soundFX.playError();
      showToast('Security ciphers do not match!', 'error');
      return;
    }

    setSignupLoading(true);
    setTimeout(() => {
      setSignupLoading(false);
      try {
        localStorage.setItem('smartcity_registered', 'true');
        localStorage.setItem('smartcity_user_email', signupEmail.trim());
        localStorage.setItem('smartcity_operator_name', signupName.trim());
        localStorage.setItem('smartcity_auth_token', 'TOKEN_OPERATOR_' + Date.now());
      } catch (err) {}

      if (soundFX) soundFX.playSuccess();
      showToast('Operator identity registered! Connecting to Central Command...', 'success');

      setTimeout(() => {
        router.push('/');
      }, 800);
    }, 850);
  };

  const handleGoogleSSO = () => {
    if (soundFX) soundFX.playClick();
    showToast('Connecting to Google SSO authentication gateway...', 'info');
    setTimeout(() => {
      try {
        localStorage.setItem('smartcity_registered', 'true');
        localStorage.setItem('smartcity_user_email', 'operator.google@smartcity.gov');
        localStorage.setItem('smartcity_operator_name', 'Google Operator');
        localStorage.setItem('smartcity_auth_token', 'TOKEN_SSO_GOOGLE_' + Date.now());
      } catch (err) {}
      if (soundFX) soundFX.playSuccess();
      showToast('Google SSO Verified. Access Granted.', 'success');
      setTimeout(() => router.push('/'), 700);
    }, 800);
  };

  return (
    <div className="login-page-root">
      <Head>
        <title>NEXUS CITY OS // Autonomous Command Gateway</title>
        <meta name="description" content="Central Nexus City Operator Authentication & Gateway" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Modern Smart City Background Layers */}
      <div className="city-bg-wrapper">
        <div className="grid-overlay" />
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        
        {/* Clean Smart City Skyline Graphic */}
        <div className="city-skyline">
          <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,320 L0,260 L45,260 L45,200 L95,200 L95,240 L160,240 L160,160 L210,160 L210,210 L270,210 L270,120 L330,120 L330,190 L390,190 L390,250 L460,250 L460,140 L530,140 L530,220 L600,220 L600,90 L670,90 L670,200 L740,200 L740,150 L810,150 L810,240 L880,240 L880,110 L950,110 L950,180 L1020,180 L1020,130 L1090,130 L1090,210 L1160,210 L1160,170 L1220,170 L1220,230 L1290,230 L1290,150 L1360,150 L1360,240 L1440,240 L1440,320 Z" fill="rgba(12, 18, 38, 0.9)" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.5" />
            <line x1="270" y1="120" x2="270" y2="70" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="2" />
            <circle cx="270" cy="68" r="3" fill="#ff3366" />
            <line x1="600" y1="90" x2="600" y2="40" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="2" />
            <circle cx="600" cy="38" r="3" fill="#00f0ff" />
            <line x1="880" y1="110" x2="880" y2="60" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="2" />
            <circle cx="880" cy="58" r="3" fill="#ff3366" />
            <line x1="1090" y1="130" x2="1090" y2="80" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="2" />
            <circle cx="1090" cy="78" r="3" fill="#00f0ff" />
          </svg>
        </div>
      </div>

      {/* Main UI Container */}
      <div className="app-container">

        {/* Top Navigation */}
        <header className="top-nav">
          <div className="brand-badge">
            <span className="pulse-dot" />
            <span>NEXUS CITY // COMMAND OS</span>
          </div>

          <div className="controls-group">
            {/* Theme Palette */}
            <div className="theme-picker" title="Select Theme Color">
              <button 
                type="button"
                className={`theme-btn cyan ${theme === 'cyan' ? 'active' : ''}`}
                onClick={() => handleThemeChange('cyan')}
                title="Quantum Cyan"
              />
              <button 
                type="button"
                className={`theme-btn purple ${theme === 'purple' ? 'active' : ''}`}
                onClick={() => handleThemeChange('purple')}
                title="Synthwave Purple"
              />
              <button 
                type="button"
                className={`theme-btn emerald ${theme === 'emerald' ? 'active' : ''}`}
                onClick={() => handleThemeChange('emerald')}
                title="Matrix Emerald"
              />
              <button 
                type="button"
                className={`theme-btn gold ${theme === 'gold' ? 'active' : ''}`}
                onClick={() => handleThemeChange('gold')}
                title="Solar Gold"
              />
            </div>

            {/* Sound Toggle */}
            <button 
              type="button"
              id="sound-toggle" 
              className={`icon-btn ${soundEnabled ? 'active' : ''}`}
              onClick={handleToggleSound}
              title="Toggle Web Audio Synthesizer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {soundEnabled ? (
                  <>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                ) : (
                  <>
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* Center Main Stage */}
        <main className="main-stage">
          <div className="card-container">
            <div className="normal-card">

              {/* View Switcher Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(6,10,22,0.7)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => { setAuthView('login'); if (soundFX) soundFX.playClick(); }}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    borderRadius: '10px',
                    border: authView === 'login' ? '1px solid var(--primary)' : '1px solid transparent',
                    background: authView === 'login' ? 'rgba(var(--primary-rgb), 0.18)' : 'transparent',
                    color: authView === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.04em'
                  }}
                >
                  🔑 Operator Login
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthView('signup'); if (soundFX) soundFX.playClick(); }}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    borderRadius: '10px',
                    border: authView === 'signup' ? '1px solid var(--primary)' : '1px solid transparent',
                    background: authView === 'signup' ? 'rgba(var(--primary-rgb), 0.18)' : 'transparent',
                    color: authView === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.04em'
                  }}
                >
                  📝 Register Identity
                </button>
              </div>

              {/* ================= SIGN IN VIEW ================= */}
              {authView === 'login' && (
                <div id="login-view" className="auth-view active">
                  <div className="card-header">
                    <h1 className="card-title">Operator Login</h1>
                    <p className="card-subtitle">Connect to the central Nexus City smart grid</p>
                  </div>

                  {/* 1-Click Quick Demo Login Button */}
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      marginBottom: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--primary)',
                      background: 'rgba(var(--primary-rgb), 0.12)',
                      color: 'var(--primary)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      boxShadow: '0 0 15px rgba(var(--primary-rgb), 0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>⚡</span>
                    <span>1-CLICK DEMO ACCESS (INITIALIZE COMMAND)</span>
                  </button>

                  <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
                    {/* Username / Email */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="login-email">OPERATOR IDENTITY</label>
                      <div className="input-wrapper">
                        <input
                          type="email"
                          id="login-email"
                          className="form-input"
                          placeholder="operator@smartcity.gov"
                          value={loginEmail}
                          onChange={(e) => {
                            setLoginEmail(e.target.value);
                            if (soundFX) soundFX.playKey();
                          }}
                          required
                          autoComplete="email"
                        />
                        <span className="field-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="login-password">SECURITY CIPHER</label>
                      <div className="input-wrapper">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          id="login-password"
                          className="form-input"
                          placeholder="••••••••••••"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (soundFX) soundFX.playKey();
                          }}
                          required
                          autoComplete="current-password"
                        />
                        <span className="field-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <button
                          type="button"
                          className="peek-toggle"
                          onClick={() => {
                            setShowLoginPassword(!showLoginPassword);
                            if (soundFX) soundFX.playClick();
                          }}
                          title="Toggle Cipher Visibility"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {showLoginPassword ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="form-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="custom-check" />
                        <span>Remember Session</span>
                      </label>
                      <button
                        type="button"
                        className="link-muted"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => {
                          if (soundFX) soundFX.playClick();
                          showToast('Cipher reset transmission dispatched to official terminal.', 'info');
                        }}
                      >
                        Forgot Cipher?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className={`btn-primary ${loginLoading ? 'loading' : ''}`} disabled={loginLoading}>
                      <span className="btn-text">INITIALIZE ACCESS</span>
                      <div className="btn-loader" />
                    </button>

                    {/* Social Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.6rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                      <span>OR CONTINUE WITH</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    {/* Google SSO */}
                    <button type="button" className="btn-google-single" onClick={handleGoogleSSO}>
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="#EA4335" d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.3l3.7 2.9C6.2 7.3 8.8 5 12 5z" />
                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                        <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 11.6 0 14s.6 4.7 1.6 6.7l3.7-2.9z" />
                        <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.2L1.6 16C3.5 19.7 7.4 23 12 23z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    {/* Switch to Register */}
                    <div className="auth-switch-prompt">
                      <span>New operator to the Smart City?</span>
                      <button
                        type="button"
                        className="auth-switch-link"
                        onClick={() => {
                          setAuthView('signup');
                          if (soundFX) soundFX.playClick();
                        }}
                      >
                        Register Identity →
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= SIGN UP VIEW ================= */}
              {authView === 'signup' && (
                <div id="signup-view" className="auth-view active">
                  <div className="card-header">
                    <h2 className="card-title">Register Identity</h2>
                    <p className="card-subtitle">Create operator credentials for smart city infrastructure</p>
                  </div>

                  <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
                    {/* Name */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-name">OPERATOR NAME</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          id="signup-name"
                          className="form-input"
                          placeholder="Alex Morgan"
                          value={signupName}
                          onChange={(e) => {
                            setSignupName(e.target.value);
                            if (soundFX) soundFX.playKey();
                          }}
                          required
                        />
                        <span className="field-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-email">OFFICIAL EMAIL</label>
                      <div className="input-wrapper">
                        <input
                          type="email"
                          id="signup-email"
                          className="form-input"
                          placeholder="alex@smartcity.gov"
                          value={signupEmail}
                          onChange={(e) => {
                            setSignupEmail(e.target.value);
                            if (soundFX) soundFX.playKey();
                          }}
                          required
                        />
                        <span className="field-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Password + Strength Meter */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-password">ACCESS CIPHER</label>
                      <div className="input-wrapper">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          id="signup-password"
                          className="form-input"
                          placeholder="Create strong cipher"
                          value={signupPassword}
                          onChange={(e) => {
                            setSignupPassword(e.target.value);
                            calculatePasswordStrength(e.target.value);
                            if (soundFX) soundFX.playKey();
                          }}
                          required
                        />
                        <span className="field-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <button
                          type="button"
                          className="peek-toggle"
                          onClick={() => {
                            setShowSignupPassword(!showSignupPassword);
                            if (soundFX) soundFX.playClick();
                          }}
                          title="Toggle Cipher Visibility"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {showSignupPassword ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      <div className="meter-wrapper">
                        <div className="meter-track">
                          <div 
                            className={`meter-bar ${
                              signupPassword.length === 0 ? '' :
                              passwordScore <= 1 ? 'weak' :
                              passwordScore === 2 ? 'fair' :
                              passwordScore === 3 ? 'good' : 'strong'
                            }`} 
                          />
                        </div>
                        <span className="meter-status">
                          {signupPassword.length === 0
                            ? 'Minimum 8 characters'
                            : passwordScore <= 1
                            ? 'Weak cipher'
                            : passwordScore === 2
                            ? 'Fair cipher'
                            : passwordScore === 3
                            ? 'Good cipher'
                            : 'Secure cipher (Strong)'}
                        </span>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-confirm">CONFIRM CIPHER</label>
                      <div className="input-wrapper">
                        <input
                          type="password"
                          id="signup-confirm"
                          className="form-input"
                          placeholder="Repeat cipher"
                          value={signupConfirm}
                          onChange={(e) => {
                            setSignupConfirm(e.target.value);
                            if (soundFX) soundFX.playKey();
                          }}
                          required
                        />
                        <span className="field-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className={`btn-primary ${signupLoading ? 'loading' : ''}`} disabled={signupLoading}>
                      <span className="btn-text">REGISTER OPERATOR</span>
                      <div className="btn-loader" />
                    </button>

                    {/* Switch to Login */}
                    <div className="auth-switch-prompt">
                      <span>Already registered in mainframe?</span>
                      <button
                        type="button"
                        className="auth-switch-link"
                        onClick={() => {
                          setAuthView('login');
                          if (soundFX) soundFX.playClick();
                        }}
                      >
                        Sign In here →
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </main>

        {/* Status Footer */}
        <footer className="status-bar">
          <div className="status-item">
            <span className="status-dot" />
            <span>NEXUS CITY SMART GRID // ONLINE</span>
          </div>
          <div className="status-item">
            <span>Infrastructure Telemetry: Normal</span>
          </div>
          <div className="status-item">
            <span>TLS 3.0 • QUANTUM ENCRYPTED</span>
          </div>
        </footer>

      </div>

      {/* Floating Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : toast.type === 'error' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

