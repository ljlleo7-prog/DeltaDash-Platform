# Delta Dash 2026 Rules Interpretation for a Local-First Online System

## Scope and Non-Goals

This document is an interpretation draft only. It translates the tabletop rulebook (`Rules4.0-CN.pdf`) into engine-facing concepts for a possible local-first online Delta Dash game system.

**Not in scope for this document:**
- Gameplay implementation code
- UI or content ingestion
- Database schema changes
- Final card balance or numerical tuning

## Source and Assumptions

- Source: `Rules4.0-CN.pdf` (Delta Dash 2026 rulebook, Chinese)
- Ambiguities are resolved in favor of deterministic multiplayer execution
- Where the rulebook describes a tabletop procedure, this document proposes the equivalent digital state transition
- All state changes are assumed to be event-driven and replayable from a turn log

---

## Core Local-First Design Principles

1. **Event log first, derived state second.** The authoritative record is a sequence of events. All visible state (rank, energy, relationships) is derived by replaying that log.
2. **Local simulation must be reproducible.** Given the same event log and the same seed, every client must reach the same state.
3. **Sync-sensitive choices need explicit lock/ready/response windows.** No state advances until all required players have committed or a timeout fires.
4. **Rule conflicts use documented priority order.** The engine never silently resolves ambiguity — it applies the rulebook's stated priority sequence and records the resolution as an event.

---

## Canonical Entities

| Entity | Description |
|---|---|
| `Match` | One complete race session, from setup to final scoring |
| `Player` | A human participant controlling one car (or two in team mode) |
| `Car` | The primary game object: holds energy, tire durability, focus, specialization, and card zones |
| `Track` | Metadata for the current circuit: lap count, weather, pit availability, hazard triggers |
| `Card` | An action unit with type, cost, effect, and timing constraints |
| `CardZone` | One of: hand, deployment zone, activated/resolving, discard |
| `Steward` | Arbitration layer that validates legality and applies mandatory penalties |
| `Flag` | A race-wide state modifier (yellow, VSC, SC, blue, red, black-white, black) |
| `Incident` | A collision event between two or more cars with severity and outcome |
| `Scoring` | Final points distribution derived from finish order and any penalties |

---

## Match Setup Interpretation

### Rulebook Summary

The physical game contains action cards, tactic cards, car boards, command tokens, track maps, dice, inspection sheets, and other race-management components. A match starts by selecting a private track, assigning or cycling a steward, initializing track/weather data, and setting each player's car board.

### Digital Interpretation

The online system should treat setup as a deterministic initialization transaction:

1. Create a `Match` with player seats and optional steward role.
2. Select `Track` metadata.
3. Initialize weather, lap count, pit rules, and event tables from track data.
4. Create one `Car` per player.
5. Initialize each car's energy, tire durability, specialization/focus limits, position, hand, and deck/discard references.
6. Draw starting hand cards and action cards using a shared seed.
7. Emit `MatchInitialized` as the first event.

### Required State

- `matchId`
- `rulesVersion`
- `trackId`
- `randomSeed`
- `roundNumber`
- `phase`
- `players[]`
- `cars[]`
- `deckState`
- `weatherState`
- `flagState`
- `stewardSeat`

### Local-First Sync Concerns

Setup must be agreed before gameplay begins. Track choice, seed, player order, and steward assignment must be locked in the event log so reconnecting clients can reconstruct the same decks, draws, and initial weather.

---

## Round Lifecycle

### Rulebook Summary

A round contains preparation, player action/deployment, data update, and cleanup/recovery steps. The game repeatedly advances through these rounds until the race ends.

### Digital Interpretation

Use a strict phase machine:

1. `RoundPreparation`
   - Track chart countdown or lap updates.
   - Weather update.
   - Each player draws one tactic card and one action card.
   - Normal energy recovery and forward movement are applied.
   - Wheel-to-wheel, straight mode, and overtake mode checks occur.
2. `ActionCommit`
   - Players deploy cards from hand to deployment zones.
   - Players choose legal actions such as pit, tire recovery, draw, card transfer, or special operations.
   - Inputs are hidden or provisional until locked.
3. `RevealAndResolve`
   - Deployment zones are revealed.
   - Legal cards activate by priority.
   - Illegal or failed-condition cards return or discard according to the card's rule.
   - Attack/defense/release response windows are opened as needed.
