import ComplianceBadge from "./ComplianceBadge";
import { t } from "../utils/i18n";

export default function Advisory({ result, language }) {
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

  const displayText = language === "en" ? advisory : advisory || advisory_hindi || result.advisory;
  const confidenceColor = confidence_score > 0.75
    ? "var(--color-text-success)"
    : confidence_score > 0.5
      ? "var(--color-text-warning)"
      : "var(--color-text-danger)";

  const signalLabels = {
    sell_now: t(language, "sellNow"),
    hold: t(language, "hold"),
    sell_partial: t(language, "sellPartial"),
    monitor: t(language, "monitor"),
  };

  return (
    <div className="advisory-card">
      <div className="advisory-header">
        <div className="advisory-title">
          <span className="advisory-icon">{t(language, "advice")}</span>
          <h2>{t(language, "advisory")}</h2>
        </div>
        <div className="advisory-meta">
          <ComplianceBadge status={compliance_status} language={language} />
          <div className="confidence-badge" style={{ color: confidenceColor }}>
            {`${Math.round(confidence_score * 100)}% ${t(language, "confidence")}`}
          </div>
        </div>
      </div>

      {compliance_status === "BLOCKED" && (
        <div className="compliance-block">
          <div className="compliance-block-header">
            <strong>{t(language, "blocked")}</strong>
          </div>
          {compliance_flags.map((flag, index) => (
            <div key={index} className="compliance-flag blocked">{flag}</div>
          ))}
          {safe_alternatives?.length > 0 && (
            <div className="alternatives-section">
              <strong>{t(language, "safeAlternatives")}</strong>
              {safe_alternatives.map((item, index) => (
                <div key={index} className="alternative-item">{item}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {compliance_status === "WARNING" && compliance_flags.length > 0 && (
        <div className="compliance-warning">
          {compliance_flags.map((flag, index) => (
            <div key={index} className="compliance-flag warning">{flag}</div>
          ))}
        </div>
      )}

      <div className="advisory-body">
        <p className="advisory-text">{displayText}</p>
      </div>

      {action_steps?.length > 0 && (
        <div className="action-steps">
          <h3>{t(language, "actionSteps")}</h3>
          <ol className="steps-list">
            {action_steps.map((step, index) => (
              <li key={index} className="step-item">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {market_signal && (
        <div className={`market-signal signal-${market_signal.signal}`}>
          <div className="signal-header">
            <strong className="signal-label">{signalLabels[market_signal.signal] || market_signal.signal}</strong>
            <span className="signal-trend">{market_signal.trend}</span>
          </div>
          <p className="signal-reason">{market_signal.reason}</p>
          {market_signal.below_msp && <div className="msp-warning">{t(language, "belowMsp")}</div>}
        </div>
      )}

      {scheme_eligibility?.length > 0 && (
        <div className="schemes-section">
          <div className="schemes-toggle">{`${scheme_eligibility.length} ${t(language, "eligibleSchemes")}`}</div>
          <div className="schemes-list">
            {scheme_eligibility.map((scheme, index) => (
              <div key={index} className="scheme-item">
                <strong>{scheme.scheme}</strong>
                <p>{scheme.benefit}</p>
                {scheme.helpline && <a href={`tel:${scheme.helpline}`} className="helpline-link">Helpline: {scheme.helpline}</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data_sources?.length > 0 && (
        <div className="data-sources">
          <span className="sources-label">{t(language, "sources")}</span>
          {data_sources.map((src, index) => (
            <span key={index} className="source-chip">{src.replace(/_/g, " ")}</span>
          ))}
        </div>
      )}

      <div className="session-id">{`${t(language, "session")}: ${session_id?.slice(0, 8)}`}</div>
    </div>
  );
}
