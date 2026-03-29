import { t } from "../utils/i18n";

export default function ComplianceBadge({ status, language }) {
  const config = {
    PASSED: {
      label: t(language, "compliant"),
      bg: "var(--color-background-success)",
      color: "var(--color-text-success)",
      border: "var(--color-border-success)",
    },
    WARNING: {
      label: t(language, "warningShort"),
      bg: "var(--color-background-warning)",
      color: "var(--color-text-warning)",
      border: "var(--color-border-warning)",
    },
    BLOCKED: {
      label: t(language, "blockedShort"),
      bg: "var(--color-background-danger)",
      color: "var(--color-text-danger)",
      border: "var(--color-border-danger)",
    },
  };

  const active = config[status] || config.WARNING;

  return (
    <span
      className="compliance-badge"
      style={{
        background: active.bg,
        color: active.color,
        border: `1px solid ${active.border}`,
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {active.label}
    </span>
  );
}