4. `DataUpdate`
   - Apply energy, tire, focus, card, penalty, and movement effects.
   - Recompute time delta, rank, and relationships.
   - Evaluate incidents, flags, pit status, retirement, finish, and scoring triggers.
5. `Cleanup`
   - Discard resolved cards.
   - Recover eligible cards or resources.
   - Advance to the next round unless the match ends.

### Required Events

- `RoundStarted`
- `WeatherUpdated`
- `CardsDrawn`
- `PassiveRecoveryApplied`
- `PlayerActionCommitted`
- `PlayerActionRevealed`
- `CardActivated`
- `ResponseWindowOpened`
- `ResponseSubmitted`
- `StateUpdateApplied`
- `RoundEnded`

---

## Mechanism Interpretations

### Energy System

#### Rulebook Meaning

Energy is used to gain speed, defend, release extra movement, and support card or skill effects. The rulebook describes normal release, extra release, recovery, a recovery upper bound, and cases where energy release may be interrupted or skipped.

#### Digital Interpretation

Energy should be a bounded numeric resource on each `Car`. The system should distinguish:

- `currentEnergy`: spendable energy
- `maxRecoverableEnergy`: upper bound after ordinary recovery, shown as 4MJ in the rulebook text
- `pendingEnergySpend`: energy committed during a response or release window before resolution
- `releasedEnergyThisRound`: used for movement conversion and cap checks

Energy changes should never be edited directly by UI. They should be produced by events such as `EnergyRecovered`, `EnergyReleased`, `EnergySpentForDefense`, or `EnergySpendCancelled`.

#### Event / Update Rules

- Normal preparation release consumes 1MJ and gives a default forward movement effect.
- Extra release converts additional energy into extra movement: 1MJ, 2MJ, 3MJ, and 4MJ have distinct movement values.
- If a player lacks energy for a declared spend, the action is illegal and should not enter the event log.
- If an effect interrupts release, the event log should contain the attempted release and the cancelling effect.
- Recovery must obey the recovery upper bound unless a card explicitly overrides it.

#### Local-First Sync Concerns

Energy is highly conflict-sensitive because response cards and defense can spend energy during another player's action. Use response windows and pending spends so all clients resolve the same final energy total.

#### Open Questions

- Whether the 4MJ recovery cap is a hard global cap or only a normal-recovery cap.
- Whether failed release attempts refund all energy or only the interrupted portion.

---

### Position and Time delta System

#### Rulebook Meaning

Position includes rank, relative distance, front/back relationships, straight mode, overtake mode, and wheel-to-wheel status. Some actions depend on being ahead, behind, within seconds, or in the same grid/relationship state.

#### Digital Interpretation

Do not store rank as the primary source of truth. Store absolute time delta and derive rank.

Suggested model:

```ts
type CarTime delta = {
  lap: number
  distanceSeconds: number
  sector?: string
  retired: boolean
}
```

Derived values:

- `rank`: sorted by lap and time delta
- `deltaToFront`: difference from the next car ahead
- `deltaToBehind`: difference from the next car behind
- `isWheelToWheel`: true when cars occupy the same relationship slot
- `canOvertake`: true when distance and phase predicates allow overtake mode
- `isInStraightMode`: true when track region and phase predicates allow straight mode

#### Event / Update Rules

- Movement effects update absolute time delta.
- Rank is recomputed after all simultaneous movement is applied.
- If two cars become equal or overlapping, create or update wheel-to-wheel state.
- If a car is forced backward, recompute relationships after the forced movement.
- Name-lock or no-overtake effects should restrict movement legality, not mutate rank directly.

#### Local-First Sync Concerns

All clients must use the same sorting and tie-breaker rules. Tie-breakers should be explicit: lap, time delta, same-position comparison, delta values, then prior order or priority rule.

#### Open Questions

- The exact unit of time delta should be confirmed: seconds, grid cells, sectors, or hybrid.
- The rulebook uses both time delta and table position language; the engine should pick one canonical storage form.

---

### Card Deployment and Activation

#### Rulebook Meaning

Players have hand cards, deploy cards to a deployment zone, activate condition cards, use action cards, use tactic cards, and recover cards if deployment conditions are not met. Some cards can be played directly from hand in response to triggers.

#### Digital Interpretation

Use explicit card zones:

