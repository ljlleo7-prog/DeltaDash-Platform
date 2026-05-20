# Delta Dash 4.0 Card Abstraction

Source pages inspected: `DriverCards.pdf` pp.1-2, `cards_4.0.pdf` pp.1 and 4.
Repeated instances of the same card on a page are collapsed — count TBD.
Cards marked `[unclear]` have partially illegible source text; interpretation is best-effort.

---

## Card categories

Two distinct categories were observed:

| Category | Description |
|---|---|
| **Action / Tactic cards** | Played during a round to attack, defend, recover, or reposition. Have a corner priority number or `X`. |
| **Driver cards** | Passive stat cards attached to a driver. Show 正赛/排位/专注 modifiers and one named passive ability. |

---

## Action / Tactic cards

Priority is the top-left corner value. `X` means the cost or priority is variable/conditional.

---

### 攻 (Attack)

| Field | Value |
|---|---|
| Priority | **5** |
| Corner color | Red |
| Type | Action — Offense |
| Count | Variable, 6-18 |

**Effect:** Offensive attack action. Full rule text partially illegible; functions as the core attack card in the game.

**Logic interpretation:** Represents a direct racing attack move. High priority (5) means it resolves before most other cards. Likely deals time delta or position damage to a target.

---

### 防 (Defend)

| Field | Value |
|---|---|
| Priority | **X** |
| Corner color | Blue |
| Type | Action — Defense |
| Count | Variable, 6-12 |

**Effect:** Defensive response card. Full rule text partially illegible.

**Logic interpretation:** `X` priority means it is a reactive card — played in response to an incoming attack. Cancels or reduces the effect of an opposing action. Timing: response window after an attack is declared.

---

### 释放 (Release / Discharge)

| Field | Value |
|---|---|
| Priority | **3** |
| Corner color | Yellow |
| Type | Action — Energy |
| Count | Variable, 8-10 |

**Effect:** Use one card to add to the current turn's energy release (MJ). Cannot exceed the energy cap. [partial text unclear]

**Logic interpretation:** Spends a card to boost energy output this turn. The cap constraint means it cannot be stacked infinitely. Likely maps to the energy-release mechanic in the rules interpretation (energy → time delta conversion).

---

### 烧胎 (Burn Tires)

| Field | Value |
|---|---|
| Priority | **3** |
| Corner color | Yellow |
| Type | Action — Tire / Hazard |
| Count | 6 |

**Effect:** After drifting/passing within 1.5 seconds, tire degradation doubles.

**Logic interpretation:** Conditional debuff triggered by close proximity (within 1.5s gap). Doubles tire wear for the affected car this round. Maps to the tire durability system — a targeted tire-burn attack.

---

### 保胎 (Protect Tires)

| Field | Value |
|---|---|
| Priority | **1** |
| Corner color | Green |
| Type | Action — Defense / Tire |
| Count | 6 |

**Effect:** After moving back 1.5 seconds, tire wear does not count this round.

**Logic interpretation:** Defensive tire-protection move. Costs position (moves back 1.5s) in exchange for zero tire degradation. Low priority (1) means it resolves last — likely played proactively before the round resolves.

---

### 回收 (Recycle / Recover)

| Field | Value |
|---|---|
| Priority | **1** |
| Corner color | Green |
| Type | Action — Recovery |
| Count | Variable, 6-10 |

**Effect:** Each card immediately exchange for 1MJ of battery as well as the penalty of no "normal release" next round. Only during "Overtake" mode, cards can be stacked; elsewhere, you can only use one each round.

**Logic interpretation:** Harvesting energy with both a short-term net positive boost and a delayed net-negative compromise to ensure balance. Low priority — played as a setup action.

---

### 大杀四方 (Slaughter All Sides)

| Field | Value |
|---|---|
| Priority | **6** |
| Corner color | Red |
| Type | Tactic — Mass Attack |
| Count | 4 |

**Effect:** Consume all cards/resources; first strike against all external targets; costs 1 focus; cannot be defended against.

