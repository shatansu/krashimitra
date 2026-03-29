import { useState } from "react";
import { t } from "../utils/i18n";

const STEP_ICONS = {
  agent_start: "Start",
  llm_call: "AI",
  tool_call: "Tool",
  tool_result: "Data",
  compliance_check: "Check",
  final_response: "Done",
  error: "Error",
};

const STATUS_STYLES = {
  success: { border: "var(--color-border-success)", bg: "var(--color-background-success)", text: "var(--color-text-success)" },
  warning: { border: "var(--color-border-warning)", bg: "var(--color-background-warning)", text: "var(--color-text-warning)" },
  error: { border: "var(--color-border-danger)", bg: "var(--color-background-danger)", text: "var(--color-text-danger)" },
};

function StepDetail({ data }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data).filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (!entries.length) return null;

  return (
    <div className="step-detail">
      {entries.map(([key, value]) => (
        <div key={key} className="detail-row">
          <span className="detail-key">{key.replace(/_/g, " ")}</span>
          <span className="detail-value">
            {Array.isArray(value)
              ? value.map((item, index) => <div key={index} className="detail-list-item">{typeof item === "object" ? JSON.stringify(item) : String(item)}</div>)
              : typeof value === "object"
                ? <pre className="detail-json">{JSON.stringify(value, null, 2)}</pre>
                : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditStep({ step, index }) {
  const [expanded, setExpanded] = useState(false);
  const stepName = step.step || "";
  const icon = Object.entries(STEP_ICONS).find(([key]) => stepName.startsWith(key))?.[1] || "Step";
  const status = step.status || "success";
  const style = STATUS_STYLES[status] || STATUS_STYLES.success;
  const ts = step.timestamp ? new Date(step.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
  const label = step.label || stepName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const hasDetails = step.details && Object.keys(step.details).length > 0;

  return (
    <div className="audit-step" style={{ borderLeftColor: style.border }}>
      <div className="audit-step-header" onClick={() => hasDetails && setExpanded(!expanded)} style={{ cursor: hasDetails ? "pointer" : "default" }}>
        <div className="step-left">
          <span className="step-index">{index + 1}</span>
          <span className="step-icon">{icon}</span>
          <div className="step-info">
            <span className="step-label">{label}</span>
            {ts && <span className="step-ts">{ts}</span>}
          </div>
        </div>
        <div className="step-right">
          <span className="step-status-badge" style={{ background: style.bg, color: style.text }}>{status}</span>
          {hasDetails && <span className="expand-icon">{expanded ? t("en", "hide") : t("en", "show")}</span>}
        </div>
      </div>
      {expanded && step.details && <StepDetail data={step.details} />}
    </div>
  );
}

export default function AuditTrail({ trail, language }) {
  const [filter, setFilter] = useState("all");

  if (!trail || trail.length === 0) {
    return <div className="audit-empty">{t(language, "noAudit")}</div>;
  }

  const filters = [
    { id: "all", label: t(language, "all") },
    { id: "tool", label: t(language, "dataSources") },
    { id: "compliance", label: t(language, "compliance") },
    { id: "llm", label: t(language, "aiReasoning") },
  ];

  const filteredTrail = trail.filter((step) => filter === "all" || step.step?.startsWith(filter));

  return (
    <div className="audit-trail">
      <div className="audit-filters">
        {filters.map((item) => (
          <button key={item.id} className={`audit-filter-btn ${filter === item.id ? "active" : ""}`} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="audit-steps-list">
        {filteredTrail.map((step, index) => (
          <AuditStep key={index} step={step} index={trail.indexOf(step)} />
        ))}
      </div>

      <p className="audit-footer-note">{t(language, "retainedNote")}</p>
    </div>
  );
}