- `deck`
- `hand`
- `deploymentZone`
- `revealed`
- `resolving`
- `discard`
- `removed`

Card records should include:

- `cardId`
- `ownerCarId`
- `type`: action, tactic, response, stage effect, global effect
- `timingWindow`
- `activationCondition`
- `priority`
- `cost`
- `effect`
- `targetRules`

#### Event / Update Rules

1. During action commit, players may place eligible cards into deployment zones.
2. A committed deployment creates `CardDeployed` but does not immediately reveal hidden content unless the card is public.
3. During reveal, activation conditions are checked.
4. If conditions pass, emit `CardActivated` and resolve by priority.
5. If conditions fail, emit `CardActivationFailed` and apply recovery/discard rules.
6. Response cards can be played from hand only during their response window.
7. Card priority uses the rulebook principle: larger card number means higher priority where card priority is being compared.

#### Local-First Sync Concerns

Hidden deployment and simultaneous reveal require commitment. A local-first version should commit to card IDs before reveal, ideally with concealed commitments if cheating prevention matters online.

#### Open Questions

- Whether all deployment cards are hidden until reveal or some are public on placement.
- Whether failed activation returns to hand or discard is card-specific or globally defined.

---

### Attack, Defense, Release, and Recovery

#### Rulebook Meaning

Attacks can target opponents within a time range. Defenders can cancel attacks using defense cards, and both sides can release energy under defined conditions. Recovery allows cards or resources to return under certain circumstances.

#### Digital Interpretation

Represent attack resolution as a nested state machine:

1. `AttackDeclared`
2. Validate target relationship and range.
3. Open `DefenseResponseWindow` for the target.
4. Target may submit defense card and/or energy release.
5. Attacker may have follow-up effects if the card permits.
6. Resolve outcome.
7. Apply movement, energy, card, tire, or penalty effects.
8. Close window and continue priority resolution.

#### Required State

- Current action stack
- Acting car
- Target car(s)
- Response window participants
- Pending spends
- Pending cards
- Attack success/failure result

#### Local-First Sync Concerns

Response windows must be deterministic and bounded. The engine should know who is allowed to respond and should not advance until all required responses are submitted or a timeout policy resolves the window.

---

### Track, Rank, and Relationship System

#### Rulebook Meaning

Track data controls time deltaion, weather, pit behavior, lap count, rank updates, and track-specific effects. Rank and relationships decide legal targets, overtakes, and flag/incident outcomes.

#### Digital Interpretation

Track metadata should be treated as static match configuration:

```ts
type TrackConfig = {
  id: string
  lapCount: number
  weatherTable: string
  pitRules: string
  sectorRules: string[]
  incidentTables: string[]
  finishScoring: number[]
}
```

Relationships should be derived predicates:

- `isAheadOf(a, b)`
- `isBehind(a, b)`
- `isWithin(a, b, seconds)`
- `isOverlapping(a, b)`
- `isWheelToWheel(a, b)`
- `isLappedBy(a, b)`
- `canAttack(a, b)`
- `canDefendAgainst(a, b)`
- `canOvertake(a, b)`

#### Event / Update Rules

- Track state updates before player action each round.
- Relationship predicates update after movement and forced-position effects.
- Rank-dependent effects should use the latest derived rank at their timing point.
- If an effect references rank at declaration time, store the target snapshot in the event.

---

### Flags and Incidents

#### Rulebook Meaning

The rulebook includes yellow flag, VSC, safety car, blue flag, red flag, black-white flag, black flag, and collision severity. Flags impose temporary race restrictions, movement effects, or penalties.

#### Digital Interpretation

A flag is a race modifier with trigger, duration, restrictions, and cleanup behavior.

```ts
type FlagState = {
  type: 'yellow' | 'vsc' | 'safety-car' | 'blue' | 'red' | 'black-white' | 'black'
  triggeredBy?: string
  affectedCars: string[]
  remainingRounds?: number
  restrictions: string[]
}
```

#### Event / Update Rules

- Yellow flag: triggered by a specified incident segment; cars in that segment retreat or slow according to the rulebook.
- VSC: all cars ignore normal forward/backward effects during its duration, with no overtake effect.
- Safety car: cars outside a defined distance from the front car are forced forward, then normal overtaking is forbidden.
- Blue flag: lapped-player logic; if a player is lapped and near the lapping car, swap/allow pass according to the rulebook.
- Red flag: race suspension/restart behavior; the match can skip a small number of laps after restart.
- Black-white flag: warning/penalty state that forces retreat if the violation is executed.
- Black flag: disqualification/removal after severe or repeated violations.

