# DeltaDash Platform PRD

## 1. Overview

DeltaDash Platform is evolving from a read-focused official release hub into a structured product + community platform. The next stage should support three connected capabilities:

1. stronger official version control and release management
2. staged community setup for mods, forks, and discussions
3. a closed-loop internal token economy for rewards and gated access

The goal is not just to add purchases. The platform should create a coherent loop where official releases, community contribution, and user progression support one another.

Initial intended loop:

- admins publish and manage official releases
- contributors submit community content
- admins review and optionally reward that content
- users spend tokens on official versions and selected mods
- the system keeps auditability, moderation control, and entitlement history

---

## 2. Product goals

### Primary goals
- Make official version management more structured and scalable.
- Open community participation gradually without losing moderation control.
- Introduce a token-based reward and purchase system with low abuse risk.
- Keep identity, access, and economic logic inside the existing Supabase-based platform.

### Secondary goals
- Make release relationships easier to understand for players.
- Give community creators a clear path to participate.
- Prepare for future contributor progression using reputation.
- Build a foundation for later missions, curator roles, and contributor applications.

---

## 3. Non-goals for MVP

These should not be part of the first implementation:
- real-money token purchases
- token transfer between users
- crypto or on-chain wallet integration
- open marketplace trading
- automatic token rewards for all community activity
- full mission system
- complex role hierarchy beyond current release-admin model
- direct open posting/publishing without review

---

## 4. Current state

### Current strengths
- Official releases already have structured data:
  - `db/schema.sql`
  - `src/lib/platform-data.ts`
  - `src/app/versions/page.tsx`
  - `src/components/version-tree.tsx`
- Admin-only official publishing already exists:
  - `src/app/versions/publish/page.tsx`
  - `src/components/release-publish-form.tsx`
  - `src/lib/supabase.ts`
- Shared Supabase SSO already exists and is reused across the ecosystem.
- Community routes already exist as product surfaces:
  - `src/app/mods/page.tsx`
  - `src/app/forks/page.tsx`
  - `src/app/community/page.tsx`

### Current limitations
- downloads are public and ungated
- no wallet, ledger, entitlement, or purchase model
- no review state for community content
- no submission UI for mods/forks/discussions
- no central ops dashboard
- version UI does not yet expose richer release control states

---

## 5. Users

### 5.1 Guests
Guests browse official releases, downloads, mods, forks, and discussions, but cannot purchase or submit content.

### 5.2 Signed-in users
Signed-in users can:
- view wallet/account state
- unlock paid official versions or approved paid mods
- submit community content
- see owned content and contribution history

### 5.3 Release admins
Release admins can:
- publish official versions
- manage release metadata and pricing
- review community submissions
- grant rewards and entitlements
- inspect economic activity

Release admin should initially reuse the current release-admin logic in `src/lib/supabase.ts:63` and `db/schema.sql:96`.

### 5.4 Authority and identity rules
The platform should use `public.profiles` as the authoritative source for role and exemption decisions.

- Approved developers are the only users allowed to publish official versions.
- Approved developers also receive cyan bold username styling on community authors now, and the same styling rule should be reused for future news/comments surfaces.
- DeltaDash-tagged testers are purchase-exempt.
- Approved developers are also purchase-exempt.
- Role resolution should be normalized in shared profile helpers so UI, access control, and pricing logic consume the same authority contract.

---

## 6. Product principles

### 6.1 Product-first
Community should support the Delta Dash product ecosystem, not become a detached social layer.

### 6.2 Reviewed participation first
Community creation should open through moderation workflows, not unrestricted publishing.

### 6.3 Separate trust from spendable value
Use spendable tokens and non-spendable reputation as separate systems.

### 6.4 Keep the economy closed-loop
The first version should stay fully internal to Supabase and platform logic.

### 6.5 Audit everything
Every purchase, reward, entitlement, and manual admin adjustment should be inspectable later.

---

## 7. Functional requirements

# 7.1 Official version control and release management

## Problem
The current release model is functional but light. It needs to support visibility, pricing, ownership state, and clearer branching/release presentation.

## Requirements
- Approved developers can define release access state.
- Each official version has a `first_purchase_token_price` for buying that version from scratch.
- Approved developers can define explicit source-version -> target-version transition prices.
- Transition prices are directional and separately configured for:
  - `upgrade`
  - `fallback`
