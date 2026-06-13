import Icon from "./Icon";

// Friendly empty state — a stroke icon in a glass circle, a headline, a hint,
// and an optional call-to-action button. Used wherever a list/tab has no data yet.
export default function EmptyState({ icon = "inbox", title, hint, action, onAction, color = "#E8720C" }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        padding: "2.5rem 1.5rem",
        textAlign: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          margin: "0 auto 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: color + "14",
          border: "1px solid " + color + "33",
          boxShadow: "0 0 30px " + color + "1f",
        }}
      >
        <Icon name={icon} size={28} color={color} />
      </div>
      {title && <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.01em" }}>{title}</div>}
      {hint && <div style={{ fontSize: 12.5, color: "#888", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>{hint}</div>}
      {action && (
        <button
          onClick={onAction}
          style={{
            marginTop: 18,
            padding: "11px 22px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg," + color + ",#C0392B)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "Georgia,serif",
            letterSpacing: "0.04em",
            boxShadow: "0 6px 24px " + color + "44",
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
