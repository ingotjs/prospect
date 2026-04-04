# @ingot/prospect

**[Website](https://ingot.js.org)**

The full Playwright companion. Coverage mapping, test artifacts, and a dev overlay — all in one package.

- **Coverage** — map every route's interactive elements to tests, validate on every run
- **Overlay** — see coverage and test videos directly in your app during dev
- **Reporter** — Playwright reporter that stores test runs and artifacts
- **Visual regression** — screenshot diffing with PR comments _(coming soon)_

## Coverage

### Quick start

```ts
import { defineE2ECoverage, interactions } from "@ingot/prospect";

const testId = { signin: { buttonSubmit: "signin-button-submit" } } as const;

const e2e = defineE2ECoverage({
  testId,
  routes: {
    "/auth/sign-in": {
      interactions: {
        [testId.signin.buttonSubmit]: [
          { context: "valid credentials", expected: "redirects to /", test: "auth/sign-in.e2e.ts" },
          { context: "invalid credentials", expected: "stays on page", test: "auth/sign-in.e2e.ts" },
          { expected: "validation errors", test: "auth/sign-in.e2e.ts" },
        ],
      },
    },
  },
});

export const { testId, routes } = e2e;
```

### `defineE2ECoverage({ testId, routes })`

Returns `{ testId, routes }`.

- **testId** — nested `as const` object of `data-testid` strings. Tests import this for type-safe selectors.
- **routes** — route-based map of interactive elements, their contexts, and test coverage.

### `interactions(map)`

Helper that validates interaction map shape without widening key types. Use for shared component groups.

### `Interaction` type

```ts
{
  context?: string;     // Precondition — omit if only one scenario
  condition?: string;   // Visibility condition (feature flag, auth state)
  visible?: boolean;    // Expected visibility under this condition
  expected?: string;    // What happens when interacted with
  test: string | null;  // Test file path — null = coverage gap
  reveals?: Record<string, Interaction[]>;  // Nested UI revealed by this interaction
}
```

### `setup(config, options)` (from `@ingot/prospect/setup`)

Separate Node-only import — keeps the main export browser-safe.

```ts
import { setup } from "@ingot/prospect/setup";

const validate = setup({ testId, routes }, { testDir: resolve(__dirname, "./tests") });

// In Playwright globalSetup:
export default function globalSetup() {
  validate();
}
```

| Option  | Type    | Description                                  |
| :------ | :------ | :------------------------------------------- |
| testDir | string  | Absolute path to test files directory        |
| strict  | boolean | If true, fails on any `test: null` (no gaps) |

**Validates:**

- Test files exist on disk
- No duplicate testId values
- Orphan testIds not in any route (warning)
- Unknown interaction keys not in testId (warning)
- Coverage summary printed to stdout

### `testId` naming convention

Prefix with element type for clarity:

| Prefix   | Element           | Example                         |
| :------- | :---------------- | :------------------------------ |
| `button` | Button, trigger   | `buttonSubmit`, `buttonTrigger` |
| `link`   | Link, anchor      | `linkSignin`, `linkBack`        |
| `input`  | Text input, field | `inputEmail`, `inputPassword`   |

### Optional

Using `testId` and `routes` from coverage.ts in your tests is **optional**. You can use raw strings if you prefer — the coverage file is primarily a tracking/validation tool.

## Overlay

Dev-only React overlay that visualizes coverage and test health directly in your app.

- **Green** — element is covered, tests pass
- **Red** — no test coverage

Hover any element to see which tests cover it. Click to watch the test video — even for passing tests, so you can see exactly what each test does.

```tsx
// Only loads in development — zero bytes in production
import { CoverageOverlay } from "@ingot/prospect/overlay";

// In your app layout (dev only):
{
  process.env.NODE_ENV === "development" && <CoverageOverlay coverage={routes} />;
}
```

The overlay is framework-agnostic. Use whatever dev guard your bundler provides (`import.meta.env.DEV`, `process.env.NODE_ENV`, etc.).

## Reporter

Playwright reporter that captures test results and artifacts (videos, screenshots, traces). Stores everything locally — no external service required.

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [["@ingot/prospect/reporter", { outputDir: ".prospect" }]],
});
```

Data is stored in `.prospect/` (SQLite + artifact files). The overlay reads from this directory to show test videos in your app.

## Monorepo setup

In monorepos, put your coverage definition in a shared package so both your app (overlay) and E2E tests can import it:

```
packages/e2e-coverage/   ← coverage.ts with defineE2ECoverage()
  apps/web/              ← imports overlay + coverage (dev only)
  apps/e2e/              ← imports coverage for tests + validation
```

## AI Skills ([TanStack Intent](https://tanstack.com/intent/latest))

Prospect ships agent skills that AI coding assistants (Claude Code, Cursor, etc.) can auto-discover and load. Skills guide the agent through coverage workflows, test writing patterns, and project setup.

### Install

```bash
npx @tanstack/intent install
```

This scans `node_modules` for Intent-enabled packages and prints setup instructions for your agent config. For Claude Code, it generates mappings in your project's agent config that automatically load the right skill when you're working in a relevant area.

### Manual setup (Claude Code)

If you prefer manual setup, symlink the skills into `.claude/skills/`:

```bash
# E2E testing guide — auto-invoked when writing tests
ln -s ../../node_modules/@ingot/prospect/skills/e2e-testing .claude/skills/_e2e-testing

# /prospect audit command — run manually to scan routes for coverage gaps
ln -s ../../node_modules/@ingot/prospect/skills/prospect .claude/skills/prospect
```

### Included skills

| Skill                  | Type      | Description                                                                   |
| :--------------------- | :-------- | :---------------------------------------------------------------------------- |
| `prospect/e2e-testing` | Core      | Coverage patterns, `data-testid` conventions, test fixtures, selectors        |
| `prospect/audit`       | Lifecycle | `/prospect` command — scans routes, adds `data-testid`, updates coverage spec |

### `/prospect` command

Run `/prospect` in your AI assistant to audit E2E coverage:

```
/prospect                    # Audit all routes
/prospect /auth              # Audit only auth routes
/prospect /account /admin    # Audit specific routes
```

The command scans your routes, ensures every interactive element has `data-testid`, and updates your coverage spec. Supports gradual adoption — start with one route and expand over time.

## Visual regression _(coming soon)_

Screenshot comparison with automatic PR comments showing visual diffs. Self-hosted — no per-screenshot pricing.

## License

MIT
