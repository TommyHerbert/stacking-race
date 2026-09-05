# Stacking Race — Spec v1

Abstract, offline, schizolo (hotseat) race-betting game for web first (phone portrait), later Android/iOS. Mechanics match **Camel Up (2014 base game)** as corrected below; theme and naming are original. No camel-related terminology in UI, history, or code identifiers exposed to players.

**Rules sources (precedence):** this spec → player clarifications → `docs/Camel_Up_Quick_Rules.pdf` (BGG “freechinanow”, Dec 2016). Where this spec disagrees with the PDF (notably leg bet counts and midfield bets), **this spec wins**.

---

## 1. Goals & constraints

| Priority | Decision |
|----------|----------|
| Platforms | Web first; Android/iOS later (same UI via Capacitor) |
| Mode (v1) | Schizolo only — one device, players alternate; no AI, no network |
| Performance | Prefer fast turns and a small storage footprint |
| Graphics | Minimal; coloured rectangles for pieces; dice rolls as numerals `1`/`2`/`3` |
| Aesthetic | Sparse / ASCII-adjacent; not a heavy illustrated board |
| Offline | Fully offline |
| RNG | Seeded / deterministic dice sequence |
| Accessibility | Deferred; build for a sighted, colour-capable player first |
| Scope discipline | Tiny feature commits; commit 1 = framework boilerplate only |

---

## 2. Glossary (player-facing)

| Term | Meaning |
|------|---------|
| **Piece** | One of five racing tokens (colours) |
| **Track** | Linear number-line of spaces (left → right = forward) |
| **Stack** | Ordered column of pieces on one space (bottom → top) |
| **Leg** | One round until all five dice actions for that leg are taken |
| **Race** | Full game until a piece finishes |
| **Leg bet** | Short-term bet on a piece for the current leg (winner stack or midfield) |
| **Dice** | The take-and-roll action / token: grants +1 points at leg end and reveals a die |
| **Race bet** | Long-term bet on overall winner or loser |
| **Track modifier** | Player’s jump / fall-back marker on the track |
| **Jump** | Modifier side: landing unit moves +1 forward; owner +1 points |
| **Fall back** | Modifier side: landing unit moves −1; owner +1 points |
| **Hand** | Current player’s held leg bets / dice / race bets / unplayed modifier (context-dependent) |
| **Points** | Running score |
| **Player A…H** | Seats; **A always starts**; order fixed A→B→… |

Do **not** use: camel, desert, oasis, mirage, pyramid, Egyptian pounds, or other Camel Up brand language in UI or history.

---

## 3. Technical plan

### 3.1 Stack

- **Language:** TypeScript
- **Monorepo layout (initial):**
  - `packages/engine` — pure rules, RNG, serialize/deserialize (no UI)
  - `apps/web` — Vite + small UI library (Preact or similar)
- **Native later:** Capacitor wrappers around `apps/web`
- **Persistence:** `localStorage` (or equivalent) — **one** continue slot

### 3.2 Engine contract (target shape)

- Authoritative `GameState` + `rngSeed` / RNG cursor
- `legalActions(state) → Action[]`
- `apply(state, action) → state` (pure; advances RNG when rolling)
- Derived views: ranking, visible board window, history lines
- UI never invents rules; it only renders state and dispatches actions

### 3.3 Out of scope for v1

- AI, network play, undo, elaborate handoff / hidden-info modes
- Landscape layout, accessibility pass, flavour copy
- Partnerships / reverse pieces / other edition extras

---

## 4. Players & setup

- **Player count:** 2–8 (menu choice)
- **Starting points:** 3 each
- **Each player receives:**
  - 5 **race bets** (one per piece colour)
  - 1 **track modifier** (jump / fall-back double-sided)
- **Bank:** unlimited points for payouts; players **cannot go below 0** (unpayable −1 is skipped)
- **Start player:** Player A (not “youngest”)

### 4.1 Board & pieces

- **Track:** 16 spaces, numbered **1–16** left to right in the UI. Forward = higher number. Finish = moving **past space 16** (see §8). Movement never wraps.
- **Five pieces**, five matching dice colours; each roll is **1, 2, or 3 with equal probability**. No need to model a physical six-face die.
- **Starting positions:** roll all five dice once; place each piece on space = face value. Same space → stack in **arbitrary order** (engine: shuffle stack order with seeded RNG).
- Place all five dice into the hidden roll pool. Make **five dice** actions available for the leg (the “dice” stack / supply).

### 4.2 Leg bet market (per colour)

