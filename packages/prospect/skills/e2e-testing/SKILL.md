---
name: prospect/e2e-testing
description: >
  Write and debug Playwright E2E tests using @ingot/prospect. Covers
  defineE2ECoverage, coverage.ts structure, data-testid conventions, test
  fixtures, selectors, overlay, and best practices. Load when adding E2E
  tests, debugging test failures, or auditing interactive element coverage.
type: core
library: prospect
library_version: "0.0.0"
sources:
  - "ingotjs/cast:packages/prospect/define-coverage.ts"
  - "ingotjs/cast:packages/prospect/setup.ts"
---

> **Keyword Usage:** Use **MUST** and **NEVER** to enforce critical requirements. These signal mandatory behavior that AI agents MUST follow without exception.
>
> **Keep this skill in sync:** When making changes to E2E test fixtures, selectors, config, or test patterns, this skill MUST be updated to reflect the current state. Outdated skills are worse than no skills.

# E2E Testing Guide

This project uses **Playwright** + **@ingot/prospect** for E2E tests. Prospect is the full Playwright companion — coverage mapping, a dev overlay, and test artifacts in one package.

The core principle: **every user interaction MUST be tested.** E2E tests simulate a real human — if a user can click it, type in it, or select it, it MUST have a `data-testid` and a test.

## Running Tests

The dev server starts automatically — Playwright's `webServer` config runs `bun dev` and waits for it. NEVER manually start the dev server or claim it needs to be running.

```sh
bun e2e                               # all tests (from project root)
bunx playwright test --headed          # with browser visible (from apps/e2e/)
bunx playwright test --ui              # interactive UI mode
bunx playwright test tests/auth/       # specific directory
```

## Architecture

| Path                              | Purpose                                              |
| :-------------------------------- | :--------------------------------------------------- |
| `packages/prospect/`              | Coverage framework + dev overlay (`@ingot/prospect`) |
| `apps/e2e/playwright.config.ts`   | Config (baseURL, webServer, timeouts)                |
| `apps/e2e/coverage.ts`            | Interactive element coverage map (source of truth)   |
| `apps/e2e/global-setup.ts`        | Validates coverage + cleans .email-captures          |
| `apps/e2e/tests/fixtures/auth.ts` | Custom fixtures (testUser, signIn, expectEmail, etc) |
| `apps/e2e/tests/auth/`            | Auth flow tests                                      |
| `apps/e2e/tests/proxy/`           | Proxy tests                                          |

---

## @ingot/prospect — The Full Playwright Companion

### What it provides

| Feature               | Status  | Description                                          |
| :-------------------- | :------ | :--------------------------------------------------- |
| **Coverage mapping**  | Shipped | `defineE2ECoverage()` maps routes → elements → tests |
| **Dev overlay**       | Shipped | See coverage visually in your app (green/red/amber)  |
| **Test artifacts**    | WIP     | Videos, screenshots, traces stored locally           |
| **Visual regression** | Planned | Screenshot diffing with PR comments                  |

### Dev Overlay

The overlay renders directly in your app during development. It shows:

- **Green** — element is covered, tests pass
- **Red** — no test coverage (`test: null`)

**Features:**

- Hover any highlighted element to see test details (file, context, expected behavior)
- Draggable badge with coverage stats (percentage, covered/total)
- Toggle uncovered element visibility
- Keyboard shortcut: `Ctrl+Shift+E`
- MutationObserver rescans on DOM changes
- Portal to `document.body` — works above modals
- `pointer-events: none` on highlights — doesn't intercept clicks

**Usage (consumer handles dev gating):**

```tsx
// Vite
import.meta.env.DEV && <CoverageOverlay coverage={routes} />;

// Next.js / webpack
process.env.NODE_ENV === "development" && <CoverageOverlay coverage={routes} />;
```

Zero bytes in production — the import is tree-shaken when the condition is false.

### Gradual Adoption

Prospect supports **gradual, per-route adoption**. You don't need to map every route on day one:

