import type React from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DRAG_THRESHOLD = 4;
export const STORAGE_KEY = "prospect-overlay-position";
export const RESCAN_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Badge styles
// ---------------------------------------------------------------------------

const badgeBaseStyle: React.CSSProperties = {
  position: "fixed",
  zIndex: 999_999,
  pointerEvents: "auto",
  touchAction: "none",
  userSelect: "none",
  display: "flex",
  alignItems: "center",
  gap: 6,
  borderRadius: "9999px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  cursor: "grab",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  transition: "background-color 0.15s ease, border-color 0.15s ease",
};

export const badgeInactiveStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  backgroundColor: "#1a1a2e",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#999",
};

export const badgeActiveStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  backgroundColor: "#059669",
  border: "1px solid #10b981",
  color: "#fff",
};
