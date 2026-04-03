---
name: _testing
description: >
  Unit and E2E testing guidelines for @ingot/prospect. Covers bun:test for unit
  tests, Playwright for E2E tests in the playground app, test conventions, and
  coverage patterns. MUST be activated when writing or modifying any tests.
---

> **Keyword Usage:** Use **MUST** and **NEVER** to enforce critical requirements. These signal mandatory behavior that AI agents MUST follow without exception.

# Testing Guide

## Overview

| Layer     | Tool           | Location                         | Run                  |
| :-------- | :------------- | :------------------------------- | :------------------- |
| Unit      | `bun:test`     | `packages/prospect/tests/`       | `bun test`           |
| E2E       | Playwright     | `apps/playground/tests/`         | `bun e2e`            |

## Unit Tests (`bun:test`)

Unit tests cover the library code in `packages/prospect/`. They test pure logic — coverage map building, validation, stats computation, type helpers.

### Conventions

- Test files: `*.test.ts` in `packages/prospect/tests/`
- Imports: `import { describe, expect, test } from "bun:test"`
- NEVER use `.only` or `.skip` in committed code
- Keep test suites flat — avoid excessive `describe` nesting
- One assertion per concept, multiple assertions per test are fine if testing the same behavior
- Use descriptive test names that explain the scenario

### What to Test

- `defineE2ECoverage()` — validates shape, preserves types
- `setup()` validation — missing files, duplicates, strict mode, coverage stats
- Overlay utils — `buildCoverageMap()`, `computeRouteStats()`, `scanDOM()`
- Edge cases — empty routes, empty interactions, deeply nested `reveals`

### Example

```ts
import { describe, expect, test } from "bun:test";

import { defineE2ECoverage } from "../define-coverage.ts";

describe("defineE2ECoverage", () => {
  test("returns testId and routes unchanged", () => {
    const testId = { auth: { submit: "auth-submit" } } as const;
    const result = defineE2ECoverage({
      testId,
      routes: {
        "/": { interactions: { [testId.auth.submit]: [{ test: null }] } },
      },
    });
    expect(result.testId).toBe(testId);
    expect(result.routes["/"]).toBeDefined();
  });
});
```

## E2E Tests (Playwright)

E2E tests live in `apps/playground/tests/` and exercise the library through the playground app.

### Setup

- Playwright config: `apps/playground/playwright.config.ts`
- Base URL: `http://localhost:5173`
- The dev server starts automatically via Playwright's `webServer` config — NEVER manually start it
- Coverage map: `apps/playground/coverage.ts`

### Conventions

- Test files: `*.e2e.ts` in `apps/playground/tests/`
- **MUST use `data-testid` attributes** via `page.getByTestId()` for interactive elements
- **MUST import `testId` from `../coverage.ts`** — NEVER hardcode testid strings
- **NEVER use text-based selectors** for interactive elements
- **NEVER use `waitForLoadState('networkidle')`** — use `expect` assertions instead
- Tests MUST be small and focused — one test per scenario

### Coverage Integration

Every interactive element in the playground MUST:
1. Have a `data-testid` attribute
2. Be listed in `apps/playground/coverage.ts`
3. Have a test covering it (or `test: null` for explicit gaps)

When adding new interactive elements to the playground:
1. Add `data-testid` to the element in `apps/playground/src/`
2. Add entries to `apps/playground/coverage.ts`
3. Write tests in `apps/playground/tests/`
4. Update `test:` fields in coverage.ts with the test filename

### Example

```ts
import { expect, test } from "@playwright/test";

import { testId } from "../coverage.ts";

test("counter increments", async ({ page }) => {
  await page.goto("/");

  const button = page.getByTestId(testId.counter.buttonIncrement);
  await button.click();
  await expect(page.getByText("Count: 1")).toBeVisible();
});
```

## Rules

- **Tests are REQUIRED** when adding/modifying library functions, overlay components, or playground features
- **NEVER ship changes without test coverage**
- **NEVER use `waitForTimeout()`** — it's a race condition. Use assertions.
- **NEVER add custom timeouts** unless there's a documented reason
- **MUST clean up debug logging** before committing
