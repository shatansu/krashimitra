export default function ComplianceBadge({ status }) {
  const config = {
    PASSED: {
      label: "Compliant",
      bg: "var(--color-background-success)",
      color: "var(--color-text-success)",
      border: "var(--color-border-success)",
    },
    WARNING: {
      label: "Warning",
      bg: "var(--color-background-warning)",
      color: "var(--color-text-warning)",
      border: "var(--color-border-warning)",
    },
    BLOCKED: {
      label: "Blocked",
      bg: "var(--color-background-danger)",
      color: "var(--color-text-danger)",
      border: "var(--color-border-danger)",
    },
  };

  const c = config[status] || config.WARNING;

  return (
    <span
      className="compliance-badge"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}
