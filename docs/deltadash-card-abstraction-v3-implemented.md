# Delta Dash 4.0 Card Abstraction - v3 Current Implementation

This document records the current card implementation after the direct `timeDelta` conversion and action/tactic logic reconciliation.

The active engine uses continuous seconds-based `timeDelta` values only. Legacy point/grid movement units are not used in source logic.

---

## Core resolution model

- Cars store absolute `timeDelta` in seconds.
- Ranking, finish checks, target windows, and timeline placement derive from `timeDelta`.
- Cards resolve through committed events, then named card handlers or primitive effects produce `DeltaDashResolvedAction` objects.
- Multiple card plays per car are supported up to 3 slots per round.
- Card targets are normalized before commitment and again before resolution.
- Default no-card action still resolves as Steady unless suppressed by a round modifier.

---

## Prototype bridge actions

| Card | Current implementation |
|---|---|
| Steady | `+1.5s`, `+1 energy`, `-1 tire`; under yellow/speed cap uses `+1.0s`. |
| Push | Requires at least 2 energy and no yellow/speed cap. Applies `+2.5s`, `-2 energy`, `-2 tire`; otherwise falls back to Steady. |
| Defend | `+1.0s`; conservative base action. |
| Recover | `+0.5s`, `+2 energy`, `+1 tire`. |

---

## Action cards

### 攻 (Attack)

| Field | Current implementation |
|---|---|
| Priority | **5** |
| Targeting | `opponent`, time gap range `0.0s-1.0s` in front |
| Conditions | `not_retired` |
| Effects | Target backs away 0.5s, player goes forward 0.5s. |

**Status:** Implemented as close-range time-delta pressure.

---

### 防 (Defend)

| Field | Current implementation |
|---|---|
| Priority | **X** |
| Targeting | `none` |
| Conditions | `not_retired` |
| Effects | expires the Attack targeting the player. |

**Status:** Implemented as a result guard. Defend cancels defendable incoming effects, but does not cancel `Slaughter All Sides`.

---

### 释放 (Release / Discharge)

| Field | Current implementation |
|---|---|
| Priority | **3** |
| Targeting | `self` |
| Conditions | `not_retired`, `min_energy: 1` |
| Effects | `-X energy` until 0, forward `X s`. |

**Status:** Implemented as energy release with a small direct time-delta gain.

---

### 烧胎 (Burn Tires)

| Field | Current implementation |
|---|---|
| Priority | **3** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects |  doubling tire degradation and goes forward 1.5s |

**Status:** Implemented as pushing tire limits.

---

### 保胎 (Protect Tires)

| Field | Current implementation |
|---|---|
| Priority | **1** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | backward `1.5s`, applies `no-tire-wear` for the round. |

**Status:** Implemented as fallback in exchange for zero tire degradation that round.

---

### 回收 (Recycle / Recover)

| Field | Current implementation |
|---|---|
| Priority | **1** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | `+1 energy` capped at 4; applies `no-normal-release-next-round`. |

**Status:** Implemented. The next round converts the penalty into `no-normal-release`, suppressing default no-card harvest once.

---

## Tactic cards

### 大杀四方 (Slaughter All Sides)

| Field | Current implementation |
|---|---|
| Priority | **6** |
| Targeting | `self` |
| Conditions | `not_retired`, `min_energy: 1` |
| Effects | Consumes all battery, advances by current energy in seconds, and suffer from 1-3 focus loss from opponents passed during that window. |

**Status:** Implemented as an all-in burst. Defend does not cancel it.

---

### 曲线救国 (Roundabout Rescue)

| Field | Current implementation |
|---|---|
| Priority | **X** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | backward `2.0s`, push back opponents in the way of fallback |

**Status:** Implemented as fallback. The full path-push behavior is not first-class yet because path traversal is not modeled separately from `timeDelta`.

---

### 先手夺阵 (First-Move Seize Position)

| Field | Current implementation |
|---|---|
| Priority | **2** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | grab one card of any kind. |

**Status:** Implemented as fetching an additional card.

---

### 热能回收 (MGU-H Recovery)

| Field | Current implementation |
|---|---|
| Priority | **2** |
| Targeting | `self` |
| Conditions | `not_retired`, has hand cards |
| Effects | Gain X energy, using X hand cards for this exchange |

**Status:** Implemented as hand-count-based energy recovery. Actual card discard cost is not first-class yet.

---

### 渔翁得利 (Fisherman's Profit)

| Field | Current implementation |
|---|---|
| Priority | **4** |
| Targeting | `opponent` |
| Conditions | `not_retired`, self has energy, at least two opponents are ahead and in wheel-to-wheel status |
| Effects | Self loses 1 energy, then self and target swap absolute time-delta positions. |

**Status:** Implemented with a board-state approximation for multi-party confrontation.

---

### 死守狮防 (Steadfast Lion Defense)

| Field | Current implementation |
|---|---|
| Priority | **X** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | Applies `steadfast-defense` and suppresses no-card harvest. |

**Status:** Implemented as persistent (can remove) deployed defense. While active, it blocks hostile negative time-delta effects and suppresses default no-card harvest.

---

### 听不清楚 (Can't Hear Clearly)

| Field | Current implementation |
|---|---|
| Priority | **X** |
| Targeting | `opponent` committed to a tactic card |
| Conditions | `not_retired`, target committed a tactic this round |
| Effects | Marks the target tactic as countered and removes that tactic's resolved effects. |

**Status:** Implemented during resolution rather than through an interactive response stack.

---

### 小曲之力 (Power of the Little Tune)

| Field | Current implementation |
|---|---|
| Priority | **2** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | Gains deterministic 1-4 focus, capped at 4. |

**Status:** Implemented with deterministic tune value until dice/random command support exists.

---

### 狂泽犯境 (Rookie Invasion)

| Field | Current implementation |
|---|---|
| Priority | **6** |
| Targeting | `all-opponents` |
| Conditions | `not_retired` |
| Effects | Opponents that do not answer with an action/response card or Defend or deploy lose 2 focus. |

**Status:** Implemented as forced-answer pressure. Separate defense-lock state is not first-class yet.

---

### 计划有变 (Plan Changed)

| Field | Current implementation |
|---|---|
| Priority | **2** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | Change X hand-cards into new cards of the same kind. |

**Status:** Implemented as a hand-count value conversion. Actual discard/replenish operations are not first-class yet.

---

## Known remaining abstractions

These are engine-level features still not modeled as first-class systems:

- Interactive response windows.
- Ordered path traversal and pushing every car crossed by a fallback/advance window.
- First-class discard-X and replenish-X card effects.
- True dice/random command resolution.
- Separate defense-lock state beyond focus loss and result guards.
- Full direct-confrontation detection beyond current ahead/opponent approximations.

---

## Validation status

- TypeScript check passes with `npx tsc --noEmit`.
- Active DeltaDash source uses direct seconds-based `timeDelta` logic.
- Card catalog metadata is aligned with named handlers in `match-flow.ts`.