Incidents should be explicit events:

- `LightCollision`
- `MediumCollision`
- `HeavyCollision`
- `Retirement`
- `PenaltyApplied`

#### Local-First Sync Concerns

Incidents and flags often depend on simultaneous movement. Evaluate them only after all movement for the timing window is resolved, then emit a single ordered incident/flag event batch.

#### Open Questions

- Whether flag durations count the triggering round or start from the next round.
- Whether red-flag restart skips laps before or after scoring/position updates.

---

### Steward Responsibilities

#### Rulebook Meaning

The steward maintains fair play, interprets rules, controls track state, handles abnormal conditions, and helps players perform data updates.

#### Digital Interpretation

The system should implement the steward as an engine layer first and a human role second.

Engine steward responsibilities:

- Validate action legality.
- Enforce phase order.
- Apply priority order.
- Detect invalid targets or illegal card timing.
- Apply mandatory penalties.
- Emit incident and flag events.
- Resolve deterministic tie-breakers.

Human steward responsibilities, if kept:

- Start/pause match.
- Handle social disputes.
- Override only with logged administrative events.
- Confirm ambiguous tabletop-only cases.

#### Local-First Sync Concerns

Human steward overrides must be logged as explicit events so all clients converge.

---

## Data Update Order

The engine-facing update order should be:

1. Lock all required player inputs.
2. Reveal committed cards/actions when the phase allows.
3. Validate legality.
4. Resolve global round/flag effects.
5. Resolve card and action priority.
6. Open and close response windows.
7. Apply energy, tire, focus, and card effects.
8. Apply time delta/movement changes.
9. Recompute rank.
10. Recompute relationship predicates.
11. Evaluate incidents and flags.
12. Apply penalties, forced movement, or retirement.
13. Check pit, finish, scoring, and match end.
14. Cleanup cards and temporary effects.

This order prevents rank or relationship effects from being computed against partially updated state.

---

## Player Actions by Phase

### Preparation Phase

Possible actions/events:

- Draw tactic card.
- Draw action card.
- Recover energy.
- Apply normal movement.
- Update weather and track charts.

### Action Commit Phase

Possible actions:

- Deploy one or more eligible cards.
- Declare pit entry if legal.
- Recover tire durability if allowed.
- Draw cards if allowed.
- Transfer/give a card if allowed.
- Use a legal car part or special ability.

### Response Windows

Possible responses:

- Defend against an attack.
- Release energy to modify movement or defense.
- Play response cards from hand.
- React to collision, flag, or steward trigger if a card allows.

### Cleanup Phase

Possible actions/events:

- Discard resolved cards.
- Return failed-condition cards if the rule allows.
- Remove expired temporary effects.
- Advance round.

---

## Match End, Tie-Breakers, and Scoring

### Rulebook Meaning

The match ends after the final round/lap condition. Final standings compare completed laps, position/delta, and tie-breakers. Points are awarded from first to eighth as 25, 15, 10, 6, 2, 0, 0, 0.

### Digital Interpretation

Finish order should be derived from final time delta state, then adjusted by penalties or disqualifications.

Suggested ranking comparison:

1. More completed laps wins.
2. If equal, greater time delta/delta wins.
3. If still equal, compare exact delta values.
4. If fully equal, apply the rulebook's tie flow: same lap and same delta may become a first-hand advantage or prior-order comparison depending on context.
5. Retired/disqualified cars are ranked according to retirement/disqualification rules, not ordinary time delta.

### Required Events

- `FinishDetected`
- `FinalClassificationComputed`
- `PenaltyAdjustedClassification`
- `PointsAwarded`
- `MatchEnded`

---

## Retirement Compensation

### Rulebook Meaning

Retirement is not fun in a long tabletop match, so the rulebook allows optional compensation mechanisms such as repair/re-entry, safety-time behavior, or emergency repair under constraints.

### Digital Interpretation

Retirement should be a state, not just deletion.

Suggested states:

- `active`
- `damaged`
- `retiredPendingCompensation`
- `rejoining`
- `retiredFinal`
- `disqualified`

Compensation choices should be modeled as optional post-retirement actions:

- repair and re-enter after a delay
- safety-time reset with card loss or reduced resources
- emergency repair with limited timing and restricted target condition

### Local-First Sync Concerns

Retired players may still interact with the match UI. Their remaining legal choices must be explicit so clients do not disagree about whether they can act.

---

## Team Mode

### Rulebook Meaning

Team mode lets each player manage two car roles as different driver entities. Each car has separate boards, hands, focus/specialization, and actions, while the player performs both roles.

### Digital Interpretation

Team mode should not change the core engine. It should change ownership:

```ts
type Player = {
  id: string
  controlledCarIds: string[]
}
```

Each car remains an independent `Car` with its own:

- time delta
- energy
- tire durability
- hand
- deployment zone
- penalties
- scoring contribution

Team-mode differences:

- One player may submit actions for two cars.
- A round may allow simultaneous operation of both controlled cars.
- Each car can use only its own hand/card resources unless a rule explicitly allows sharing.
- Friendly targeting and penalties must identify whether they apply to one car or the controlling player.

### Open Questions

- Whether team scoring sums both cars or still ranks each car individually.
- Whether one controlled car exceeding a limit affects the other car.

---

## Timed Race Mode

### Rulebook Meaning

Timed race mode has no fixed lap count. The match begins at a fixed time, and when time reaches the threshold, the next round becomes the final round. This tests random-response ability.

### Digital Interpretation

Timed race should be a match-end condition layered onto the same round lifecycle.

Suggested state:

```ts
type TimedRaceState = {
  enabled: boolean
  startedAt: string
  durationSeconds: number
  finalRoundDeclared: boolean
}
```

Rules:

1. Timer starts when the first round begins.
2. At or after the threshold, emit `FinalRoundDeclared`.
3. The current or next round becomes final according to the selected interpretation.
4. Scoring uses the ordinary final classification algorithm.

### Open Questions

- Whether time expiry makes the current round final or the following round final.
- Whether paused steward time counts against the timer.

---

## Local-First State Model

### Authoritative State

Persist these through the event log:

- Match configuration
- Player seats and controlled cars
- Track configuration
- Random seed and deck order
- Card zone movements
- Player commitments
- Energy spends/recovery
- Movement effects
- Penalties
- Flag and incident triggers
- Steward overrides
- Final scoring

### Derived State

Recompute these from authoritative state:

- Current rank
- Front/back relationships
- Delta to nearby cars
- Legal action list
- Legal target list
- Active response participants
- Finish order preview

### Event Types

Core events should include:

- `MatchInitialized`
- `RoundStarted`
- `WeatherUpdated`
- `CardsDrawn`
- `EnergyRecovered`
- `CardDeployed`
- `PlayerActionCommitted`
- `CommitmentsLocked`
- `CardRevealed`
- `CardActivated`
- `ResponseWindowOpened`
- `ResponseSubmitted`
- `EnergyReleased`
- `MovementApplied`
- `RankRecomputed`
- `IncidentTriggered`
- `FlagTriggered`
- `PenaltyApplied`
- `CarRetired`
- `CompensationSelected`
- `RoundEnded`
- `FinalRoundDeclared`
- `MatchEnded`

---

## Open Questions and Ambiguities

1. The canonical time delta unit should be confirmed: seconds, grids, sectors, or a hybrid.
2. Some card recovery rules may be card-specific; the engine needs card metadata before finalizing zone movement.
3. The exact timing of flag duration countdowns should be confirmed.
4. Red-flag restart behavior needs a precise digital interpretation.
5. Team-mode scoring and cross-car penalties need confirmation.
6. Timed-race final-round timing needs confirmation.
7. Hidden deployment anti-cheat requirements are product-dependent. Local-first friendly play can rely on trust, but competitive online play needs commitments.

---

## Future Mapping to Platform Content

This document can later be split into structured `dd_rule_sections` rows for the existing `/rules` page.

Suggested section slugs:

- `match-setup`
- `round-flow`
- `energy`
- `position-time delta`
- `cards`
- `attack-defense-response`
- `track-rank-relationships`
- `flags-incidents`
- `steward`
- `data-update-order`
- `scoring`
- `retirement-compensation`
- `team-mode`
- `timed-race`
- `local-first-state-model`

Because `RuleSection.content` is currently localized plain text, this markdown should remain the richer source artifact until the content is condensed for the web UI.
