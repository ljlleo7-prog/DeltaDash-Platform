# Delta Dash Platform

This repository contains the Next.js platform app for Delta Dash. It is the bilingual release and community hub for official downloads, version history, mods, forks, discussions, and structured rules.

> This is the `deltadash-platform` Next.js app, not the older Create React App project in the parent directory.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase
- GitHub Pages static export

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

- Routes live under `src/app` and now render as static shells backed by client-side Supabase queries.
- `src/app/layout.tsx` applies the shared shell, fonts, and top-level page chrome.
- `src/components/app-shell.tsx` centralizes navigation, auth status, and language switching.
- `src/components/language-provider.tsx` persists the active language on the client and updates the document `lang` attribute after hydration.
- `src/lib/platform-data.ts` maps Supabase rows into UI-friendly shapes used by the routes.
- `src/lib/i18n.ts` handles bilingual content and client-side language selection.
- `src/lib/supabase.ts` contains shared-session auth helpers, release-admin checks, and official file upload helpers.
- `db/schema.sql` is the source-of-truth snapshot for the current MVP schema and storage expectations.

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

Build the static export:

```bash
npm run build
```

Lint the codebase:

```bash
npm run lint
```

Run the local predeploy checks:

```bash
npm run deploy
```

## Environment variables

The app expects the following public Supabase environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_ORIGIN=https://deltadash.geeksproductionstudio.com
NEXT_PUBLIC_SHARED_COOKIE_DOMAIN=.geeksproductionstudio.com
NEXT_PUBLIC_LOGIN_ORIGIN=https://geeksproductionstudio.com
```

If these are missing:

- public Supabase-backed content will render as empty states
- shared auth lookups will fail closed
- official release publishing will not work

## Authentication and localization notes

### Shared SSO behavior

Authentication is designed to share Supabase session cookies with the main Geeks Production Studio domain. The browser-side auth storage in `src/lib/supabase.ts` is configured through `NEXT_PUBLIC_SHARED_COOKIE_DOMAIN`, which should be set to `.geeksproductionstudio.com` in production.

That means:

- production auth assumes the Geeks Production Studio domain model
- local development on plain `localhost` may not fully mirror cross-subdomain session behavior unless you deliberately set the shared cookie domain
- GPS login redirects are expected to return users back into this app after sign-in via `NEXT_PUBLIC_LOGIN_ORIGIN`
- GitHub Pages hosting must use the custom domain `deltadash.geeksproductionstudio.com` so the shared cookie scope remains valid

Release publishing access is restricted to approved developer profiles.

### Language model

The current language is stored client-side and mirrored into the `deltaDashLanguage` cookie. Supported values:

- `zh`
- `en`

Many database fields are stored as localized JSON objects shaped like:

```json
{ "zh": "...", "en": "..." }
```

Do not assume user-facing text fields are plain strings.

## Database and storage setup

The current schema snapshot lives in `db/schema.sql`.

For manual environment updates, create and run a new rerunnable file under `db/migrations/`. Migration files must stay scoped to dd-owned objects plus `public.dd_is_release_admin()`.

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
- writes explicit transition pricing into `dd_version_transition_prices`
- uploads files to the `dd-official-releases` bucket
- stores published file metadata in `dd_version_files`

## Deployment notes

This app is intended to be published at:

- `https://deltadash.geeksproductionstudio.com/`

The deployment target is GitHub Pages with a custom domain, not a `github.io/<repo>` subpath deployment.

### Manual deploy

```bash
npm run deploy
```

This command will:

- run lint
- build the static export into `out/`
- create `out/.nojekyll`
- emit `out/CNAME` for `deltadash.geeksproductionstudio.com`
- push the contents of `out/` to the `gh-pages` branch

It does not rely on an automatic GitHub Actions deploy workflow, so publishing stays under direct local control.

### GitHub Pages configuration

In GitHub repository settings:

- set Pages to deploy from the `gh-pages` branch
- set the custom domain to `deltadash.geeksproductionstudio.com`
- keep DNS pointing at GitHub Pages for that hostname

### Production expectations

Before deployment, make sure:

- local environment variables are set before running `npm run deploy`
- `NEXT_PUBLIC_SUPABASE_URL` is available locally
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is available locally
- `NEXT_PUBLIC_APP_ORIGIN` stays `https://deltadash.geeksproductionstudio.com`
- `NEXT_PUBLIC_SHARED_COOKIE_DOMAIN` stays `.geeksproductionstudio.com`
- `NEXT_PUBLIC_LOGIN_ORIGIN` stays `https://geeksproductionstudio.com`
- the required schema/migrations have been applied
- the required storage buckets exist
- matching storage and table policies are in place
- you are authenticated for pushing to the repository from this machine

Verification after deploy:

- open `https://deltadash.geeksproductionstudio.com/`
- confirm deep links like `/versions/`, `/download/`, and `/rules/` load directly
- confirm Supabase-backed content appears after hydration
- confirm login redirects through `https://geeksproductionstudio.com/login`
- confirm approved developer accounts can access `/versions/publish/`
- confirm official release uploads still land in `dd-official-releases`

If this app is hosted outside the Geeks Production Studio domain setup, the shared auth cookie behavior in `src/lib/supabase.ts` will need different environment values.
