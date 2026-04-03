import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BadgeLabel, BadgeStatsPanel } from "./coverage-overlay-badge.tsx";
import {
  badgeActiveStyle,
  badgeInactiveStyle,
  DRAG_THRESHOLD,
  RESCAN_DEBOUNCE_MS,
  STORAGE_KEY,
} from "./coverage-overlay-styles.ts";
import type { CoverageEntry } from "./coverage-overlay-utils.ts";
import { buildCoverageMap, computeRouteStats, scanDOM } from "./coverage-overlay-utils.ts";
import { ElementHighlighter } from "./element-highlighter.tsx";
import { TestTooltip } from "./test-tooltip.tsx";
import type { HighlightRect, Interaction, Route, TooltipData } from "./types.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoverageOverlayProps = {
  /** Routes from defineE2ECoverage — the coverage map */
  coverage: Record<string, Route>;
  /** Current route path. Falls back to window.location.pathname */
  currentRoute?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoverageOverlay({ coverage, currentRoute }: CoverageOverlayProps) {
  const [isActive, setIsActive] = useState(false);
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [showUncovered, setShowUncovered] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [badgePosition, setBadgePosition] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const pos = JSON.parse(saved) as { x: number; y: number };
        if (typeof pos.x === "number" && typeof pos.y === "number") {
          return pos;
        }
      }
    } catch {
      /* empty */
    }
    return { x: 16, y: 16 };
  });

  const coverageMapRef = useRef<Map<string, CoverageEntry[]>>(new Map());
  const interactionMapRef = useRef<Map<string, Interaction[]>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const rescanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    didDrag: boolean;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const pathname = currentRoute ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const stats = computeRouteStats(coverage, pathname);

  const runScan = useCallback(() => {
    const { highlights: newHighlights, interactionMap } = scanDOM(coverageMapRef.current);
    setHighlights(newHighlights);
    interactionMapRef.current = interactionMap;
  }, []);

  const toggle = useCallback(() => {
    setIsActive((prev) => {
      if (prev) {
        setHighlights([]);
        setTooltipData(null);
        setShowUncovered(false);
        return false;
      }
      coverageMapRef.current = buildCoverageMap(coverage);
      requestAnimationFrame(() => {
        runScan();
      });
      return true;
    });
  }, [coverage, runScan]);

  // Keyboard shortcut: Ctrl+Shift+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggle]);

  // MutationObserver for DOM changes while active
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const debouncedRescan = () => {
      if (rescanTimerRef.current) {
        clearTimeout(rescanTimerRef.current);
      }
      rescanTimerRef.current = setTimeout(runScan, RESCAN_DEBOUNCE_MS);
    };

    observerRef.current = new MutationObserver(debouncedRescan);
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden", "data-testid"],
    });

    window.addEventListener("popstate", debouncedRescan);
    window.addEventListener("resize", debouncedRescan);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("popstate", debouncedRescan);
      window.removeEventListener("resize", debouncedRescan);
      if (rescanTimerRef.current) {
        clearTimeout(rescanTimerRef.current);
      }
    };
  }, [isActive, runScan]);

  // Drag handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const badge = badgeRef.current;
      if (!badge) {
        return;
      }
      badge.setPointerCapture(e.pointerId);
      dragRef.current = {
        isDragging: false,
        didDrag: false,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - badgePosition.x,
        offsetY: e.clientY - (window.innerHeight - badgePosition.y - badge.offsetHeight),
      };
    },
    [badgePosition]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    e.stopPropagation();

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.isDragging && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
      drag.isDragging = true;
      drag.didDrag = true;
    }

    if (drag.isDragging) {
      const badge = badgeRef.current;
      if (!badge) {
        return;
      }
      const newX = Math.max(0, Math.min(e.clientX - drag.offsetX, window.innerWidth - badge.offsetWidth));
      const newBottom = Math.max(
        0,
        Math.min(
          window.innerHeight - (e.clientY - drag.offsetY) - badge.offsetHeight,
          window.innerHeight - badge.offsetHeight
        )
      );
      setBadgePosition({ x: newX, y: newBottom });
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const drag = dragRef.current;
      const badge = badgeRef.current;
      if (badge) {
        badge.releasePointerCapture(e.pointerId);
      }

      if (drag && !drag.didDrag) {
        toggle();
      }
      if (drag?.didDrag) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(badgePosition));
      }
      dragRef.current = null;
    },
    [toggle, badgePosition]
  );

  const handleHover = useCallback(
    (id: string | null, position: { x: number; y: number } | null) => {
      if (isTooltipHovered) {
        return;
      }

      if (!id || !position) {
        setTooltipData(null);
        return;
      }

      const interactions = interactionMapRef.current.get(id);
      if (!interactions) {
        setTooltipData(null);
        return;
      }

      const el = highlights.find((h) => h.id === id)?.element;
      const testId = el?.dataset.testid ?? id;

      setTooltipData({
        testId,
        interactions: interactions.map((i) => ({
          context: i.context,
          condition: i.condition,
          expected: i.expected,
          test: i.test,
          visible: i.visible,
        })),
        position,
      });
    },
    [highlights, isTooltipHovered]
  );

  const handleToggleUncovered = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUncovered((prev) => !prev);
  }, []);

  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <>
      {/* Badge */}
      <div
        ref={badgeRef}
        data-prospect-overlay="true"
        style={{
          ...(isActive ? badgeActiveStyle : badgeInactiveStyle),
          left: badgePosition.x,
          bottom: badgePosition.y,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        title="Toggle Prospect Overlay (Ctrl+Shift+E) — Drag to move"
      >
        <BadgeLabel />

        {isActive && (
          <BadgeStatsPanel stats={stats} showUncovered={showUncovered} onToggleUncovered={handleToggleUncovered} />
        )}
      </div>

      {/* Highlights */}
      {isActive && highlights.length > 0 && (
        <ElementHighlighter highlights={highlights} showUncovered={showUncovered} onHover={handleHover} />
      )}

      {/* Tooltip */}
      {isActive && tooltipData && (
        <TestTooltip
          data={tooltipData}
          onMouseEnter={() => {
            setIsTooltipHovered(true);
          }}
          onMouseLeave={() => {
            setIsTooltipHovered(false);
            setTooltipData(null);
          }}
        />
      )}
    </>,
    document.body
  );
}
