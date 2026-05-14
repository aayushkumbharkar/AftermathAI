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

function CopyIcon() {
  return (
    <svg className="btn-copy__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="btn-copy__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function App() {
  const [decision, setDecision] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    if (!sections.length) return;
    
    let text = `# Aftermath AI Analysis\n\n**Decision:** ${decision}\n\n`;
    sections.forEach(sec => {
      text += `## ${sec.title}\n`;
      sec.content.forEach(block => {
        if (block.type === 'paragraph') {
          text += `${block.content}\n\n`;
        } else if (block.type === 'list') {
          block.items.forEach(item => {
            text += `- ${item}\n`;
          });
          text += `\n`;
        }
      });
    });

    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <button className="btn-copy" onClick={handleCopy} aria-label="Copy to clipboard">
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied!" : "Copy"}
            </button>
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
