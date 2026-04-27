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
- Migration files must be safe for the user's editor-run workflow: rerunnable where practical, and scoped to dd-related objects plus `public.dd_is_release_admin()` unless the user explicitly broadens scope.
