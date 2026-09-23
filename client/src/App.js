import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./App.css";
import { auth, googleProvider } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000");

const GRADE_LEVELS = [
  { id: "1-5", label: "🎒 Elementary", sub: "Grades 1–5" },
  { id: "6-8", label: "🏫 Middle School", sub: "Grades 6–8" },
  { id: "9-12", label: "🎓 High School", sub: "Grades 9–12" },
  { id: "College", label: "🏛️ Higher Ed", sub: "College & Advanced" },
];

const LANGUAGES = [
  { code: "English", label: "🇺🇸 English", speechLang: "en-US" },
  { code: "Tamil", label: "🇮🇳 தமிழ் (Tamil)", speechLang: "ta-IN" },
  { code: "Spanish", label: "🇪🇸 Español (Spanish)", speechLang: "es-ES" },
  { code: "Hindi", label: "🇮🇳 हिन्दी (Hindi)", speechLang: "hi-IN" },
  { code: "French", label: "🇫🇷 Français (French)", speechLang: "fr-FR" },
  { code: "German", label: "🇩🇪 Deutsch (German)", speechLang: "de-DE" },
  { code: "Japanese", label: "🇯🇵 日本語 (Japanese)", speechLang: "ja-JP" },
];

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span>{t.icon || "ℹ️"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// FIREBASE AUTHENTICATION MODAL
// ============================================================================
function AuthModal({ isOpen, onClose, showToast }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please provide email and password");
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast("Signed in successfully!", "👋");
      onClose();
    } catch (err) {
      console.error("Firebase Login Error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password. Please check your credentials.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a moment.");
      } else {
        setError(err.message || "Failed to sign in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please provide email and password");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      showToast("Account registered successfully!", "🎉");
      onClose();
    } catch (err) {
      console.error("Firebase Register Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account already exists with this email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = googleProvider || new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Signed in with Google!", "🚀");
      onClose();
    } catch (err) {
      console.error("Firebase Google Auth Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        // User closed popup without signing in
        return;
      }
      if (err.code === "auth/operation-not-allowed") {
        setError(
          "Google Sign-In is not enabled yet in your Firebase Console. In Firebase Console, go to Authentication > Sign-in method, click Google, and enable it."
        );
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized in your Firebase Console. Please add this domain under Authentication > Settings > Authorized domains."
        );
      } else if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email using a different login method.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error encountered during Google Sign-In. Please check your internet connection.");
      } else {
        setError(err.message || "Google Sign-In was cancelled or failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your registered email address");
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg("Password reset email sent! Check your inbox.");
      showToast("Reset instructions sent to your email!", "📨");
    } catch (err) {
      console.error("Firebase Password Reset Error:", err);
      setError("Unable to send reset email. Verify that the address is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog auth-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)" }}>
            {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password"}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="auth-alert-box error">⚠️ {error}</div>}
        {successMsg && <div className="auth-alert-box success">✅ {successMsg}</div>}

        {mode !== "forgot" && (
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}
            >
              Register
            </button>
          </div>
        )}

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleEmailLogin}>
            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="auth-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                  style={{ background: "none", border: "none", color: "var(--brand-primary)", fontSize: 12, cursor: "pointer" }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px 16px" }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <form onSubmit={handleEmailRegister}>
            <div className="auth-form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Enter your full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group">
              <label>Password (min 6 characters)</label>
              <input
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px 16px" }} disabled={loading}>
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Forgot Password */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword}>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
              Enter your registered email and a password reset link will be sent to your inbox.
            </p>
            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px 16px" }} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
              >
                ← Back to Sign In
              </button>
            </p>
          </form>
        )}

        {mode !== "forgot" && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>

            <button type="button" className="google-auth-btn" onClick={handleGoogleSignIn} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SEARCH HISTORY MODAL
// ============================================================================
function HistoryModal({ isOpen, onClose, history, onSelectHistory, onDeleteHistory, onClearHistory }) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.term?.toLowerCase().includes(q) ||
      item.grade?.toLowerCase().includes(q) ||
      item.language?.toLowerCase().includes(q) ||
      item.result?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📚 Search History ({history.length})</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="history-search-bar">
          <input
            type="text"
            className="history-search-input"
            placeholder="Search past explanations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="history-items-list">
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--text-muted)" }}>
              {history.length === 0 ? "No search history yet. Explain any academic term to view it here." : "No matching terms found."}
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item._id || item.createdAt}
                className="history-card-item"
                onClick={() => { onSelectHistory(item); onClose(); }}
              >
                <div className="history-item-left">
                  <h5>{item.term}</h5>
                  <p>
                    Grade {item.grade} • {item.language} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </p>
                </div>
                <div className="history-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-item-delete"
                    title="Delete item"
                    onClick={() => onDeleteHistory(item._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer-bar">
          <button
            className="btn-ghost"
            style={{ color: "var(--color-error)", borderColor: "#fecaca", fontSize: 13 }}
            onClick={onClearHistory}
            disabled={history.length === 0}
          >
            Clear History
          </button>
          <button className="btn-primary" onClick={onClose} style={{ padding: "7px 18px", fontSize: 13 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GEMINI API KEY SETTINGS MODAL
// ============================================================================
function SettingsModal({ isOpen, onClose, apiKey, onSaveKey, showToast }) {
  const [inputKey, setInputKey] = useState(apiKey || "");

  useEffect(() => {
    setInputKey(apiKey || "");
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveKey(inputKey.trim());
    showToast(inputKey.trim() ? "Custom Gemini API key saved!" : "Using default server key", "🔑");
    onClose();
  };

  const handleClear = () => {
    setInputKey("");
    onSaveKey("");
    showToast("Cleared custom key. Using default server key.", "🧹");
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog auth-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
            ⚙️ Gemini API Settings
          </h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>
          The app uses the server's configured Google Gemini API key by default. If the shared model quota reaches its limit, you can supply your own free Gemini API key.
        </p>

        <form onSubmit={handleSave}>
          <div className="auth-form-group">
            <label>Custom Gemini API Key (Optional)</label>
            <input
              type="password"
              className="auth-input"
              placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--brand-primary)", fontSize: 12.5, textDecoration: "none", fontWeight: 600 }}
            >
              Get a free API key at Google AI Studio ↗
            </a>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              Save Key
            </button>
            {apiKey && (
              <button type="button" className="btn-ghost" onClick={handleClear} style={{ color: "var(--color-error)" }}>
                Reset
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// LANDING PAGE COMPONENT
// ============================================================================
function LandingPage({ onLaunchExplainer, onOpenAuth, currentUser, onOpenHistory, historyCount }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-pill-badge">
          <span className="pill-dot"></span>
          <span>Adaptive Academic Explanations</span>
        </div>

        <h1 className="hero-title">
          Understand Any Academic Concept <br />
          <span className="hero-gradient-text">At Your Exact Grade Level</span>
        </h1>

        <p className="hero-description">
          Convert complex scientific theories, formulas, and terminology into clear, structured explanations.
          Calibrated with grade-specific vocabulary, relatable everyday analogies, multi-language translation,
          speech synthesis, and downloadable PDF study sheets.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={onLaunchExplainer}>
            <span>Launch Explainer Workspace</span>
            <span className="btn-arrow">→</span>
          </button>
          {!currentUser ? (
            <button className="btn-hero-secondary" onClick={onOpenAuth}>
              Sign In / Register
            </button>
          ) : (
            <button className="btn-hero-secondary" onClick={onOpenHistory}>
              📚 View Search History {historyCount > 0 && `(${historyCount})`}
            </button>
          )}
        </div>

        {/* Live Structure Preview Card */}
        <div className="hero-preview-wrapper">
          <div className="hero-preview-card">
            <div className="preview-top-bar">
              <div className="preview-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="preview-title-chip">Structured Explainer Format</div>
              <div className="preview-grade-badge">Adaptive Calibration</div>
            </div>

            <div className="preview-body-grid">
              <div className="preview-pillar">
                <div className="pillar-header">
                  <span className="pillar-icon">📌</span>
                  <h4>Simple Definition</h4>
                </div>
                <p>Concise, crystal-clear explanation calibrated to the student's exact cognitive level.</p>
              </div>

              <div className="preview-pillar">
                <div className="pillar-header">
                  <span className="pillar-icon">💡</span>
                  <h4>Everyday Analogy</h4>
                </div>
                <p>Vivid, memorable comparisons to daily life that make abstract theories instantly tangible.</p>
              </div>

              <div className="preview-pillar">
                <div className="pillar-header">
                  <span className="pillar-icon">🚀</span>
                  <h4>Real-World Application</h4>
                </div>
                <p>Practical demonstrations and current scientific applications showing why the concept matters.</p>
              </div>

              <div className="preview-pillar">
                <div className="pillar-header">
                  <span className="pillar-icon">🎯</span>
                  <h4>Key Takeaways</h4>
                </div>
                <p>Crisp bullet points summarizing essential principles for fast recall and exam revision.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="landing-section" id="capabilities">
        <div className="section-header">
          <div className="section-label">Core Capabilities</div>
          <h2>Engineered for Deep Academic Comprehension</h2>
          <p>Every tool needed to dissect, comprehend, and retain complex subject matter.</p>
        </div>

        <div className="capabilities-grid">
          <div className="capability-card">
            <div className="capability-icon">🎒</div>
            <h3>Adaptive Grade Tailoring</h3>
            <p>
              Select from Elementary (Grades 1–5), Middle School (Grades 6–8), High School (Grades 9–12),
              or Higher Education / College. The system automatically adjusts sentence structure, depth, and terminology.
            </p>
          </div>

          <div className="capability-card">
            <div className="capability-icon">🌍</div>
            <h3>Multi-Language Learning</h3>
            <p>
              Learn in your native tongue. Full support for English, Tamil (தமிழ்), Spanish (Español),
              Hindi (हिन्दी), French (Français), German (Deutsch), and Japanese (日本語).
            </p>
          </div>

          <div className="capability-card">
            <div className="capability-icon">🔊</div>
            <h3>Native Audio Speech</h3>
            <p>
              Built-in multi-language speech synthesis reads explanations aloud at a natural pacing,
              strengthening auditory retention and pronunciation of technical vocabulary.
            </p>
          </div>

          <div className="capability-card">
            <div className="capability-icon">📄</div>
            <h3>PDF Study Sheets & Print</h3>
            <p>
              Export structured study notes directly to formatted PDF documents or clean print sheets
              ready for binder organization, classroom review, and exam prep.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-section workflow-section" id="how-it-works">
        <div className="section-header">
          <div className="section-label">How It Works</div>
          <h2>Three Steps to Complete Clarity</h2>
          <p>An intuitive workflow designed for students, researchers, and educators.</p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="workflow-step-badge">1</div>
            <h3>Enter Academic Term</h3>
            <p>Input any concept from biology, physics, chemistry, mathematics, history, or economics.</p>
          </div>

          <div className="workflow-card">
            <div className="workflow-step-badge">2</div>
            <h3>Select Level & Language</h3>
            <p>Choose your academic level from Elementary to College, and select your preferred language.</p>
          </div>

          <div className="workflow-card">
            <div className="workflow-step-badge">3</div>
            <h3>Learn, Listen & Save</h3>
            <p>Receive your tailored breakdown, listen to audio narration, copy text, or export a PDF study sheet.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <h2>Ready to Master Any Academic Subject?</h2>
          <p>Open the explainer workspace now and explore any concept with precision clarity.</p>
          <button className="btn-hero-primary" onClick={onLaunchExplainer} style={{ margin: "0 auto" }}>
            <span>Launch Explainer Workspace</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-icon">🎓</span>
            <span className="brand-text">Academic Explainer</span>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Academic Terms Explainer. Built for students, educators, and lifelong learners.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  const [activeView, setActiveView] = useState("landing"); // "landing" | "explainer"
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("gemini_user_api_key") || "";
    } catch {
      return "";
    }
  });

  // Form State
  const [term, setTerm] = useState("");
  const [grade, setGrade] = useState("6-8");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Audio Speech State
  const [speaking, setSpeaking] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, icon = "ℹ️") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchHistory(user.uid);
      } else {
        setCurrentUser(null);
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const fetchHistory = async (uid) => {
    if (!uid) return;
    try {
      const res = await axios.get(`${API_BASE}/history/${uid}`);
      setHistory(res.data.history || []);
    } catch (err) {
      console.warn("Could not fetch history:", err.message);
    }
  };

  const handleExplain = async (overrideTerm = null, overrideGrade = null) => {
    const targetTerm = (overrideTerm !== null ? overrideTerm : term).trim();
    const targetGrade = overrideGrade !== null ? overrideGrade : grade;

    if (!targetTerm) {
      showToast("Please enter an academic term to explain", "⚠️");
      return;
    }

    setLoading(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);

    const effectiveUid = currentUser?.uid || "guest_user";

    try {
      const res = await axios.post(`${API_BASE}/explain`, {
        term: targetTerm,
        grade: targetGrade,
        language,
        userId: effectiveUid,
        apiKey: apiKey.trim() || undefined,
      });

      const explanation = res.data.result || "";
      setResult(explanation);
      showToast(`Concept explained for Grade ${targetGrade}!`, "✨");

      if (currentUser?.uid) {
        fetchHistory(currentUser.uid);
      } else {
        const guestItem = {
          _id: "hist_" + Math.random().toString(36).substring(2, 9),
          term: targetTerm,
          grade: targetGrade,
          language,
          result: explanation,
          createdAt: new Date().toISOString(),
        };
        setHistory((prev) => [guestItem, ...prev]);
      }
    } catch (err) {
      const errDetail = err.response?.data?.error || err.message;
      if (err.response?.status === 429 || (errDetail && errDetail.includes("429"))) {
        showToast("Gemini model limit reached. You can add a personal key in ⚙️ API Key.", "⚠️");
      } else {
        showToast(errDetail || "Failed to generate explanation. Please try again.", "❌");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeech = () => {
    if (!result || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const cleanText = result
      .replace(/[#*`_~]/g, "")
      .replace(/📌|💡|🚀|🎯/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const currentLang = LANGUAGES.find((l) => l.code === language);
    utterance.lang = currentLang?.speechLang || "en-US";
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopyExplanation = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`Academic Term: ${term}\nGrade Level: ${grade}\nLanguage: ${language}\n\n${result}`);
      showToast("Explanation copied to clipboard!", "📋");
    } catch {
      showToast("Failed to copy text", "⚠️");
    }
  };

  const handleExportPDF = () => {
    if (!result) return;
    try {
      const doc = new jsPDF();

      doc.setFillColor(67, 56, 202);
      doc.rect(0, 0, 210, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.text("Academic Terms Explainer - Study Sheet", 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Concept: ${term.toUpperCase()}`, 14, 44);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Grade Level: ${grade}  |  Language: ${language}  |  Date: ${new Date().toLocaleDateString()}`, 14, 52);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 58, 196, 58);

      const cleanContent = result.replace(/[*#`_~]/g, "");
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const splitLines = doc.splitTextToSize(cleanContent, 180);
      doc.text(splitLines, 14, 68);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text("Academic Terms Explainer - Study Notes", 14, 285);

      doc.save(`${term.replace(/\s+/g, "_")}_Study_Note.pdf`);
      showToast("Study Note PDF downloaded!", "📄");
    } catch (err) {
      console.error("PDF generation failed:", err);
      showToast("Could not generate PDF", "⚠️");
    }
  };

  const handleSelectHistory = (item) => {
    setTerm(item.term);
    setGrade(item.grade);
    setLanguage(item.language);
    setResult(item.result);
    setActiveView("explainer");
    showToast(`Loaded "${item.term}" from history`, "📖");
  };

  const handleDeleteHistory = async (id) => {
    try {
      await axios.delete(`${API_BASE}/history/${id}`);
    } catch {
      // Ignored
    }
    setHistory((prev) => prev.filter((h) => h._id !== id));
    showToast("History item deleted", "🗑️");
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire search history?")) return;
    if (currentUser?.uid) {
      try {
        await axios.delete(`${API_BASE}/history/clear/${currentUser.uid}`);
      } catch {
        // Ignored
      }
    }
    setHistory([]);
    showToast("Search history cleared", "🧹");
  };

  const handleNewSearch = () => {
    setTerm("");
    setResult("");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      handleNewSearch();
      showToast("Signed out successfully", "👋");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem("gemini_user_api_key", newKey);
      } else {
        localStorage.removeItem("gemini_user_api_key");
      }
    } catch {
      // Ignored
    }
  };

  const userDisplayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || null;

  return (
    <div className="app-root">
      <ToastContainer toasts={toasts} />

      {/* Global Navigation Header */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-link" onClick={() => setActiveView("landing")}>
            <div className="brand-icon-box">🎓</div>
            <div className="brand-name">Academic Explainer</div>
          </div>

          <nav className="header-nav-tabs">
            <button
              className={`nav-tab-btn ${activeView === "landing" ? "active" : ""}`}
              onClick={() => setActiveView("landing")}
            >
              Home
            </button>
            <button
              className={`nav-tab-btn ${activeView === "explainer" ? "active" : ""}`}
              onClick={() => setActiveView("explainer")}
            >
              Explainer Workspace
            </button>
          </nav>

          <div className="header-actions">
            <button
              className="btn-ghost"
              onClick={() => setSettingsModalOpen(true)}
              title="Gemini API Key Settings"
            >
              ⚙️ API Key {apiKey && "•"}
            </button>
            {currentUser ? (
              <>
                <button className="btn-ghost" onClick={() => setHistoryModalOpen(true)}>
                  📚 History {history.length > 0 && `(${history.length})`}
                </button>
                {activeView === "explainer" && (
                  <button className="btn-ghost" onClick={handleNewSearch} title="Start fresh search">
                    ➕ New Term
                  </button>
                )}
                <div className="user-chip">
                  <div className="user-avatar">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" />
                    ) : (
                      userDisplayName ? userDisplayName[0].toUpperCase() : "U"
                    )}
                  </div>
                  <span className="user-name-text">{userDisplayName}</span>
                  <button className="btn-icon-logout" onClick={handleLogout} title="Sign Out">
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => setHistoryModalOpen(true)}>
                  📚 History {history.length > 0 && `(${history.length})`}
                </button>
                <button className="btn-primary" onClick={() => setAuthModalOpen(true)}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Conditional View: Landing Page vs Explainer Workspace */}
      {activeView === "landing" ? (
        <LandingPage
          onLaunchExplainer={() => setActiveView("explainer")}
          onOpenAuth={() => setAuthModalOpen(true)}
          currentUser={currentUser}
          onOpenHistory={() => setHistoryModalOpen(true)}
          historyCount={history.length}
        />
      ) : (
        <main className="workspace-container">
          <div className="workspace-breadcrumb">
            <button className="breadcrumb-back-btn" onClick={() => setActiveView("landing")}>
              ← Back to Home
            </button>
          </div>

          <div className="explainer-card">
            <div className="card-header-area">
              <h2>✨ Explain Academic Concept</h2>
              <p>Enter any academic term, formula, or principle to generate a structured, grade-tailored explanation.</p>
            </div>

            {/* Search Input */}
            <div className="term-input-wrapper">
              <span className="term-search-icon">🔍</span>
              <input
                type="text"
                className="term-input"
                placeholder="Enter an academic term, scientific principle, or formula..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExplain()}
                autoFocus
              />
              {term && (
                <button className="clear-term-btn" onClick={() => setTerm("")} title="Clear">
                  ✕
                </button>
              )}
            </div>

            {/* Configuration Options */}
            <div className="config-grid">
              <div className="config-field">
                <label>Academic Level</label>
                <div className="grade-selector-cards">
                  {GRADE_LEVELS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`grade-chip-option ${grade === g.id ? "active" : ""}`}
                      onClick={() => setGrade(g.id)}
                    >
                      <div>{g.label}</div>
                      <small style={{ fontSize: 10, opacity: 0.75 }}>{g.sub}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-field">
                <label>Explanation Language</label>
                <select
                  className="clean-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 5, display: "block" }}>
                  Audio playback will speak naturally in the selected language.
                </small>
              </div>
            </div>

            <button
              className="btn-primary explain-submit-btn"
              onClick={() => handleExplain()}
              disabled={loading}
            >
              {loading ? "🔄 Explaining Concept..." : "🚀 Explain Concept"}
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <div className="result-card">
              <div className="result-header-bar">
                <div className="result-title-group">
                  <h3>📖 {term}</h3>
                  <div className="result-meta-chips">
                    <span className="meta-badge highlight">Grade {grade}</span>
                    <span className="meta-badge">{language}</span>
                  </div>
                </div>

                <div className="result-actions-toolbar">
                  <button
                    className={`toolbar-btn ${speaking ? "active" : ""}`}
                    onClick={toggleSpeech}
                    title={speaking ? "Stop audio" : "Listen to explanation"}
                  >
                    {speaking ? "⏹️ Stop Audio" : "🔊 Listen"}
                  </button>
                  <button className="toolbar-btn" onClick={handleCopyExplanation} title="Copy explanation">
                    📋 Copy
                  </button>
                  <button className="toolbar-btn" onClick={handleExportPDF} title="Download as PDF">
                    📄 Export PDF
                  </button>
                  <button className="toolbar-btn" onClick={() => window.print()} title="Print study notes">
                    🖨️ Print
                  </button>
                </div>
              </div>

              <div className="result-content-body">
                {result}
              </div>

              <div className="quick-modifiers-row">
                <span className="modifier-label">Quick Adjust:</span>
                <button
                  className="modifier-btn"
                  onClick={() => {
                    setGrade("1-5");
                    handleExplain(term, "1-5");
                  }}
                >
                  Explain Simpler (Elementary)
                </button>
                <button
                  className="modifier-btn"
                  onClick={() => {
                    setGrade("College");
                    handleExplain(term, "College");
                  }}
                >
                  Advanced College Level
                </button>
                <button
                  className="modifier-btn"
                  onClick={() => {
                    const nextLang = language === "English" ? "Tamil" : "English";
                    setLanguage(nextLang);
                    handleExplain(term, grade);
                  }}
                >
                  Switch Language ({language === "English" ? "Tamil" : "English"})
                </button>
              </div>
            </div>
          )}

          <footer className="landing-footer-simple" style={{ marginTop: 48 }}>
            <p>© {new Date().getFullYear()} Academic Terms Explainer. Built for students, educators, and lifelong learners.</p>
          </footer>
        </main>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        showToast={showToast}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearHistory={handleClearHistory}
      />

      {/* API Key Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
        showToast={showToast}
      />
    </div>
  );
}