**Logic interpretation:** All-in nuke card. Highest observed priority (6). Unblockable — `防` cannot counter it. Requires spending all remaining resources. Likely ends the round decisively for the player who uses it. Referenced by driver card 优秀在我 (doubles its effect).

---

### 曲线救国 (Roundabout Rescue)

| Field | Value |
|---|---|
| Priority | **X** |
| Corner color | Blue |
| Type | Tactic — Conditional Combo |
| Count | 4 |

**Effect:** Triggered by "攻" (Attack). After being played, fall back 2 seconds and push back all drivers in your way during this process.

**Logic interpretation:** Combo/chain card that requires a prior condition ("火") to activate. `X` priority suggests it is reactive or conditional. Likely repositions or converts a disadvantage into an advantage.

---

### 先手夺阵 (First-Move Seize Position)

| Field | Value |
|---|---|
| Priority | **2** |
| Corner color | Green |
| Type | Tactic — Initiative |
| Count | 4 |

**Effect:** Transfer/exchange to the other side's card or position. [partial text unclear]

**Logic interpretation:** Initiative card that swaps position or card control. Low-medium priority. Likely used to steal a favorable position before higher-priority cards resolve.

---

### 电磁回收 (Electromagnetic Recovery)

| Field | Value |
|---|---|
| Priority | **2** |
| Corner color | Green |
| Type | Tactic — Energy Recovery |
| Count | 4 |

**Effect:** Place X cards and recover X energy points.

**Logic interpretation:** Energy-for-cards exchange. Spend cards to recover energy. Symmetric cost/gain (X cards → X energy). Maps directly to the energy system.

---

### 渔翁得利 (Fisherman's Profit)

| Field | Value |
|---|---|
| Priority | **4** |
| Corner color | Orange/Red |
| Type | Tactic — Opportunistic |
| Count | 4 |

**Effect:** When 3+ parties are involved and 2+ are in direct confrontation, swap your position with another. If the player has energy remain, decrease 1MJ; else, this card will not have any effect.

**Logic interpretation:** Exploits multi-player conflict. Requires a specific board state (3-way confrontation). Swaps position to benefit from others' clash. The card-void clause means the triggering cards are consumed.

---

### 死守狮防 (Steadfast Lion Defense)

| Field | Value |
|---|---|
| Priority | **X** |
| Corner color | Blue |
| Type | Tactic — Defense |
| Count | 4 |

**Effect:** Cannot be triggered by "攻" and any forms of violation of forward rank lock (i.e. driver passing in any form). Conditional defensive effect based on something. The card can stay in the deploy zone for arbitrary time span, but each round with it in the deploy zone will void the player's normal harvest.

**Logic interpretation:** A hard defensive card with immunity to certain trigger conditions. `X` priority = reactive. Likely a stronger or more conditional version of 防.

---

### 听不清楚 (Can't Hear Clearly)

| Field | Value |
|---|---|
| Priority | **X** |
| Corner color | Blue |
| Type | Tactic — Disruption / Silence |
| Count | 4 |

**Effect:** Can be triggered by any tactic card. Makes the tactic card invalid/ineffective.

**Logic interpretation:** Cancellation/silence card. Invalidates a target card or effect. `X` priority = reactive. The "sound wave" condition is likely a flavor/thematic trigger for a specific card type or action.

---

### 小曲之力 (Power of the Little Tune)

| Field | Value |
|---|---|
| Priority | **2** |
| Corner color | Green |
| Type | Tactic — Focus Boost |
| Count | 4 |

**Effect:** Focus +[dice result], capped at 4.

**Logic interpretation:** Gains focus equal to a variable "tune points" value, maximum 4. Focus is a key resource in the game. Referenced by driver card 小曲乱起 (allows immediate release when this card is played by another player).

---

### 狂降犯境 (Rampaging Invasion)

| Field | Value |
|---|---|
| Priority | **6** |
| Corner color | Red |
| Type | Tactic — Mass Suppression |
| Count | 4 |

**Effect:** All players except you must play 防 (defend), or defense is locked/broken. [partial text unclear]

