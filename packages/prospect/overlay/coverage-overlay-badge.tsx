import type { CoverageStats } from "./types.ts";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BeakerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M9 3v5.2a2 2 0 0 1-.65 1.47L6 12M15 3v5.2a2 2 0 0 0 .65 1.47L18 12" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {visible ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Badge stats panel (shown when active)
// ---------------------------------------------------------------------------

type BadgeStatsPanelProps = {
  stats: CoverageStats;
  showUncovered: boolean;
  onToggleUncovered: (e: React.MouseEvent) => void;
};

export function BadgeStatsPanel({ stats, showUncovered, onToggleUncovered }: BadgeStatsPanelProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderLeft: "1px solid rgba(255,255,255,0.3)",
        padding: "6px 10px 6px 10px",
        fontSize: "11px",
      }}
    >
      <span style={{ fontWeight: 700 }}>{stats.percentage}%</span>
      <span style={{ opacity: 0.8 }}>
        {stats.covered}/{stats.total}
      </span>
      <button
        onClick={onToggleUncovered}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          border: "none",
          borderRadius: "9999px",
          padding: "2px 8px",
          fontSize: "10px",
          cursor: "pointer",
          backgroundColor: showUncovered ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
          color: showUncovered ? "#fff" : "rgba(255,255,255,0.7)",
          transition: "background-color 0.1s ease",
        }}
        title={showUncovered ? "Hide uncovered elements" : "Show uncovered elements"}
      >
        <EyeIcon visible={showUncovered} />
        <span style={{ color: "#fca5a5" }}>{stats.uncovered}</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge label (always shown)
// ---------------------------------------------------------------------------

export function BadgeLabel() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px" }}>
      <BeakerIcon />
      <span>Prospect</span>
    </div>
  );
}
