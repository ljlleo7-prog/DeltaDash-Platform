# Delta Dash 4.0 Card Abstraction - v2 Current Implementation & Goals

This document shows what is currently implemented in the codebase for tactics after the time-delta cleanup.
Compare with `deltadash-card-abstraction.md` for the original design notes.

---

## Tactics - Current Implementation Status

### 大杀四方 (Slaughter All Sides)

| Field | Current Implementation |
|---|---|
| Priority | **6** |
| Targeting | `all-opponents` |
| Conditions | `not_retired`, energy greater than 0 |
| Effects | Consumes own energy/tire/focus, advances by current energy in seconds, and applies deterministic 1-3 focus loss to opponents passed during that time window. |

**What it does:** Converts all remaining energy into a risky forward time-delta burst while damaging opponents crossed by that burst.

**Remaining limitations:** Cannot yet model "cannot be defended against" or full position-lock bypass beyond the direct time-delta window.

---

### 曲线救国 (Roundabout Rescue)

| Field | Current Implementation |
|---|---|
| Priority | **X** |
| Targeting | `none` |
| Conditions | `not_retired` |
| Effects | `modify_time_delta: -2.0s` |

**What it does:** Falls back 2 seconds.

**Remaining limitations:** The response trigger and pushing all drivers in the fallback path are not fully represented yet.

---

### 渔翁得利 (Fisherman's Profit)

| Field | Current Implementation |
|---|---|
| Priority | **4** |
| Targeting | `opponent` |
| Conditions | `not_retired`, at least two opponents ahead, target has energy remaining |
| Effects | Target loses 1 energy, then source and target swap time-delta positions. |

**What it does:** Opportunistically swaps with a target in front when there are at least two contenders ahead.

**Remaining limitations:** Direct-confrontation detection is approximated by "two opponents ahead" until a richer confrontation model exists.

---

### 死守狮防 (Steadfast Lion Defense)

| Field | Current Implementation |
|---|---|
| Priority | **X** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | Applies persistent `steadfast-defense` while the card remains deployed. Blocks hostile negative time-delta effects and suppresses default no-card harvest. |

**What it does:** Stays in the deploy zone, protects against attack/passing-style negative time-delta effects, and voids normal harvest while deployed.

**Remaining limitations:** It uses the current result-guard layer rather than a full response stack.

---

### 听不清楚 (Can't Hear Clearly)

| Field | Current Implementation |
|---|---|
| Priority | **X** |
| Targeting | `opponent` committed to a tactic card |
| Conditions | `not_retired`, target committed a tactic this round |
| Effects | Marks the target tactic as countered and removes that tactic's resolved effects. |

**What it does:** Counters a tactic card committed by the selected opponent.

**Remaining limitations:** Counter timing is modeled during resolution rather than as an interactive response window.

---

### 狂降犯境 (Rampaging Invasion)

| Field | Current Implementation |
|---|---|
| Priority | **6** |
| Targeting | `all-opponents` |
| Conditions | `not_retired` |
| Effects | Opponents that did not answer with an action/response card or defend lose 2 focus. |

**What it does:** Forces opponents to answer or take focus loss.

**Remaining limitations:** Defense suppression/locking is not yet a separate mechanic.

---

### 计划有变 (Plan Changed)

| Field | Current Implementation |
|---|---|
| Priority | **2** |
| Targeting | `self` |
| Conditions | `not_retired` |
| Effects | Converts current hand count into 1-4 focus, capped by focus cap. |

**What it does:** Approximates hand-management value with a bounded focus gain until discard/replenish card operations are first-class effects.

**Remaining limitations:** It still does not discard X hand cards or replenish X corresponding cards.

---

## Summary

The active implementation now uses direct continuous time deltas only. No legacy point/unit wording remains in source logic.

Implemented in this pass:

- Named tactic resolution for Slaughter All Sides, Fisherman's Profit, Can't Hear Clearly, Rampaging Invasion, and Plan Changed.
- Persistent Steadfast Lion Defense deployed-card behavior.
- Direct second-based `timeDelta` / `timeDeltaChange` values across movement, targeting, finish checks, and UI copy.

Remaining future work should focus on response windows, richer confrontation/path models, and first-class discard/replenish effects.