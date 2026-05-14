import { useState, useRef } from "react";
import SectionCard from "./components/SectionCard";
import LoadingState from "./components/LoadingState";
import { parseAnalysis } from "./utils/parseAnalysis";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function ArrowIcon() {
  return (
    <svg
      className="btn-analyze__icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="8" x2="13" y2="8" />
      <polyline points="9,4 13,8 9,12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="error-banner__icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="7" />
      <line x1="8" y1="5" x2="8" y2="9" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export default function App() {
  const [decision, setDecision] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const resultsRef = useRef(null);

  const handleAnalyze = async () => {
    if (!decision.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSections([]);
    setMeta(null);

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: decision.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const parsed = parseAnalysis(data.analysis);
      setSections(parsed);
      setMeta({
        provider: data.provider,
        latencyMs: data.latencyMs,
        fallbackUsed: data.fallbackUsed,
      });

      // Smooth scroll to results after render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  const charCount = decision.length;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__badge">
          <span className="header__badge-dot" />
          Decision Analysis Engine
        </div>
        <h1 className="header__title">Aftermath AI</h1>
        <p className="header__subtitle">
          See what happens after your decision. No comfort, no filler — just
          consequences.
        </p>
      </header>

      {/* Input */}
      <section className="input-section">
        <div className="input-card">
          <label className="input-label" htmlFor="decision-input">
            Your Decision
          </label>
          <textarea
            id="decision-input"
            className="input-textarea"
            placeholder="Describe a decision you're about to make..."
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={5}
          />
          <div className="input-footer">
            <span className="input-hint">
              {charCount > 0 ? `${charCount} chars` : "Ctrl+Enter to submit"}
            </span>
            <button
              id="analyze-btn"
              className="btn-analyze"
              onClick={handleAnalyze}
              disabled={loading || !decision.trim()}
            >
              {loading ? "Analyzing..." : "Analyze Consequences"}
              {!loading && <ArrowIcon />}
            </button>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="error-banner" role="alert">
          <ErrorIcon />
          <span className="error-banner__text">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingState />}

      {/* Results */}
      {sections.length > 0 && !loading && (
        <section className="results" ref={resultsRef}>
          <div className="results__header">
            <div className="results__header-line" />
            <span className="results__header-title">Analysis Complete</span>
            {meta && (
              <div className="results__meta">
                <span className={`results__provider ${meta.fallbackUsed ? 'results__provider--fallback' : ''}`}>
                  {meta.provider}
                </span>
                <span className="results__latency">{meta.latencyMs}ms</span>
                {meta.fallbackUsed && (
                  <span className="results__fallback-badge">fallback</span>
                )}
              </div>
            )}
          </div>
          {sections.map((section) => (
            <SectionCard key={section.key} section={section} />
          ))}
          <footer className="footer">
            <p className="footer__text">
              aftermath.ai — decisions have consequences
            </p>
          </footer>
        </section>
      )}
    </div>
  );
}