**Logic interpretation:** Forces all opponents into a defensive posture or strips their defensive options. High priority (6) — resolves early. Paired with 大杀四方, this could lock opponents out of defending before the nuke lands.

---

### 计划有变 (Plan Changed)

| Field | Value |
|---|---|
| Priority | **2** |
| Corner color | Green |
| Type | Tactic — Hand Management |
| Count | 4 |

**Effect:** Discard X hand cards and replenish X cards of the corresponding type.

**Logic interpretation:** Hand-swap card. Exchanges unwanted cards for cards of a specific type. Useful for setting up combos or recovering from a bad hand.

---

## Driver cards

Driver cards are passive stat cards attached to a driver. They modify race performance and provide one named passive ability. The three stat modifiers are:

| Stat | Meaning |
|---|---|
| **正赛** | Race time modifier (seconds, positive = slower, negative = faster) |
| **排位** | Qualifying time modifier (seconds) |
| **专注** | Focus cap for this driver |

Each driver card has one bracketed passive ability `【ability name】`.

---

### Driver card A

| Field | Value |
|---|---|
| 正赛 | +0.5 |
| 排位 | +1.0 |
| 专注 | 8 |
| Ability | 【水中漂离】 |
| Count | TBD |

**Ability effect:** Every two turns, lose 1 focus; then draw one strategy card.

**Logic interpretation:** Slow driver (positive time modifiers). Trades focus drain for card draw. Suits a card-heavy strategy that can absorb the focus cost.

---

### Driver card B

| Field | Value |
|---|---|
| 正赛 | +1 |
| 排位 | +1.0 |
| 专注 | 6 |
| Ability | 【团队风作】 / 【赛车大拉】 |
| Count | TBD |

**Ability effect:**
- 【团队风作】: In rain conditions, focus cap is fixed at 8 (overrides the base 6).
- 【赛车大拉】: Can use the second hand card to cancel a side collision or mistake.

**Logic interpretation:** Slowest driver stat-wise but has two abilities. Rain specialist — focus cap improves in wet conditions. Also has a collision-mitigation ability. Likely a high-risk, high-reward driver in rain races.

---

### Driver card C

| Field | Value |
|---|---|
| 正赛 | -0.5 |
| 排位 | -0.2 |
| 专注 | 8 |
| Ability | 【拉力车手】 |
| Count | TBD |

**Ability effect:** Immune to collisions; when a collision occurs, costs 10 tire durability instead.

**Logic interpretation:** Fast driver. Collision immunity converts crash damage into tire wear. Pairs well with tire-protection cards (保胎). Vulnerable to tire-burn cards (烧胎).

---

### Driver card D

| Field | Value |
|---|---|
| 正赛 | 0 |
| 排位 | -0.7 |
| 专注 | 8 |
| Ability | 【优秀在我】 |
| Count | TBD |

**Ability effect:** Doubles the effect of 大杀四方.

**Logic interpretation:** Neutral race time, strong qualifying. Passive synergy with the highest-priority attack card. A combo-oriented driver — build a deck around 大杀四方 to maximize this ability.

---

### Driver card E

| Field | Value |
|---|---|
| 正赛 | 0 |
| 排位 | +0.3 |
| 专注 | 8 |
| Ability | 【罚场老将】 |
| Count | TBD |

**Ability effect:** Can cancel a penalty through all hand cards (except when hand is empty). [partial text unclear]

**Logic interpretation:** Broad defensive or penetrating passive. Likely means attacks or effects from this driver bypass hand-based defenses, or this driver can block any hand card. Needs clarification.

---

### Driver card F

| Field | Value |
|---|---|
| 正赛 | -0.5 |
| 排位 | +0.4 |
| 专注 | 7 |
| Ability | 【哑嘴就改】 |
| Count | TBD |

**Ability effect:** After a mistake, focus is fully restored.

**Logic interpretation:** Mistake-recovery driver. Slightly below-average focus cap (7) but self-corrects on errors. Forgiving for aggressive play styles that risk mistakes.

---

### Driver card G

| Field | Value |
|---|---|
| 正赛 | +1.0 |
| 排位 | +0.8 |
| 专注 | 6 |
| Ability | 【新手号运】 |
| Count | TBD |

