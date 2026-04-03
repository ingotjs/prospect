---
name: prospect/audit
description: >
  Scan routes for interactive elements, ensure data-testid coverage, and
  update the coverage spec. Use when the user runs /prospect or asks to
  audit E2E coverage across routes. Supports gradual per-route adoption.
type: lifecycle
library: prospect
library_version: "0.0.0"
---

> **Keyword Usage:** Use **MUST** and **NEVER** to enforce critical requirements. These signal mandatory behavior that AI agents MUST follow without exception.
>
> **Keep this skill in sync:** When coverage patterns, testId conventions, or the prospect package API changes, this skill MUST be updated.

# /prospect — E2E Coverage Audit & Setup

Automated workflow that ensures every interactive element across the project has `data-testid` and is tracked in the coverage spec. Supports gradual adoption — run it on one route, a group of routes, or the entire project.

## Usage

```
/prospect                    # Audit all routes
/prospect /auth              # Audit only auth routes
/prospect /account /admin    # Audit specific routes
```

## Workflow

Execute these steps **in order**. Do NOT skip steps.

### Step 1: Verify Project Setup

**Check if the project has a coverage package:**

1. Search for a file that imports `defineE2ECoverage` from `@ingot/prospect`
2. If found → note its location (this is the coverage spec file)
3. If NOT found → create the coverage infrastructure:
   - In monorepos: create a shared package (e.g., `packages/e2e-coverage/`) with `coverage.ts`
   - In single apps: create `e2e/coverage.ts` at the project root
   - Install `@ingot/prospect` as a dev dependency
   - Create the skeleton coverage file:

```ts
import { defineE2ECoverage, interactions } from "@ingot/prospect";

const testId = {} as const;

const e2e = defineE2ECoverage({
  testId,
  routes: {},
});

export const { testId, routes } = e2e;
```

**Monorepo check:** If the project uses workspaces (check root `package.json` for `workspaces`), the coverage file MUST live in a shared package — NOT inside the E2E test app or the web app. Both need to import from it:

- Web app imports it for the dev overlay
- E2E test app imports it for test selectors and validation

### Step 2: Discover Routes

1. Find the routing system (TanStack Router, Next.js, Remix, etc.)
2. List all user-facing routes (skip API routes, server-only routes, middleware)
3. For each route, identify the component file(s) that render its content
4. If the user specified routes (e.g., `/prospect /auth`), filter to only those routes and any routes that start with that prefix

### Step 3: Scan Each Route for Interactive Elements

For each route, read the component tree and identify **every** element a user can interact with:

| Element Type | What to look for                                      |
| :----------- | :---------------------------------------------------- |
| Buttons      | `<Button>`, `<button>`, `type="submit"`, `onClick`    |
| Links        | `<Link>`, `<a href>`, navigation elements             |
| Inputs       | `<Input>`, `<input>`, `<textarea>`, `<PasswordInput>` |
| Selects      | `<Select>`, `<select>`, dropdown triggers             |
| Toggles      | `<Switch>`, `<Checkbox>`, `<RadioGroup>`              |
| Menus        | `<DropdownMenu>`, context menus, menu items           |
| Modals       | Trigger buttons that open dialogs/drawers             |
| Expandable   | `<Accordion>`, `<details>`, collapsible sections      |

**For each interactive element found:**

1. Check if it already has a `data-testid` attribute
2. If missing → add `data-testid` following the naming convention: `{section}-{type}-{name}`
   - Section: the feature area (e.g., `signin`, `header`, `delete-account`)
   - Type: `button`, `link`, `input`, `select`, `trigger`
   - Name: descriptive action/target (e.g., `submit`, `email`, `trigger`, `back`)
3. Track which elements are new vs already covered

**Naming examples:**

- `signin-button-submit` — submit button in sign-in form
- `header-link-logo` — logo link in header
- `delete-account-button-trigger` — button that opens the delete account confirmation
- `locale-switcher-button-trigger` — dropdown trigger for locale selector
- `change-password-input-current` — current password input field

### Step 4: Update the Coverage Spec

Open the coverage spec file (found in Step 1) and merge changes:

**4a. Update `testId` object:**

- Add new groups for new sections
- Add new entries for new interactive elements
- NEVER remove existing entries — they may be used in tests
- Keep alphabetical order within groups

**4b. Identify shared components:**

- Elements that appear on multiple routes (header, footer, nav, user menu) MUST be extracted as shared groups using `interactions()`:

```ts
const header = interactions({
  [t.header.linkLogo]: [{ expected: "navigates to /", test: null }],
  [t.header.linkHome]: [{ expected: "navigates to /", test: null }],
});
```

- Shared groups are spread into routes: `{ ...header, ...userMenu, ...footer }`

**4c. Update route entries:**

- Add new routes that don't exist yet
- Add new interactive elements to existing routes
- For each interaction, define scenarios:
  - `context` — when the same element behaves differently based on input (e.g., "valid credentials" vs "invalid credentials")
  - `condition` — when the element's visibility depends on state (e.g., "authenticated", "feature flag enabled")
  - `expected` — what happens when the user interacts with it
  - `test` — set to `null` for new entries (coverage gap)
  - `reveals` — for elements that open modals/drawers, define the nested elements

**4d. Route access control:**

- For protected routes, add `access` entries:

```ts
"/account": {
  access: {
    authenticated: { expected: "renders page", test: null },
    unauthenticated: { expected: "redirects to /auth/sign-in", test: null },
  },
  interactions: { ... },
}
```

### Step 5: Report

After completing the audit, output a summary:

```
Prospect Coverage Audit
═══════════════════════
Routes scanned: 8
Interactive elements found: 45
  ├─ Already had data-testid: 30
  ├─ Added data-testid: 15
  └─ Already in coverage spec: 25

Coverage spec updates:
  ├─ New testId entries: 15
  ├─ New route entries: 2
  └─ New interaction scenarios: 20

Coverage gaps (test: null): 42/65 interactions
Run `grep -c 'test: null' <coverage-file>` to track progress.
```

## Rules

- **MUST add `data-testid` to the outermost interaction point** — what the user clicks, not internal wrappers
- **MUST set `test: null` for all new interactions** — never invent test file paths that don't exist
- **NEVER remove existing `data-testid` attributes or coverage entries** — they may be referenced by tests
- **NEVER modify existing test file references** — only add new entries or fill `null` gaps
- **MUST use `interactions()` helper for shared component groups** — ensures type safety
- **MUST handle conditional visibility** — elements behind feature flags or auth state need `condition` + `visible` entries
- **MUST handle modals/drawers with `reveals`** — the trigger button's interaction should reference the nested UI
- **MUST preserve existing coverage structure** — merge into the existing file, don't rewrite it

## Reference

- **`@ingot/prospect` API:** see `packages/prospect/README.md`
- **E2E testing patterns:** activate `_e2e-testing` skill for test writing guidance
- **Interaction type fields:**

```ts
{
  context?: string;     // Precondition — omit if only one scenario
  condition?: string;   // Visibility condition (feature flag, auth state)
  visible?: boolean;    // Expected visibility under this condition
  expected?: string;    // What happens when interacted with
  test: string | null;  // Test file — null = coverage gap
  reveals?: Record<string, Interaction[]>;  // Nested UI
}
```
