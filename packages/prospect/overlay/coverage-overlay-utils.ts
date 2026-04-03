import type { CoverageStats, HighlightRect, Interaction, Route } from "./types.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoverageEntry = {
  routeKey: string;
  interactions: Interaction[];
};

// ---------------------------------------------------------------------------
// Coverage map builder
// ---------------------------------------------------------------------------

export function buildCoverageMap(routes: Record<string, Route>): Map<string, CoverageEntry[]> {
  const map = new Map<string, CoverageEntry[]>();

  function processInteractions(routeKey: string, interactions: Record<string, Interaction[]>) {
    for (const [testIdValue, cases] of Object.entries(interactions)) {
      const existing = map.get(testIdValue) ?? [];
      existing.push({ routeKey, interactions: cases });
      map.set(testIdValue, existing);

      for (const c of cases) {
        if (c.reveals) {
          processInteractions(routeKey, c.reveals);
        }
      }
    }
  }

  for (const [routeKey, route] of Object.entries(routes)) {
    processInteractions(routeKey, route.interactions);
  }

  return map;
}

// ---------------------------------------------------------------------------
// Route stats
// ---------------------------------------------------------------------------

export function computeRouteStats(routes: Record<string, Route>, pathname: string): CoverageStats {
  const route = routes[pathname];
  if (!route) {
    return { covered: 0, uncovered: 0, total: 0, percentage: 0 };
  }

  let covered = 0;
  let uncovered = 0;

  function count(interactions: Record<string, Interaction[]>) {
    for (const cases of Object.values(interactions)) {
      for (const c of cases) {
        if (c.test !== null) {
          covered++;
        } else {
          uncovered++;
        }
        if (c.reveals) {
          count(c.reveals);
        }
      }
    }
  }

  count(route.interactions);

  if (route.access) {
    for (const access of Object.values(route.access)) {
      if (access.test !== null) {
        covered++;
      } else {
        uncovered++;
      }
    }
  }

  const total = covered + uncovered;
  return { covered, uncovered, total, percentage: total > 0 ? Math.round((covered / total) * 100) : 0 };
}

// ---------------------------------------------------------------------------
// DOM scanning
// ---------------------------------------------------------------------------

let idCounter = 0;
const elementIdMap = new WeakMap<Element, string>();

function getElementId(el: Element): string {
  let id = elementIdMap.get(el);
  if (!id) {
    id = `prospect-${idCounter++}`;
    elementIdMap.set(el, id);
  }
  return id;
}

export function scanDOM(coverageMap: Map<string, CoverageEntry[]>): {
  highlights: HighlightRect[];
  interactionMap: Map<string, Interaction[]>;
} {
  const highlights: HighlightRect[] = [];
  const interactionMap = new Map<string, Interaction[]>();

  const elements = document.querySelectorAll<HTMLElement>("[data-testid]");

  for (const el of elements) {
    if (el.closest("[data-prospect-overlay]")) {
      continue;
    }

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") {
      continue;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) {
      continue;
    }
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      continue;
    }
    if (rect.right < 0 || rect.left > window.innerWidth) {
      continue;
    }

    const testIdValue = el.dataset.testid;
    if (!testIdValue) {
      continue;
    }

    const entries = coverageMap.get(testIdValue);
    if (!entries) {
      continue;
    }

    const allInteractions = entries.flatMap((e) => e.interactions);
    const coveredCount = allInteractions.filter((i) => i.test !== null).length;
    const elId = getElementId(el);

    interactionMap.set(elId, allInteractions);

    highlights.push({
      id: elId,
      rect,
      status: coveredCount > 0 ? "covered" : "uncovered",
      testCount: coveredCount,
      element: el,
    });
  }

  return { highlights, interactionMap };
}