1. **Start with one route** — pick the most critical flow (e.g., sign-in)
2. **Add `data-testid`** to every interactive element on that route
3. **Define coverage** in `coverage.ts` for that route only
4. **Write tests** for the covered interactions
5. **Expand** to more routes over time

The overlay only highlights elements with `data-testid` that appear in the coverage map. Routes not in the map are simply invisible to the system — no errors, no noise.

**Per-system adoption** also works: start by covering auth flows, then forms, then admin, etc. Each system can be adopted independently.

```ts
// Start small — just sign-in
const e2e = defineE2ECoverage({
  testId,
  routes: {
    "/auth/sign-in": {
      interactions: {
        /* ... */
      },
    },
    // Add more routes as you go
  },
});
```

### Monorepo Setup

In monorepos, put coverage in a shared package so both the app (overlay) and E2E tests can import it:

```
packages/e2e-coverage/   ← coverage.ts with defineE2ECoverage()
  apps/web/              ← imports overlay + coverage (dev only)
  apps/e2e/              ← imports coverage for tests + validation
```

---

## Interactive Element Coverage System

### Philosophy

E2E tests MUST simulate a real human. Every interactive element — buttons, links, inputs, selects, toggles, dropdowns — MUST be tested. If a user can interact with it, it MUST:

1. Have a `data-testid` on the **outermost interaction point** (what the user clicks, not internal wrappers)
2. Be listed in `apps/e2e/coverage.ts`
3. Have a test for every meaningful context/state

### `coverage.ts` — The Source of Truth

`apps/e2e/coverage.ts` is the central file for E2E testing. It serves two purposes:

1. **Test ID registry** — exports `testId`, a nested const object of all `data-testid` strings. Tests MUST import from here instead of hardcoding strings:

   ```ts
   import { testId } from "../../coverage";
   await page.getByTestId(testId.userMenu.buttonTrigger).click();
   await page.getByTestId(testId.deleteAccount.buttonConfirm).click();
   ```

2. **Coverage map** — maps every route → every interactive element → every context → the test that covers it. `test: null` explicitly marks coverage gaps — grep for it to find them.

**Interaction fields:**

- `context` — omit if there's only one scenario. Include when the same element behaves differently based on input/state.
- `test: null` — means no test exists yet. Always set explicitly so gaps are visible and searchable.

**Structure:**

```ts
// Reusable component groups — spread into routes
const userMenu: Record<string, Interaction[]> = {
  "user-menu-trigger": [
    { condition: "authenticated", visible: true, test: "sign-out.e2e.ts" },
    { condition: "unauthenticated", visible: false, test: "sign-out.e2e.ts" },
  ],
  "user-menu-signout": [{ expected: "signs out, redirects to /", test: "sign-out.e2e.ts" }],
};

// Routes compose shared + route-specific elements
export const coverage: Record<string, Route> = {
  "/account": {
    access: {
      authenticated: { expected: "renders page", test: "account-access.e2e.ts" },
      unauthenticated: { expected: "redirects to /auth/sign-in", test: "account-access.e2e.ts" },
    },
    interactions: {
      ...userMenu,
      "update-profile-submit": [{ context: "valid name", expected: "updates profile, success toast", test: null }],
    },
  },
};
```

### How to model different element types

**Buttons / Links** — simple interactions:

```ts
"signin-submit": [
  { context: "valid credentials", expected: "signs in, redirects to /", test: "sign-in.e2e.ts" },
  { context: "invalid credentials", expected: "stays on page, shows error", test: "sign-in.e2e.ts" },
  { context: "empty form", expected: "validation errors", test: "sign-in.e2e.ts" },
]
```

**Selects / Dropdowns with options** — each option is a context:

```ts
"filter-status": [
  { context: "select: all", expected: "shows all items", test: "filter.e2e.ts" },
  { context: "select: active", expected: "filters to active items only", test: "filter.e2e.ts" },
  { context: "select: archived", expected: "filters to archived items only", test: null },
]
```

