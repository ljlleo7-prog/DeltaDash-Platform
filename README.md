# Delta Dash Platform

This repository contains the Next.js platform app for Delta Dash. It is the bilingual release and community hub for official downloads, version history, mods, forks, discussions, and structured rules.

> This is the `deltadash-platform` Next.js app, not the older Create React App project in the parent directory.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase

## Platform overview

The app brings together several Delta Dash product areas in one interface:

- official release downloads
- version tree and changelog browsing
- community mods and forks
- discussion threads linked to releases or mods
- structured rule browsing
- admin-only official release publishing

The visual style is intentionally aligned with the original Delta Dash site rather than the default Next.js starter look.

## Architecture snapshot

- Routes live under `src/app` and are mostly async server components.
- `src/app/layout.tsx` applies the shared shell, fonts, and top-level page chrome.
- `src/components/app-shell.tsx` centralizes navigation, auth status, and language switching.
- `src/lib/platform-data.ts` maps Supabase rows into UI-friendly shapes used by the routes.
- `src/lib/i18n.ts` and `src/lib/i18n-server.ts` handle bilingual content and server-side language selection.
- `src/lib/supabase.ts` contains shared-session auth helpers, release-admin checks, and official file upload helpers.
- `db/schema.sql` is the source of truth for the current MVP schema and storage expectations.

## Main route areas

- `/` — platform overview
- `/play` — launch hub
- `/download` — official downloads
- `/versions` — version tree and release notes
- `/versions/publish` — release admin publishing flow
- `/mods` — community workshop listing
- `/forks` — community branch listing
- `/community` — discussion archive
- `/rules` — structured rule viewer

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the production server locally:

```bash
npm run start
```

Lint the codebase:

```bash
npm run lint
```

## Environment variables

The app expects the following public Supabase environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If these are missing:

- public Supabase-backed content will render as empty states
- shared auth lookups will fail closed
- official release publishing will not work

## Authentication and localization notes

### Shared SSO behavior

Authentication is designed to share Supabase session cookies with the main Geeks Production Studio domain. The browser-side auth storage in `src/lib/supabase.ts` is configured for `.geeksproductionstudio.com`.

That means:

- production auth assumes the Geeks Production Studio domain model
- local development on plain `localhost` may not fully mirror cross-subdomain session behavior
- GPS login redirects are expected to return users back into this app after sign-in

Release publishing access is restricted to profiles whose `tester_programs` include `DeltaDash` or `Developer`.

### Language model

The current language is stored in the `deltaDashLanguage` cookie and supports:

- `zh`
- `en`

Many database fields are stored as localized JSON objects shaped like:

```json
{ "zh": "...", "en": "..." }
```

Do not assume user-facing text fields are plain strings.

## Database and storage setup

The current schema lives in `db/schema.sql`.

Main data areas include:

- `dd_version_list`
- `dd_branch_map`
- `dd_version_files`
- `dd_mods`
- `dd_forks`
- `dd_fork_files`
- `dd_threads`
- `dd_rule_sections`

The schema also expects the following storage buckets:

- `dd-official-releases`
- `dd-mods`
- `dd-forks`

Row-level security is enabled across the MVP tables. Official release writes are protected by the `dd_is_release_admin()` helper and related policies.

## Official release publishing

The admin publishing UI lives at `/versions/publish`.

That flow:

- checks shared session state and release-admin membership
- creates official version rows in `dd_version_list`
- optionally creates parent-child links in `dd_branch_map`
- uploads files to the `dd-official-releases` bucket
- stores published file metadata in `dd_version_files`

## Deployment notes

Before production deployment, make sure:

- Supabase env vars are configured
- the schema in `db/schema.sql` has been applied
- the required storage buckets exist
- matching storage and table policies are in place

If this app is hosted outside the Geeks Production Studio domain setup, the shared auth cookie behavior in `src/lib/supabase.ts` may need to be adjusted.
