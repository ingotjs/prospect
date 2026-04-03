import { useCallback, useEffect, useRef, useState } from "react";

import type { HighlightRect } from "./types.ts";

const COVERED_COLOR = "rgba(16, 185, 129, 0.15)";
const COVERED_BORDER = "rgba(16, 185, 129, 0.7)";
const UNCOVERED_COLOR = "rgba(239, 68, 68, 0.1)";
const UNCOVERED_BORDER = "rgba(239, 68, 68, 0.6)";

type ElementHighlighterProps = {
  highlights: HighlightRect[];
  showUncovered: boolean;
  onHover: (id: string | null, position: { x: number; y: number } | null) => void;
};

export function ElementHighlighter({ highlights, showUncovered, onHover }: ElementHighlighterProps) {
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const rafRef = useRef(0);

  useEffect(() => {
    const update = () => {
      setScrollOffset({ x: window.scrollX, y: window.scrollY });
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) {
        onHover(null, null);
        return;
      }

      for (const h of highlights) {
        if (h.element === target || h.element.contains(target)) {
          onHover(h.id, { x: e.clientX, y: e.clientY });
          return;
        }
      }
      onHover(null, null);
    },
    [highlights, onHover]
  );

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove, true);
    };
  }, [handlePointerMove]);

  const visible = highlights.filter((h) => (h.status === "uncovered" ? showUncovered : true));

  return (
    <>
      {visible.map((h) => {
        const isCovered = h.status === "covered";
        const top = h.rect.top + scrollOffset.y;
        const left = h.rect.left + scrollOffset.x;

        return (
          <div
            key={h.id}
            data-prospect-overlay="true"
            style={{
              position: "absolute",
              top,
              left,
              width: h.rect.width,
              height: h.rect.height,
              backgroundColor: isCovered ? COVERED_COLOR : UNCOVERED_COLOR,
              border: `2px solid ${isCovered ? COVERED_BORDER : UNCOVERED_BORDER}`,
              borderRadius: "4px",
              pointerEvents: "none",
              zIndex: 999_998,
              transition: "opacity 0.15s ease",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: isCovered ? COVERED_BORDER : UNCOVERED_BORDER,
                fontSize: "6px",
                lineHeight: "10px",
                textAlign: "center",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {isCovered && h.testCount > 1 ? h.testCount : ""}
            </span>
          </div>
        );
      })}
    </>
  );
}