**Conditional visibility** (auth state, feature flags, roles):

```ts
"google-oauth-button": [
  { condition: "googleOAuth enabled", visible: true, test: null },
  { condition: "googleOAuth disabled", visible: false, test: null },
  { expected: "initiates Google OAuth flow", test: null },
]
```

**Elements that reveal nested UI** (modals, drawers, accordions, expandable sections):

```ts
// Extract the revealed group as a reusable variable
const deleteAccountModal = {
  "delete-account-password": [
    { expected: "accepts password input", test: "delete-account.e2e.ts" },
  ],
  "delete-account-confirm": [
    { context: "correct password", expected: "deletes account", test: "delete-account.e2e.ts" },
    { context: "wrong password", expected: "shows error", test: null },
  ],
  "delete-account-cancel": [
    { expected: "hides confirmation form", test: null },
  ],
};

// Reference in the trigger
"delete-account-trigger": [
  { expected: "opens confirmation modal", test: "delete-account.e2e.ts",
    reveals: deleteAccountModal },
]
```

**Multiple interactive elements in the same component** — each gets its own testid and entry. Use a naming prefix to group them:

```ts
// UserCard component has edit and delete buttons
"user-card-edit": [
  { expected: "opens edit modal", test: "users.e2e.ts" },
],
"user-card-delete": [
  { expected: "opens delete confirmation", test: "users.e2e.ts" },
],
"user-card-role-select": [
  { context: "select: admin", expected: "promotes user to admin", test: "users.e2e.ts" },
  { context: "select: user", expected: "demotes to regular user", test: "users.e2e.ts" },
],
```

**Repeated elements in lists** (sessions, passkeys, table rows) — one entry represents the pattern. Don't list each individual item:

```ts
"session-revoke": [
  { context: "other session", expected: "revokes session, removes from list", test: null },
  { context: "current session", expected: "revokes and signs out", test: null },
]
```

**Inputs** — only need coverage entries if they have meaningful interactive behavior beyond "accepts text". Inputs tested as part of a form submission (fill → submit → verify) are covered by the submit button's test. Give them a testid for selector stability, but the coverage entry is optional unless the input has special behavior (autocomplete, search-on-type, etc.):

```ts
// Search input that filters without a submit button
"search-query": [
  { context: "type: partial match", expected: "filters results in real-time", test: null },
  { context: "type: no results", expected: "shows empty state", test: null },
  { context: "clear input", expected: "resets to full list", test: null },
]
```

### Route access control

Routes with auth guards or role requirements MUST test all access scenarios:

```ts
"/admin": {
  access: {
    admin: { expected: "renders page", test: null },
    user: { expected: "redirects to /", test: null },
    unauthenticated: { expected: "redirects to /auth/sign-in", test: null },
  },
  interactions: { ... },
}
```

### Shared vs route-specific elements

Shared components (header, footer, user menu) are defined as **variables** and spread into routes. They're tested **once** — not on every route — because their behavior doesn't change. If a shared component behaves differently on a specific route, add a route-specific override.

### How to run a full coverage audit

1. **Read all routes** in `apps/web/src/routes/` (can parallelize)
2. **For each route**, identify every interactive element in the component tree
3. **Check each element** against `coverage.ts`:
   - Missing from coverage? → Add entry
   - Missing `data-testid`? → Add to component
   - Has `test: null`? → Write test
4. **Report gaps** with counts: `grep -c 'test: null' apps/e2e/coverage.ts`
5. **Write tests** for all `test: null` entries
6. **Verify**: `bun e2e`

When adding new features, follow the same process for the new/changed routes.

---

## Test Fixtures (`tests/fixtures/auth.ts`)