**Ability effect:** During the race, can intentionally collide to trigger a safety car or red flag; discard all hand cards to revive.

**Logic interpretation:** Slowest driver with lowest focus cap, but has a dramatic reset ability. Can force a safety car/red flag at the cost of all hand cards. A last-resort or chaos-inducing driver.

---

### Driver card H

| Field | Value |
|---|---|
| 正赛 | +0.5 |
| 排位 | +0.2 |
| 专注 | 9 |
| Ability | 【二分合成】 |
| Count | TBD |

**Ability effect:** Two action cards, or one strategy card, can be used as one 攻.

**Logic interpretation:** Highest focus cap (9). Converts card combinations into the core attack action. Enables flexible attack setups without needing a dedicated 攻 card in hand.

---

### Driver card I

| Field | Value |
|---|---|
| 正赛 | -0.5 |
| 排位 | -0.6 |
| 专注 | 9 |
| Ability | 【小曲乱起】 / 【出师不利】 |
| Count | TBD |

**Ability effect:**
- 【小曲乱起】: When another player plays 小曲之力, this driver can immediately release it (intercept/copy).
- 【出师不利】: First-turn resolution modifier. 1/3 chance first round no normal release.

**Logic interpretation:** Fast driver with highest focus cap. Disrupts opponents' focus-gain plays by intercepting 小曲之力. Has a first-turn disadvantage for balance. 

---

### Driver card J

| Field | Value |
|---|---|
| 正赛 | 0 |
| 排位 | +0.2 |
| 专注 | 8 |
| Ability | 【保胎大师】 |
| Count | TBD |

**Ability effect:** When using 保胎, the backward movement penalty is waived.

**Logic interpretation:** Removes the position cost of 保胎 — tire protection with no downside. Pairs directly with 保胎 cards. Strong in tire-attrition matchups.

---

## Cross-card interactions observed

| Card | Interacts with | Interaction |
|---|---|---|
| 烧胎 | 保胎 | 烧胎 doubles tire wear; 保胎 negates tire wear |
| 保胎 | Driver J 【保胎大师】 | 保胎 normally costs position; this driver removes that cost |
| 大杀四方 | 防 | 大杀四方 cannot be defended against |
| 大杀四方 | Driver D 【优秀在我】 | Doubles 大杀四方 effect |
| 狂降犯境 | 防 | Forces opponents to play 防 or suppresses defense |
| 小曲之力 | Driver I 【小曲乱起】 | Driver I can intercept and immediately release 小曲之力 |
| 攻 | Driver H 【二分合成】 | Two action cards or one strategy card substitutes for 攻 |

---

## Open questions

- **Count per card:** TBD — user will specify deck counts. All driver cards set 1.
- **释放 full text:** The MJ cap condition is partially illegible. Does it cap at the current energy maximum, or a fixed value? -Energy must never exceed 4.0MJ nor fall below 0.0MJ. That is the hard cap.
- **曲线救国 trigger:** What exactly constitutes the "火" condition? -That is actually 攻 or attack.
- **死守狮防 full text:** The immunity condition is illegible. -Basically driver passing in any form, not necessarily attack card.
- **听不清楚 full text:** What card types or actions does it silence? -All tactic cards.
- **渔翁得利 card-void clause:** Are the triggering cards from all parties voided, or only the attacker's? -Only the attacker's, and only if the energy requirement is not met.
- **罚场老将 full text:** Does this penetrate defenses or block attacks? -Penetrate any penalties.
- **第一回合判定 on Driver I:** The /6 condition is unclear. -It is actually a simple 1/3 chance dice rolling command.
- **Driver card names:** The driver cards on page 4 show stat lines as titles — do they have separate driver names not visible in the crop? -We intentionally removed names for copyright issues. We might add fake names or codes later.
- **Card type taxonomy:** Are 攻/防/释故/烧胎/保胎/回收 all "action cards," and 大杀四方/曲线救国/etc. all "tactic cards"? Or is there a different official split? -Yes, that is the case.
