// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Interaction = {
  /** Precondition / input state — omit if there's only one scenario */
  context?: string;
  /** Visibility condition (feature flag, auth state, etc.) */
  condition?: string;
  /** Whether the element should be visible under this condition */
  visible?: boolean;
  /** Expected behavior when interacted with */
  expected?: string;
  /** Test file covering this case — null means no test exists yet (coverage gap) */
  test: string | null;
  /** Nested interactive elements revealed by this interaction */
  reveals?: Record<string, Interaction[]>;
};

export type RouteAccess = {
  expected: string;
  test: string | null;
};

export type Route = {
  access?: Record<string, RouteAccess>;
  interactions: Record<string, Interaction[]>;
};

export type SetupOptions = {
  /** Absolute path to the directory containing test files */
  testDir: string;
  /** If true, fails when any interaction has test: null */
  strict?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type-safe interaction map — validates shape without widening keys */
export function interactions<T extends Record<string, Interaction[]>>(map: T): T {
  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function defineE2ECoverage<
  const TTestId extends Record<string, Record<string, string>>,
  const TRoutes extends string = string,
>(config: {
  testId: TTestId;
  routes: Record<TRoutes, Route>;
}): {
  testId: TTestId;
  routes: Record<TRoutes, Route>;
} {
  return {
    testId: config.testId,
    routes: config.routes,
  };
}