| Fixture             | Description                                                         |
| :------------------ | :------------------------------------------------------------------ |
| `testUser`          | Creates user via API, clears cookies. Returns `{ email, password }` |
| `authenticatedPage` | Creates user via API, keeps session cookies. Returns credentials    |
| `signIn`            | Signs in via API, sets session cookies: `signIn(email, password)`   |
| `signOut`           | Signs out by clearing cookies: `signOut()`                          |
| `getEmails`         | Reads captured emails for a recipient (low-level)                   |
| `expectEmail`       | Asserts an email with matching subject keyword was captured (polls) |
| `clearEmails`       | Clears all captured emails                                          |

---

## Rules — MUST follow

### Selectors

- **MUST use `data-testid` attributes** via `page.getByTestId()` for all interactive elements
- **MUST use `page.locator('#id')` for password fields** — `getByLabel` matches both the input AND the "Show password" button (PasswordInput component wraps input + toggle)
- **Use `page.getByLabel()` for non-password text inputs** (Email, First name, etc.)
- **NEVER use text-based selectors** for interactive elements — text changes with i18n
- **NEVER use `waitForLoadState('networkidle')`** — use `expect` assertions instead

### Timeouts

- **Global expect timeout is 5s** (`playwright.config.ts`). NEVER add custom timeouts unless there's a specific reason.
- **If a custom timeout is needed**, add a comment explaining why (e.g., `// Auth redirect involves server-side session creation + redirect`).
- **Only known exception:** `toHaveURL("/", { timeout: 15_000 })` after auth actions (sign-in, sign-up, delete account) — server-side session + redirect is slow.

### Test structure

- **Tests MUST be as small as possible.** One test per context/scenario. Small tests run in parallel = fastest suite.
- **Only ONE test should exercise the full UI for each feature** (e.g., sign-up). All other tests MUST use the API fixtures for setup — faster and more reliable.
- **Each test MUST use a unique email** via the `generateEmail('prefix')` pattern
- **Each test MUST have extensive JSDoc** at the top of the file explaining step-by-step what happens
- **Wait for page hydration** before interacting: `await expect(page.getByTestId('form-id')).toBeVisible()`

### Account page timing

The `/account` page re-renders when session/passkey data loads, which can reset form field values and component state. **MUST wait for data to settle** before filling forms or clicking buttons:

```ts
await expect(page.getByText("Loading sessions...")).not.toBeVisible();
```

### Email notifications

Email notifications and their test coverage are defined in `apps/e2e/coverage.ts` under `notifications`. Grep for `test: null` to find gaps. When adding a new email template, add an entry to `notifications`.

**NEVER use `waitForTimeout()` before checking emails** — it's a race condition. Use the `expectEmail` fixture.

### Auth guard (SSR)

Route auth guards use `getSession()` from `apps/web/src/lib/auth-client.ts` which works during both SSR and CSR. `page.goto('/account')` triggers SSR and the guard correctly checks the session via server-side auth.

---

## Adding data-testid attributes

Place `data-testid` on the **outermost interaction point** — what the user actually clicks/types in:

```tsx
{
  /* Button — testid on the button itself */
}
<Button data-testid="signup-submit" type="submit">
  Create account
</Button>;

{
  /* Link — testid on the link */
}
<Link data-testid="header-nav-about" to="/about">
  About
</Link>;

{
  /* Select — testid on the select trigger, not the wrapper */
}
<Select data-testid="filter-status">
  <SelectTrigger>...</SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>;

{
  /* Multiple elements in same component — prefix groups them */
}
<Card>
  <Input data-testid="user-card-name" />
  <Button data-testid="user-card-edit">Edit</Button>
  <Button data-testid="user-card-delete">Delete</Button>
</Card>;
```

Naming convention: `{feature}-{element}` (e.g., `signup-submit`, `delete-account-trigger`, `filter-status`)

## Adding a new E2E test

1. Create test file in `apps/e2e/tests/{feature}/`
2. Import fixtures: `import { test, expect } from "../fixtures/auth"`
3. Add extensive JSDoc header explaining the test steps
4. Use fixtures for user setup (only the primary happy-path uses full UI)
5. Add/update entries in `apps/e2e/coverage.ts` with the test filename
6. Run and verify: `bun e2e`
