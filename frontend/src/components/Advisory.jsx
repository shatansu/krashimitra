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
      <div className="advisory-header">
        <div className="advisory-title">
          <span className="advisory-icon">Advice</span>
          <h2>{language === "hi" ? "Salah" : "Advisory"}</h2>
        </div>
        <div className="advisory-meta">
          <ComplianceBadge status={compliance_status} />
          <div className="confidence-badge" style={{ color: confidenceColor }}>
            {Math.round(confidence_score * 100)}% confident
          </div>
          {advisory_hindi && (
            <button className="lang-switch-btn" onClick={() => setShowHindi(!showHindi)}>
              {showHindi ? "EN" : "HI"}
            </button>
          )}
        </div>
      </div>

      {compliance_status === "BLOCKED" && (
        <div className="compliance-block">
          <div className="compliance-block-header">
            <strong>{language === "hi" ? "Salah blocked - compliance violation" : "Advisory blocked - Compliance Violation"}</strong>
          </div>
          {compliance_flags.map((flag, i) => (
            <div key={i} className="compliance-flag blocked">{flag}</div>
          ))}
          {safe_alternatives?.length > 0 && (
            <div className="alternatives-section">
              <strong>{language === "hi" ? "Safe alternatives:" : "Safe alternatives:"}</strong>
              {safe_alternatives.map((alt, i) => (
                <div key={i} className="alternative-item">{alt}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {compliance_status === "WARNING" && compliance_flags.length > 0 && (
        <div className="compliance-warning">
          {compliance_flags.map((flag, i) => (
            <div key={i} className="compliance-flag warning">{flag}</div>
          ))}
        </div>
      )}

      <div className="advisory-body">
        <p className={`advisory-text ${showHindi ? "hindi-text" : ""}`}>{displayText}</p>
      </div>

      {action_steps && action_steps.length > 0 && (
        <div className="action-steps">
          <h3>{language === "hi" ? "Kya karein?" : "Action steps"}</h3>
          <ol className="steps-list">
            {action_steps.map((step, i) => (
              <li key={i} className="step-item">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {market_signal && (
        <div className={`market-signal signal-${market_signal.signal}`}>
          <div className="signal-header">
            <strong className="signal-label">
              {market_signal.signal === "sell_now" && (language === "hi" ? "Abhi bechein" : "Sell Now")}
              {market_signal.signal === "hold" && (language === "hi" ? "Rok kar rakhein" : "Hold")}
              {market_signal.signal === "sell_partial" && (language === "hi" ? "Aadha bechein" : "Sell Partial")}
              {market_signal.signal === "monitor" && (language === "hi" ? "Nazar rakhein" : "Monitor")}
            </strong>
            <span className="signal-trend">{market_signal.trend}</span>
          </div>
          <p className="signal-reason">{market_signal.reason}</p>
          {market_signal.below_msp && (
            <div className="msp-warning">
              {language === "hi" ? "MSP se kam - support ke liye sambandhit yojana dekhein" : "Below MSP - check support schemes"}
            </div>
          )}
        </div>
      )}

      {scheme_eligibility && scheme_eligibility.length > 0 && (
        <div className="schemes-section">
          <button className="schemes-toggle" onClick={() => setExpandSchemes(!expandSchemes)}>
            {language === "hi"
              ? `${scheme_eligibility.length} sarkari yojanaon ke liye patra`
              : `Eligible for ${scheme_eligibility.length} government schemes`}
            {expandSchemes ? " Hide" : " Show"}
          </button>
          {expandSchemes && (
            <div className="schemes-list">
              {scheme_eligibility.map((scheme, i) => (
                <div key={i} className="scheme-item">
                  <strong>{scheme.scheme}</strong>
                  <p>{scheme.benefit}</p>
                  {scheme.helpline && <a href={`tel:${scheme.helpline}`} className="helpline-link">Helpline: {scheme.helpline}</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data_sources && data_sources.length > 0 && (
        <div className="data-sources">
          <span className="sources-label">{language === "hi" ? "Data sources:" : "Sources:"}</span>
          {data_sources.map((src, i) => (
            <span key={i} className="source-chip">{src.replace(/_/g, " ")}</span>
          ))}
        </div>
      )}

      <div className="session-id">Session: {session_id?.slice(0, 8)}</div>
    </div>
  );
}
