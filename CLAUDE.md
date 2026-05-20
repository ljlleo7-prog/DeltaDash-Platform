# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Use English unless otherwise specified.

## Commands

- Install dependencies: `npm ci`
- Start the dev server: `npm run dev`
- Build production output: `npm run build`
- Run the production server locally: `npm run start`
- Lint the codebase: `npm run lint`
- Run a targeted lint pass while editing: `npx eslint src/app/versions/publish/page.tsx src/components/release-publish-form.tsx`

## Architecture

### Framework and rendering model

- This app uses Next.js 16 App Router with React 19 and TypeScript.
- Most route files under `src/app/` are async server components that read the preferred language from `deltaDashLanguage` via `src/lib/i18n-server.ts`, fetch Supabase-backed content through `src/lib/platform-data.ts`, and render localized copy on the server.
- Interactive auth and publishing flows are isolated into client components such as `src/components/auth-status-panel.tsx` and `src/components/release-publish-form.tsx`.
- `src/app/layout.tsx` applies the global visual shell, Google fonts, and wraps every page in `AppShell`, so layout, navigation, auth state, and language switching are centralized there.

### Product shape

- The platform is a content hub for Delta Dash official releases, downloads, mods, forks, community threads, and structured rules.
- The `/download`, `/versions`, `/mods`, `/forks`, `/community`, and `/rules` routes all follow the same pattern: server-rendered page -> `getPreferredLanguage()` -> `platform-data` fetcher -> localized presentation components.
- `/versions/publish` is the only write-heavy workflow in this repo today. It is gated by shared SSO plus release-admin membership and writes official release records, branch links, and uploaded files.
- Community submission flows are not implemented yet; mods, forks, and threads are currently read-only surfaces backed by Supabase queries.

### Data and localization model

- Supabase is the primary backend. Query helpers in `src/lib/platform-data.ts` map rows from `dd_version_list`, `dd_branch_map`, `dd_version_files`, `dd_mods`, `dd_forks`, `dd_fork_files`, `dd_threads`, and `dd_rule_sections` into UI-friendly TypeScript shapes from `src/lib/types.ts`.
- Most user-facing text in the database is stored as JSON objects with `zh` and `en` keys. `src/lib/i18n.ts` normalizes unknown values into that shape and provides `localize`, `toLocalizedText`, and `toLocalizedList` helpers.
- `db/schema.sql` is the authoritative snapshot of the MVP schema, including RLS policies and the `dd_is_release_admin()` helper used to protect official release writes.

### Auth and storage integration

- Supabase client setup lives in `src/lib/supabase.ts`. Browser auth uses a custom cookie-backed storage adapter on `.geeksproductionstudio.com` so this app can share sessions with the main Delta Dash / Geeks Production Studio site.
- `getSharedSessionProfile()` reads the existing Supabase session and the authoritative `profiles` row; `isReleaseAdminProfile()` treats `tester_programs` entries `DeltaDash` and `Developer` as release-admin access.
- Official release uploads go through Supabase Storage bucket `dd-official-releases` via `uploadOfficialReleaseFile()`, then the resulting public URLs are written to `dd_version_files`.
- External reference project for profile authority, developer verification, test-player tags, and community/news formatting patterns: `/Users/leolong/documents/trae_projects/GPS-Homepage`

### UI conventions

- The repository is intentionally styled to match the original Delta Dash site. Preserve the shared visual language in `src/app/globals.css` and the reusable shell/header/section components instead of introducing a separate design system.
- Reusable presentation primitives live in `src/components/` (`AppShell`, section headers, empty states, workshop cards, version tree). Prefer extending those patterns before adding page-specific structure.

## Repository instructions

- Read the relevant guide in `node_modules/next/dist/docs/` before changing framework behavior; this project uses a Next.js version with breaking changes relative to older conventions.
- When database schema changes are needed, always create a new manually runnable SQL file under `db/migrations/` instead of relying only on `db/schema.sql` edits.
- Never edit an existing migration file to add follow-up schema changes. Create a brand new rerunnable migration file for every later schema update, even if it touches the same tables/functions.
- Migration files must be safe for the user's editor-run workflow: rerunnable where practical, and scoped to dd-related objects plus `public.dd_is_release_admin()` unless the user explicitly broadens scope.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->