Two markets per piece colour:

1. **Winner bets** — stack of **4**, top to bottom: **5, 3, 2, 2** (top taken first).
2. **Midfield bet** — **one** per colour (see §7 for payouts).

*(Overrides the BGG quick-rules PDF, which lists only three winner tiles 5/3/2 and no midfield.)*

**UI:** in the leg **stacks** area, each colour shows its **winner stack** with a **midfield slot beside it** (present or empty once taken).

---

## 5. Turn structure

Turns proceed A→B→… wrapping. On a turn the active player takes **exactly one** action:

| # | Action | Notes |
|---|--------|--------|
| 1 | **Take a leg bet** | Top of any colour’s **winner** stack, **or** that colour’s **midfield** bet if still available. No hold limit (including duplicates). One bet per turn. |
| 2 | **Place or move track modifier** | Place own modifier on a legal space, choosing **jump** or **fall back**. If already on the board, this action relocates it. |
| 3 | **Take dice** | Take one dice token (+1 points at leg end). Reveal one die from the pool; move that colour’s piece by the face value; park the die as “used”. |
| 4 | **Place race bet** | Choose one held race bet and place it on the **overall winner** pile or **overall loser** pile. Hidden on the board UI; cannot be retrieved. Further bets allowed on later turns. |

No pass, no undo.

### 5.1 Track modifier placement legality

- Space must be **empty** of pieces and of any track modifier.
- **Not** space **1**.
- **Not adjacent** to a space that already has a track modifier.
- Player has only one modifier; moving uses the same action.

### 5.2 Movement & stacking

- Moving a piece carries **all pieces above it**; pieces below stay.
- Landing on another unit → arriving unit (stack portion) is placed **on top**.
- Landing on **jump** → unit moves **+1** further forward; modifier owner **+1 points**. Arriving unit lands **on top** of any stack on the destination.
- Landing on **fall back** → unit moves **−1**; modifier owner **+1 points**. Arriving unit lands **under** any stack on the destination.
- **Chained modifier effects cannot occur:** adjacency forbids two modifiers on consecutive spaces, so the extra ±1 step never lands on another modifier. The engine need not special-case chains.
- Ranking: farther forward (higher space) = ahead; same space → **higher in stack = ahead**.

### 5.3 Dice UI (product note)

“Take dice” is chosen from the leg **stacks**; after reveal, the roll numeral appears in the active player’s leg **hand**. Highlight moved piece(s) on the track; optional short motion (token + pieces + travel arrow on the number-line).

---

## 6. End of a leg

Triggered when a player takes the **last (5th) dice** action, completes the move, **then** leg scoring runs before the next turn.

1. Pass start-player marker to the **next** player (they open the next leg).
2. **Score** (§7).
3. **Cleanup:** return all winner/midfield bets and dice supply to the board in initial order; return track modifiers to owners; return all dice to the hidden pool.

---

## 7. Leg scoring

For each bet a player holds:

### 7.1 Winner bets

| Rank of that colour | Payout |
|---------------------|--------|
| 1st | Printed value (**5**, **3**, or **2**) |
| 2nd | **+1** |
| 3rd–5th | **−1** (skip if player would go below 0) |

### 7.2 Midfield bets (one per colour)

| Rank of that colour | Payout |
|---------------------|--------|
| 1st | **−1** |
| 2nd | **+1** |
| 3rd | **+2** |
| 4th | **+1** |
| 5th | **−1** |

### 7.3 Dice

Each dice token taken this leg: **+1** points.

---

## 8. End of the race

- Ends **immediately** when any piece **moves past space 16** (crosses the finish).
- First: run a full **leg scoring** round.
- Then score **overall winner** and **overall loser** race piles:
  - Winner = leading piece (top of stack if tied on space).
  - Loser = rearmost piece (**bottom** of stack if several share the rearmost space).
  - Flip each pile so **first bet placed is scored first**.
  - Matching bets, in order: **+8, +5, +3, +2**, then **+1** for any later correct bets.
  - Each incorrect bet: **−1** (floor at 0).
- Most points wins; **ties shared**.

---

## 9. Secrecy & information (v1 schizolo)

| Element | Board UI | History log |
|---------|----------|-------------|
| Race bets on win/lose piles | **Hidden** (show **counts** only) | **Full detail** (who, colour, win vs lose) — open table |
| Points | Public (score control) | Updates logged |
| Leg bets / track modifiers / dice | Public | Logged |

Later modes may hide race bets from history; not v1.

