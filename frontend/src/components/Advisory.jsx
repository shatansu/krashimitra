import { useState } from "react";
import ComplianceBadge from "./ComplianceBadge";

export default function Advisory({ result, language }) {
  const [showHindi, setShowHindi] = useState(language === "hi");
  const [expandSchemes, setExpandSchemes] = useState(false);

  const {
    advisory,
    advisory_hindi,
    compliance_status,
    compliance_flags,
    safe_alternatives,
    data_sources,
    market_signal,
    scheme_eligibility,
    confidence_score,
    action_steps,
    session_id,
  } = result;

  const displayText = showHindi && advisory_hindi ? advisory_hindi : advisory;

  const confidenceColor = confidence_score > 0.75
    ? "var(--color-text-success)"
    : confidence_score > 0.5
    ? "var(--color-text-warning)"
    : "var(--color-text-danger)";

  return (
    <div className="advisory-card">
      {/* Header row */}
      <div className="advisory-header">
        <div className="advisory-title">
          <span className="advisory-icon">🌾</span>
          <h2>{language === "hi" ? "सलाह" : "Advisory"}</h2>
        </div>
        <div className="advisory-meta">
          <ComplianceBadge status={compliance_status} />
          <div className="confidence-badge" style={{ color: confidenceColor }}>
            {Math.round(confidence_score * 100)}% confident
          </div>
          {advisory_hindi && (
            <button
              className="lang-switch-btn"
              onClick={() => setShowHindi(!showHindi)}
            >
              {showHindi ? "EN" : "हि"}
            </button>
          )}
        </div>
      </div>

      {/* Compliance flags - ALWAYS shown first if blocked */}
      {compliance_status === "BLOCKED" && (
        <div className="compliance-block">
          <div className="compliance-block-header">
            <span>🚫</span>
            <strong>{language === "hi" ? "सलाह अवरुद्ध — नियम उल्लंघन" : "Advisory Blocked — Compliance Violation"}</strong>
          </div>
          {compliance_flags.map((flag, i) => (
            <div key={i} className="compliance-flag blocked">
              {flag}
            </div>
          ))}
          {safe_alternatives?.length > 0 && (
            <div className="alternatives-section">
              <strong>{language === "hi" ? "✅ सुरक्षित विकल्प:" : "✅ Safe alternatives:"}</strong>
              {safe_alternatives.map((alt, i) => (
                <div key={i} className="alternative-item">{alt}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {compliance_status === "WARNING" && compliance_flags.length > 0 && (
        <div className="compliance-warning">
          <span>⚠️</span>
          {compliance_flags.map((flag, i) => (
            <div key={i} className="compliance-flag warning">{flag}</div>
          ))}
        </div>
      )}

      {/* Main advisory text */}
      <div className="advisory-body">
        <p className={`advisory-text ${showHindi ? "hindi-text" : ""}`}>
          {displayText}
        </p>
      </div>

      {/* Action steps */}
      {action_steps && action_steps.length > 0 && (
        <div className="action-steps">
          <h3>{language === "hi" ? "क्या करें?" : "Action steps"}</h3>
          <ol className="steps-list">
            {action_steps.map((step, i) => (
              <li key={i} className="step-item">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Market signal */}
      {market_signal && (
        <div className={`market-signal signal-${market_signal.signal}`}>
          <div className="signal-header">
            <span className="signal-icon">
              {market_signal.signal === "sell_now" ? "📈" :
               market_signal.signal === "hold" ? "⏳" :
               market_signal.signal === "sell_partial" ? "📊" : "👁️"}
            </span>
            <strong className="signal-label">
              {market_signal.signal === "sell_now" && (language === "hi" ? "अभी बेचें" : "Sell Now")}
              {market_signal.signal === "hold" && (language === "hi" ? "रोक कर रखें" : "Hold")}
              {market_signal.signal === "sell_partial" && (language === "hi" ? "आधा बेचें" : "Sell Partial")}
              {market_signal.signal === "monitor" && (language === "hi" ? "नज़र रखें" : "Monitor")}
            </strong>
            <span className="signal-trend">
              {market_signal.trend === "rising" ? "↑" :
               market_signal.trend === "falling" ? "↓" : "→"}
              {market_signal.trend}
            </span>
          </div>
          <p className="signal-reason">{market_signal.reason}</p>
          {market_signal.below_msp && (
            <div className="msp-warning">
              ⚠️ {language === "hi" ? "MSP से कम — PM-KISAN Samridhi से सहायता लें" : "Below MSP — contact NABARD/PM-KISAN Samridhi"}
            </div>
          )}
        </div>
      )}

      {/* Government schemes */}
      {scheme_eligibility && scheme_eligibility.length > 0 && (
        <div className="schemes-section">
          <button
            className="schemes-toggle"
            onClick={() => setExpandSchemes(!expandSchemes)}
          >
            🏛️ {language === "hi"
              ? `${scheme_eligibility.length} सरकारी योजनाओं के लिए पात्र हैं`
              : `Eligible for ${scheme_eligibility.length} government schemes`
            }
            {expandSchemes ? " ▲" : " ▼"}
          </button>
          {expandSchemes && (
            <div className="schemes-list">
              {scheme_eligibility.map((scheme, i) => (
                <div key={i} className="scheme-item">
                  <strong>{scheme.scheme}</strong>
                  <p>{scheme.benefit}</p>
                  {scheme.helpline && (
                    <a href={`tel:${scheme.helpline}`} className="helpline-link">
                      📞 {scheme.helpline}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data sources */}
      {data_sources && data_sources.length > 0 && (
        <div className="data-sources">
          <span className="sources-label">
            {language === "hi" ? "डेटा स्रोत:" : "Sources:"}
          </span>
          {data_sources.map((src, i) => (
            <span key={i} className="source-chip">
              {src.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      <div className="session-id">
        Session: {session_id?.slice(0, 8)}
      </div>
    </div>
  );
}