- Transition pricing is not limited to parent-child branch relationships.
- Admins can control visibility state:
  - public
  - hidden
  - scheduled
- Admins can mark recommendation/highlight state for download surfaces.
- Release metadata should support more deliberate display on `/versions` and `/download`.
- Branch relationships should remain part of the release model and be surfaced more clearly in the UI.

## Data model changes
In `db/schema.sql`, extend `dd_version_list` with:
- `first_purchase_token_price`
- `visibility`
- `access_model`
- `purchase_enabled`
- `featured_order` or `recommended_rank`
- `release_date`
- optional summary/display helpers if needed

Add a dedicated directional pricing table for explicit source-version transitions:
- `dd_version_transition_prices`
  - `from_version_id`
  - `to_version_id`
  - `transition_type`
  - `token_price`

Reuse `dd_branch_map` for release tree structure only.

## UX expectations
On `src/app/versions/page.tsx`:
- show release tree
- show release status
- show first-purchase token price
- show explicit upgrade/fall-back paths into each version
- show ownership state where relevant
- prepare future linkage to community artifacts

On `src/app/download/page.tsx`:
- highlight recommended release
- show first-purchase token price
- show explicit upgrade/fall-back pricing paths where relevant
- show whether files are free or locked
- show unlock CTA for paid releases
- only expose actual paid file access after entitlement check

On `src/components/release-publish-form.tsx`:
- support first-purchase token price
- support explicit upgrade/fall-back transition price rows
- support visibility
- keep parent branch selection

---

# 7.2 Community setup

## Problem
Community surfaces already exist, but they are read-only and not yet organized into a contribution workflow.

## Requirements
The platform must support a staged community model:

### Stage 1
Read-only browsing:
- mods catalog
- fork catalog
- discussion archive

### Stage 2
Authenticated submission:
- mod submission
- fork submission
- later thread submission

### Stage 3
Admin review:
- approve
- reject
- add notes
- optionally reward

### Stage 4
Public availability:
- only approved items are visible publicly

## Route roles
- `/mods`: approved community mods, including future free/paid states
- `/forks`: approved ruleset branches tied to official versions
- `/community`: discussion linked to releases and mods

## Data model changes
Add review-state fields in `db/schema.sql`.

For `dd_mods`:
- `submission_status`
- `reviewed_by`
- `reviewed_at`
- `review_notes`
- `access_model`
- `token_price`
- `purchase_enabled`

For `dd_forks`:
- `submission_status`
- `reviewed_by`
- `reviewed_at`
- `review_notes`

For `dd_threads`:
- `submission_status`
- `reviewed_by`
- `reviewed_at`
- `review_notes`

## New routes
- `src/app/mods/submit/page.tsx`
- `src/app/forks/submit/page.tsx`
- later `src/app/community/submit/page.tsx`

## UI expectations
`src/components/workshop.tsx` should evolve into a reusable community entry surface for:
- submission CTA
- creator messaging
- future review status or reward messaging

---

# 7.3 Wallet, reputation, and economy

## Problem
There is no internal economy model yet.

## Requirements
Introduce two balances:

### Spendable balance
- `token_balance`
- used for purchases

### Trust/progression balance
- `reputation_balance`
- used for future unlocks, contributor ranking, and moderation trust

## Economy rules for MVP
- tokens are non-transferable
- no real-money top-up
- no automatic token rewards
- all rewards are admin-issued manually
- purchases allowed for official versions and selected approved mods
- forks are not sold in MVP
- discussions do not auto-earn tokens in MVP

## New tables
In `db/schema.sql`:
- `dd_wallets`
- `dd_ledger_entries`
- `dd_version_purchases`
- `dd_version_entitlements`
- `dd_mod_purchases`
- `dd_mod_entitlements`

## Ledger requirements
Every balance change must create a ledger entry with:
- user
- currency type
- amount
- reason/type
- source type
- source id
- admin actor if manual

## RPC/function requirements
Add SQL functions for:
- wallet bootstrap
- version purchase
- mod purchase
- admin adjustment
- entitlement grant

---

# 7.4 Gated access and downloads

## Problem
Current assets are public URLs, which is incompatible with paid access.

## Requirements
- Free assets may remain public.
- Paid official release assets must move to gated/private storage.
- Paid mod assets must use gated delivery.
- Entitlement must be checked before issuing access.

## Storage expectations
Keep:
- free official assets in `dd-official-releases`

Add:
- private paid official assets bucket
- private paid mod bucket if needed

