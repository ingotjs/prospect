# Prospect

> **Keyword Usage:** Use **MUST** and **NEVER** to enforce critical requirements. These signal mandatory behavior that AI agents MUST follow without exception.
>
> **Keep docs in sync — THIS IS CRITICAL:** CLAUDE.md MUST ALWAYS be updated when making ANY change to: project structure, packages, features, config, scripts, commands, or anything a developer would want to know. **Failing to update this file is unacceptable.** If in doubt, update it.
>
> **Prefer CLAUDE.md over memory:** Save instructions and feedback here, not in `~/.claude/projects/.../memory/`. CLAUDE.md is committed to the repo and persists across machines. NEVER use the memory system.

`@ingot/prospect` — the full Playwright companion. Coverage mapping, dev overlay, and test artifacts in one package. Bun monorepo.

---

## Quick Reference

### Commands

| Command    | Description                                                 |
| :--------- | :---------------------------------------------------------- |
| `bun dev`  | Start playground app in dev mode (port 5173)                |
| `bun test` | Run unit tests (`bun:test`)                                 |
| `bun e2e`  | Run Playwright E2E tests (from `apps/playground`)           |
| `bun build`| Build playground app                                        |

### Monorepo Structure

| Package              | Alias             | Description                                            |
| :------------------- | :---------------- | :----------------------------------------------------- |
| `packages/prospect/` | `@ingot/prospect` | The library — coverage mapping, setup, overlay, skills |
| `apps/playground/`   | `playground`      | Vite + React test app for developing/testing prospect  |

Bun package manager. Bun workspaces (`apps/*`, `packages/*`).

---

## Architecture

### Library Exports

| Export                       | Entry Point                              | Description                                     |
| :--------------------------- | :--------------------------------------- | :---------------------------------------------- |
| `@ingot/prospect`            | `packages/prospect/define-coverage.ts`   | `defineE2ECoverage()`, `interactions()`, types   |
| `@ingot/prospect/setup`      | `packages/prospect/setup.ts`             | `setup()` — Playwright globalSetup validator     |
| `@ingot/prospect/overlay`    | `packages/prospect/overlay/coverage-overlay.tsx` | `CoverageOverlay` — React dev overlay   |

### Feature Status

| Feature                | Status  | Description                                          |
| :--------------------- | :------ | :--------------------------------------------------- |
| **Coverage mapping**   | Shipped | `defineE2ECoverage()` maps routes to elements to tests |
| **Dev overlay**        | Shipped | Visual coverage overlay (green/red/amber)            |
| **Flakiness tracking** | WIP     | Playwright reporter for run history + pass rates     |
| **Test artifacts**     | WIP     | Videos, screenshots, traces stored locally           |
| **Visual regression**  | Planned | Screenshot diffing with PR comments                  |

### TanStack Intent AI Skills

