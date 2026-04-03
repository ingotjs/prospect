export type { Interaction, Route } from "../define-coverage.ts";

export type HighlightStatus = "covered" | "uncovered";

export type HighlightRect = {
  id: string;
  rect: DOMRect;
  status: HighlightStatus;
  testCount: number;
  element: HTMLElement;
};

export type TooltipData = {
  testId: string;
  interactions: {
    context: string | undefined;
    condition: string | undefined;
    expected: string | undefined;
    test: string | null;
    visible: boolean | undefined;
  }[];
  position: { x: number; y: number };
};

export type CoverageStats = {
  covered: number;
  uncovered: number;
  total: number;
  percentage: number;
};
