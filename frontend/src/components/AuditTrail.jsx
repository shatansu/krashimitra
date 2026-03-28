import { useState } from "react";

const STEP_ICONS = {
  agent_start: "📥",
  llm_call: "🤖",
  tool_call: "🔧",
  tool_result: "📊",
  compliance_check: "🛡️",
  final_response: "✅",
  error: "❌",
};

const STATUS_STYLES = {
  success: {
    border: "var(--color-border-success)",
    bg: "var(--color-background-success)",
    text: "var(--color-text-success)",
  },
  warning: {
    border: "var(--color-border-warning)",
    bg: "var(--color-background-warning)",
    text: "var(--color-text-warning)",
  },
  error: {
    border: "var(--color-border-danger)",
    bg: "var(--color-background-danger)",
    text: "var(--color-text-danger)",
  },
};

function StepDetail({ data }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return null;

  return (
    <div className="step-detail">
      {entries.map(([key, value]) => (
        <div key={key} className="detail-row">
          <span className="detail-key">{key.replace(/_/g, " ")}</span>
          <span className="detail-value">
            {Array.isArray(value)
              ? value.map((v, i) => <div key={i} className="detail-list-item">{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>)
              : typeof value === "object"
              ? <pre className="detail-json">{JSON.stringify(value, null, 2)}</pre>
              : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditStep({ step, index, language }) {
  const [expanded, setExpanded] = useState(false);
  const stepName = step.step || "";

  let icon = "◆";
  for (const [key, ico] of Object.entries(STEP_ICONS)) {
    if (stepName.startsWith(key)) { icon = ico; break; }
  }

  const status = step.status || "success";
  const style = STATUS_STYLES[status] || STATUS_STYLES.success;

  const ts = step.timestamp
    ? new Date(step.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  const label = step.label || stepName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const hasDetails = step.details && Object.keys(step.details).length > 0;

  return (
    <div className="audit-step" style={{ borderLeftColor: style.border }}>
      <div
        className="audit-step-header"
        onClick={() => hasDetails && setExpanded(!expanded)}
        style={{ cursor: hasDetails ? "pointer" : "default" }}
      >
        <div className="step-left">
          <span className="step-index">{index + 1}</span>
          <span className="step-icon">{icon}</span>
          <div className="step-info">
            <span className="step-label">{label}</span>
            {ts && <span className="step-ts">{ts}</span>}
          </div>
        </div>
        <div className="step-right">
          <span
            className="step-status-badge"
            style={{ background: style.bg, color: style.text }}
          >
            {status}
          </span>
          {hasDetails && (
            <span className="expand-icon">{expanded ? "▲" : "▼"}</span>
          )}
        </div>
      </div>

      {expanded && step.details && (
        <StepDetail data={step.details} />
      )}
    </div>
  );
}

export default function AuditTrail({ trail, language }) {
  const [filter, setFilter] = useState("all");

  if (!trail || trail.length === 0) {
    return (
      <div className="audit-empty">
        {language === "hi" ? "कोई ऑडिट डेटा उपलब्ध नहीं" : "No audit data available"}
      </div>
    );
  }

  const filters = [
    { id: "all", label: language === "hi" ? "सभी" : "All" },
    { id: "tool", label: language === "hi" ? "डेटा स्रोत" : "Data sources" },
    { id: "compliance", label: language === "hi" ? "जांच" : "Compliance" },
    { id: "llm", label: language === "hi" ? "AI सोच" : "AI reasoning" },
  ];

  const filteredTrail = trail.filter((step) => {
    if (filter === "all") return true;
    return step.step?.startsWith(filter);
  });

  const toolCallCount = trail.filter((s) => s.step?.startsWith("tool_call")).length;
  const complianceStep = trail.find((s) => s.step === "compliance_check");
  const totalDuration = trail.length >= 2
    ? Math.abs(new Date(trail[trail.length - 1].timestamp) - new Date(trail[0].timestamp)) / 1000
    : null;

  return (
    <div className="audit-trail">
      {/* Summary stats */}
      <div className="audit-stats">
        <div className="audit-stat">
          <span className="stat-value">{trail.length}</span>
          <span className="stat-label">{language === "hi" ? "कदम" : "Steps"}</span>
        </div>
        <div className="audit-stat">
          <span className="stat-value">{toolCallCount}</span>
          <span className="stat-label">{language === "hi" ? "डेटा स्रोत" : "Data sources"}</span>
        </div>
        {complianceStep && (
          <div className="audit-stat">
            <span
              className="stat-value"
              style={{
                color: complianceStep.data?.status === "PASSED"
                  ? "var(--color-text-success)"
                  : "var(--color-text-danger)",
              }}
            >
              {complianceStep.data?.status || "—"}
            </span>
            <span className="stat-label">{language === "hi" ? "अनुपालन" : "Compliance"}</span>
          </div>
        )}
        {totalDuration !== null && (
          <div className="audit-stat">
            <span className="stat-value">{totalDuration.toFixed(1)}s</span>
            <span className="stat-label">{language === "hi" ? "समय" : "Duration"}</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="audit-filters">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`audit-filter-btn ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Compliance flags summary */}
      {complianceStep?.data?.flags?.length > 0 && (
        <div className="audit-compliance-summary">
          <strong>
            {language === "hi" ? "नियम जांच परिणाम:" : "Compliance check results:"}
          </strong>
          {complianceStep.data.flags.map((flag, i) => (
            <div key={i} className="audit-flag">{flag}</div>
          ))}
        </div>
      )}

      {/* Step list */}
      <div className="audit-steps-list">
        {filteredTrail.map((step, i) => (
          <AuditStep
            key={i}
            step={step}
            index={trail.indexOf(step)}
            language={language}
          />
        ))}
      </div>

      <p className="audit-footer-note">
        {language === "hi"
          ? "यह लेखा-जोखा नियामक जांच के लिए सुरक्षित रखा जाता है"
          : "This audit trail is retained for regulatory inspection purposes"}
      </p>
    </div>
  );
}