## Delivery expectations
- paid content should use signed URL generation after entitlement validation
- metadata may remain visible even when file access is gated

---

# 7.5 Manual reward and review workflow

## Problem
User wants manual-only reward issuance in phase 1.

## Requirements
- Admin reviews each contribution manually.
- Admin may approve/reject without reward.
- Admin may grant token reward, reputation reward, or both.
- Reward must be logged in ledger.
- Reward should not be applied twice accidentally.

## Supported reviewed content for MVP
- mods
- forks

## Lower-priority reviewed content
- threads/discussions

---

# 7.6 Ops dashboard

## Problem
Admin actions will become fragmented across release publishing, submission review, and manual wallet operations.

## Requirements
Add an internal ops route:
- `src/app/admin/community/page.tsx` or `src/app/ops/page.tsx`

Capabilities:
- review pending mods
- review pending forks
- later review pending threads
- inspect release pricing/access state
- inspect purchases
- grant/revoke entitlements
- manually adjust balances with required reason
- inspect recent ledger activity

---

## 8. User stories

### Official release management
- As an admin, I want to publish a version with pricing and visibility settings so that official releases can be controlled consistently.
- As a player, I want to see which official versions are free or paid before I try to download them.
- As a player, I want to know whether I already own a release.

### Community setup
- As a signed-in user, I want to submit a mod for review.
- As a signed-in user, I want to submit a fork tied to an existing version.
- As an admin, I want to approve or reject community submissions before they are public.

### Rewards and purchases
- As an admin, I want to manually reward approved community work with tokens or reputation.
- As a signed-in user, I want to spend tokens on an official release.
- As a signed-in user, I want to spend tokens on an approved paid mod.
- As a signed-in user, I want to see my balances and owned content.

---

## 9. Success criteria

### Product success
- admins can manage release access states
- users can distinguish free vs paid releases
- users can submit mods/forks
- admins can review submissions
- manual rewards can be issued safely
- users can unlock official releases and selected mods
- wallet/history is understandable

### Safety success
- no duplicate entitlement on repeat purchase attempts
- no negative balances
- no public access to gated paid files
- no unapproved community content visible publicly
- no self-reward path for contributors

---

## 10. MVP phase plan

### Phase 1
Version control expansion:
- richer release metadata
- pricing fields
- visibility fields
- version tree improvements
- publish form expansion

### Phase 2
Economy primitives:
- wallet
- ledger
- purchases
- entitlements
- SQL functions
- RLS updates

### Phase 3
Paid release access:
- gated official downloads
- ownership-aware `/versions` and `/download`

### Phase 4
Community foundation:
- submission states
- approved-only reads
- submission routes
- community IA improvements

### Phase 5
Reward + paid mod loop:
- admin review flows
- manual reward issuance
- approved paid mods
- wallet page

### Phase 6
Ops dashboard:
- review queue
- economy operations
- release oversight

---

## 11. Technical touchpoints

### Existing files most likely to change
- `db/schema.sql`
- `src/lib/types.ts`
- `src/lib/platform-data.ts`
- `src/lib/supabase.ts`
- `src/app/versions/page.tsx`
- `src/components/version-tree.tsx`
- `src/app/download/page.tsx`
- `src/components/release-publish-form.tsx`
- `src/app/mods/page.tsx`
- `src/app/forks/page.tsx`
- `src/app/community/page.tsx`
- `src/components/workshop.tsx`

### New likely routes
- `src/app/wallet/page.tsx`
- `src/app/mods/submit/page.tsx`
- `src/app/forks/submit/page.tsx`
- `src/app/admin/community/page.tsx` or `src/app/ops/page.tsx`

---

## 12. Verification

### DB checks
- wallet auto-creation works
- purchase flow is atomic
- duplicate purchases do not double-charge
- rewards write correct ledger entries
- pending/rejected content is filtered from public reads

### UI checks
- guest browsing priced content
- signed-in purchase state
- owned state rendering
- admin release pricing flow
- admin review flow
- wallet history visibility

### End-to-end checks
- `npm run lint`
- targeted lint while iterating
- `npm run dev`
- manual browser verification for guest, user, admin
- signed URL checks for paid assets

---

## 13. Future extensions

Not MVP, but prepared by this design:
- missions
- contributor tiers
- curator applications
- reputation-based privileges
- featured creator programs
- limited promotional grants
- eventual token top-up or external payment models