Prospect ships agent skills in `packages/prospect/skills/` for AI coding assistants (Claude Code, Cursor, etc.) via [TanStack Intent](https://tanstack.com/intent/latest). These are published with the package and auto-discoverable.

| Skill                  | Type      | Description                                                                   |
| :--------------------- | :-------- | :---------------------------------------------------------------------------- |
| `prospect/e2e-testing` | Core      | Coverage patterns, `data-testid` conventions, test fixtures, selectors        |
| `prospect/audit`       | Lifecycle | `/prospect` command — scans routes, adds `data-testid`, updates coverage spec |

---

## Key Files

| File                                                     | Purpose                                              |
| :------------------------------------------------------- | :--------------------------------------------------- |
| `packages/prospect/define-coverage.ts`                   | `defineE2ECoverage()`, `interactions()`, core types   |
| `packages/prospect/setup.ts`                             | `setup()` — validation, coverage summary, globalSetup |
| `packages/prospect/overlay/coverage-overlay.tsx`         | `CoverageOverlay` React component                    |
| `packages/prospect/overlay/coverage-overlay-badge.tsx`   | Badge UI with stats panel                            |
| `packages/prospect/overlay/coverage-overlay-styles.ts`   | Overlay style constants                              |
| `packages/prospect/overlay/coverage-overlay-utils.ts`    | DOM scanning, coverage map building, stats            |
| `packages/prospect/overlay/element-highlighter.tsx`      | Element highlight rectangles                         |
| `packages/prospect/overlay/test-tooltip.tsx`             | Hover tooltip with test details                      |
| `packages/prospect/overlay/types.ts`                     | Shared overlay types                                 |
| `packages/prospect/skills/e2e-testing/SKILL.md`          | TanStack Intent — E2E testing guide                  |
| `packages/prospect/skills/prospect/SKILL.md`             | TanStack Intent — `/prospect` audit command           |
| `packages/prospect/README.md`                            | Package README (published to npm)                    |
| `apps/playground/coverage.ts`                            | Example coverage map using `defineE2ECoverage()`     |
| `apps/playground/playwright.config.ts`                   | Playwright config (baseURL, webServer)               |
| `apps/playground/src/App.tsx`                            | Playground app with overlay integration              |
| `apps/playground/tests/example.e2e.ts`                   | Example E2E test                                     |

---

## Development Rules

### Code Standards

**Clean Code + KISS + YAGNI** — self-documenting, readable, minimal complexity.

#### File Size

- **Non-autogenerated source files MUST stay under ~300 lines.** Small tolerance is fine, but if a file grows past this, split it. Create a directory in the same location as the file to house the split modules (e.g., `foo.ts` -> `foo/bar.ts` + `foo/baz.ts`).
- **Keep functions and components short.** Extract helpers, sub-components, and constants. Avoid long inlined JSX, objects, or logic blocks — break them into well-named pieces.

#### TypeScript

- **NEVER** `any`, `as any`, `interface`, or `catch (error: any)`
- Prefer `type` over `interface` (except module augmentation)
- MUST reuse existing types and schemas
- Prefer optional chaining for callbacks: `onComplete?.(data)`
- Object params over positional: `function foo({ name }: { name: string })`
- Versions MUST be pinned (no `^` or `~`)

#### Imports

- **NEVER use barrel files** (index.ts re-exports)
- **MUST import directly from source files**
- **NEVER use dynamic imports** unless genuine code splitting

#### Comments

- NEVER add "what I changed" comments
- Only comment complex, non-obvious logic

#### Implementation

- MUST implement FULLY — NEVER leave "to be implemented" placeholders
- NEVER create documentation files unless explicitly requested
- Code MUST be safe — NEVER allow unauthorized data access

### General Rules

- **Take user instructions LITERALLY.** When the user says to change a specific file or location, do EXACTLY that — don't substitute a different file or scope. Read instructions carefully before acting.
- **ZERO TOLERANCE for warnings, errors, or noise in dev/build output.** If a tool emits warnings, FIX the root cause — don't dismiss as "harmless" or "pre-existing".
- **NEVER remove features, UI, or existing code unless explicitly asked.** Broken? FIX IT — don't delete it.
- **NEVER discard unstaged changes** (`git checkout .`, `git restore .`, `git clean`, `git reset --hard`) to "start fresh" when debugging. Fix the problem — don't nuke the work.
- **NEVER remove or rewrite code as a first attempt to fix something.** Diagnose first, then apply the minimal targeted fix. Deleting code you don't understand is not debugging.
- **MUST ask before making unrequested changes.** If a fix involves modifying code outside the immediate scope, or removing/replacing/restructuring anything, STOP and ask. The user decides what changes are acceptable.
- **NEVER use placeholder values when refactoring.** No `0`, `null`, `""` — compute every field properly.
- NEVER run dev servers or call API endpoints — they're already running in watch mode
- NEVER suggest restarting servers
- NEVER undo changes unless explicitly instructed
- **Do it the way you're told.** NEVER substitute with workarounds.
- NEVER use `setTimeout`, `sleep`, or `timeout` on bash commands
- NEVER run background tasks

### Debugging

- NEVER assume the cause — add targeted debugging
- Trace data flow backwards from the error
- `console.log('DEBUG:', JSON.stringify(data, null, 2))` — MUST clean up after
- MUST try solutions before suggesting them

### Git Workflow

- **NEVER commit or push unless explicitly instructed.** Show changes, wait for instruction. **NEVER commit/push automatically as part of a workflow.**
- `"commit"` = commit EVERYTHING + push. `git add -A && git commit -m "..." && git push`
- `"commit staged only"` = commit only staged files + push
- **Review changes:** `git diff HEAD --stat` for summary, `git diff HEAD -- '*.ts' '*.tsx' '*.json' ':!bun.lock'` for code. NEVER read unfiltered diff.
- New branches: `git fetch origin && git checkout -b <name> origin/main` (always from remote)
- First push: `git push -u origin <branch-name>`
- GitHub ops: ALWAYS use `gh` CLI
- **When given a GitHub PR link**, checkout its branch as the **ABSOLUTE FIRST ACTION** — before reading code, before analyzing.
- **When committing: MUST update CLAUDE.md**
- **NEVER add Co-Authored-By or any AI attribution to commit messages**
- **NEVER use `--no-verify`** unless the user strictly says "skip hooks" or "no-verify". If the hook fails, FIX the issue — don't bypass it. If you can't fix it, ask the user for permission to skip.

---

## Skills

Custom skills (in `.agents/skills/`) MUST be prefixed with `_` (e.g., `_testing`). Installed skills from registries have no prefix. This makes it immediately obvious which skills are ours vs. third-party.

**Auto-invoke skills** — MUST activate the relevant skill when working in its domain:

| Skill      | Trigger                                                       |
| :--------- | :------------------------------------------------------------ |
| `_testing` | Writing/modifying unit or E2E tests                           |
