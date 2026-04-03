import type { TooltipData } from "./types.ts";

type TestTooltipProps = {
  data: TooltipData;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const tooltipStyle: React.CSSProperties = {
  position: "fixed",
  zIndex: 999_999,
  maxWidth: 360,
  backgroundColor: "#1a1a2e",
  color: "#e0e0e0",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  lineHeight: "1.5",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.1)",
  pointerEvents: "auto" as const,
};

const testIdStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "11px",
  color: "#a78bfa",
  marginBottom: 6,
};

const interactionStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  paddingTop: 6,
  marginTop: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#888",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const coveredStyle: React.CSSProperties = {
  color: "#10b981",
  fontFamily: "monospace",
  fontSize: "11px",
};

const uncoveredStyle: React.CSSProperties = {
  color: "#ef4444",
  fontFamily: "monospace",
  fontSize: "11px",
};

export function TestTooltip({ data, onMouseEnter, onMouseLeave }: TestTooltipProps) {
  const coveredCount = data.interactions.filter((i) => i.test !== null).length;
  const totalCount = data.interactions.length;

  const top = Math.min(data.position.y + 16, window.innerHeight - 200);
  const left = Math.min(data.position.x + 16, window.innerWidth - 380);

  return (
    <div
      data-prospect-overlay="true"
      style={{ ...tooltipStyle, top, left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={testIdStyle}>{data.testId}</div>
      <div style={labelStyle}>
        {coveredCount}/{totalCount} scenario{totalCount !== 1 ? "s" : ""} covered
      </div>
      {data.interactions.slice(0, 5).map((interaction, i) => (
        <div key={i} style={i === 0 ? { marginTop: 6 } : interactionStyle}>
          {interaction.context && <div style={{ color: "#ccc" }}>{interaction.context}</div>}
          {interaction.condition && (
            <div style={{ color: "#888", fontSize: "11px" }}>when: {interaction.condition}</div>
          )}
          {interaction.expected && <div style={{ color: "#ddd", fontSize: "11px" }}>{interaction.expected}</div>}
          <div style={interaction.test ? coveredStyle : uncoveredStyle}>{interaction.test ?? "no test"}</div>
        </div>
      ))}
      {data.interactions.length > 5 && (
        <div style={{ ...labelStyle, marginTop: 6 }}>+{data.interactions.length - 5} more</div>
      )}
    </div>
  );
}