History must be a **scrollable text record** sufficient to **replay every event** on a physical set, using **Stacking Race glossary only** (no camel lexicon).

---

## 10. UI structure

**Portrait-first** (phone width). Laptop browser may be wider; design for phone first.

### 10.1 Menu

- Title: **Stacking Race**
- Choose player count **2–8**
- Start new game
- **Continue** (one slot; disabled if empty)
- v1: schizolo only (no AI / network affordances)

### 10.2 Game screen (top → bottom)

1. **Top row:** Score · Opponents · History · Options  
   - **Score:** running points; tap → all players’ points.  
   - **Opponents:** compact dump of **entire game state** (as dense as practical).  
   - **History:** full scrollable event log.  
   - **Options:** **Back to menu** only (more entries later).
2. **Track:** partial **linear** number-line (see §10.3).
3. **Leg row:** **hand** (left) = taken leg bets + dice numerals + unplayed track modifier; **stacks** (right) = per colour **winner stack + midfield slot**, plus dice supply.
4. **Race row:** **hand** (left) = remaining race bets; **stacks** (right) = winner/loser piles as **counts only**.

Active player should be obvious (e.g. “Player C’s turn”).

### 10.3 Track visualisation

- **Not circular.** Show a left-to-right window of spaces with labels underneath.
- Include **all pieces and track modifiers**, plus **two** empty spaces ahead of the forwardmost content (for placing modifiers).
- Pieces = coloured rectangles stacked bottom→top in a column above their space.
- **Jump** and **fall back** markers on the space; fall back uses a diagonal arrow **top-right → bottom-left** (Unicode e.g. `↙` U+2199). Jump can use a contrasting arrow (e.g. `↗`) if needed.

Example layout (letters stand in for coloured rectangles):

```text
      R
  G   Y
  B   W  ↙
  6   7  8  9 10
```

### 10.4 Visual language

- Pieces: coloured rectangles.
- Dice rolls: numerals.
- Light motion OK for roll + move (highlight, arrow, short travel).

---

## 11. Persistence schema (draft)

Single continue slot, e.g. key `stacking-race.continue.v1`.

Logical contents:

```text
version: 1
rngSeed: string | number
rngCursor: number          # how far the seeded stream has been consumed
playerCount: 2..8
activePlayer: 'A'.. 
phase: 'turn' | 'leg_score' | 'race_score' | 'game_over' | ...
track: spaces[1..16] → {
  stack: PieceColour[],
  modifier?: { owner, side: 'jump' | 'fall_back' }
}
dicePool: remaining piece-colours still unrevealed this leg
diceUsed: revealed this leg
legWinnerBets: per colour → remaining values top-first
legMidfieldBets: per colour → available bool
diceRemaining: 0..5       # take-dice supply this leg
players: per seat → {
  points,
  legBets[],
  diceCount,
  raceBetsRemaining[],
  modifierInHand | onBoard
}
raceWinnerPile: { player, colour }[]   # place order; UI hides colours
raceLoserPile:  { player, colour }[]
history: string[] | structured events
startPlayerThisLeg: seat
```

Exact TypeScript types live in `packages/engine` when implemented. Saves after every successful action.

---

## 12. Suggested commit ladder (tiny slices)

1. **Framework only** — workspace tooling, empty `packages/engine` + `apps/web`, phone-sized shell, no game.
2. Engine types + empty state + seed RNG.
3. Constants (colours, bet values, track length).
4. Setup + serialize/continue slot.
5. Legal actions stub → implement actions one family per commit.
6. Menu screen.
7. Game chrome (empty zones).
8. Track render → leg row (incl. midfield slots) → race row → score/opponents/history/options.
9. Leg end scoring → race end scoring.
10. Motion polish for dice.

---

## 13. Open points (non-blocking)

- Exact finish-line tests (first crossing past 16) should freeze edge cases in the engine suite.
- Fall-back onto empty space vs under a stack: cover both in engine tests (rules are stated; tests lock them).

Midfield-beside-winner in the leg stacks UI is **required** (see §4.2 / §10.2) — not an open question.

---

## 14. Document history

| Date | Change |
|------|--------|
| 2026-09-04 | Initial spec from design thread + 2014 quick rules PDF; winner bets 5/3/2/2 + midfield; race payouts 8/5/3/2/1/−1; TS/Vite plan; schizolo UX. |
| 2026-09-04 | Glossary: leg bet / dice / race bet / track modifier / points. Linear track UI (2 spaces ahead); equal-probability d3; no movement wrap; no chained modifiers; midfield slot required in stacks UI. |
