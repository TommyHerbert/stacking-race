# Stacking Race — Spec v1

Abstract, offline, schizolo (hotseat) race-betting game for web first (phone portrait), later Android/iOS. Mechanics match **Camel Up (2014 base game)** as corrected below; theme and naming are original. No camel-related terminology in UI, history, or code identifiers exposed to players.

**Rules sources (precedence):** this spec → player clarifications → `docs/Camel_Up_Quick_Rules.pdf` (BGG “freechinanow”, Dec 2016). Where this spec disagrees with the PDF (notably leg ticket counts and midfield tickets), **this spec wins**.

---

## 1. Goals & constraints

| Priority | Decision |
|----------|----------|
| Platforms | Web first; Android/iOS later (same UI via Capacitor) |
| Mode (v1) | Schizolo only — one device, players alternate; no AI, no network |
| Performance | Prefer fast turns and a small storage footprint |
| Graphics | Minimal; coloured rectangles for pieces; dice as numerals `1`/`2`/`3` |
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
| **Track** | Circular number-line of spaces |
| **Stack** | Ordered column of pieces on one space (bottom → top) |
| **Leg** | One round until all roll tickets are taken |
| **Race** | Full game until a piece finishes |
| **Leg ticket** | Short-term bet on a piece for the current leg (winner stack or midfield) |
| **Roll ticket** | Action that grants +1 cash at leg end and reveals a die |
| **Race card** | Long-term bet on overall winner or loser |
| **Tile** | Player’s jump / fall-back marker on the track |
| **Jump** | Tile side: landing unit moves +1 forward; tile owner +1 cash |
| **Fall back** | Tile side: landing unit moves −1; tile owner +1 cash |
| **Hand** | Current player’s held tickets / tiles / race cards (context-dependent) |
| **Cash** | Running score currency |
| **Player A…H** | Seats; **A always starts**; order fixed clockwise A→B→… |

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
- Partnerships / crazy pieces / other edition extras

---

## 4. Players & setup

- **Player count:** 2–8 (menu choice)
- **Starting cash:** 3 each
- **Each player receives:**
  - 5 **race cards** (one per piece colour), identity = that player’s character seat
  - 1 **tile** (jump / fall-back double-sided)
- **Bank:** unlimited cash for payouts; players **cannot go below 0** (unpayable −1 is skipped)
- **Start player:** Player A (not “youngest”)

### 4.1 Board & pieces

- **Track:** 16 spaces, numbered 1–16; finish is crossing past the end of the circuit (see §8). Spaces form a loop for movement purposes as in the physical board.
- **Five pieces**, five matching dice; each die faces **1, 2, 3** (two of each face on the physical die — engine may model faces as `{1,2,3}` with equal probability, or as a bag of six faces `1,1,2,2,3,3`; **prefer six-face bag** for fidelity when shuffling into the “pyramid”).
- **Starting positions:** roll all five dice once; place each piece on space = face value. Same space → stack in **arbitrary order** (engine: shuffle stack order with seeded RNG).
- Place all five dice into the roll pool (hidden). Place **five roll tickets** in a stack.

### 4.2 Leg ticket market (per colour)

Two markets per piece colour:

1. **Winner tickets** — stack of **4**, top to bottom: **5, 3, 2, 2** (top taken first).
2. **Midfield ticket** — **one** per colour (see §7 for payouts).

*(Overrides the BGG quick-rules PDF, which lists only three winner tiles 5/3/2 and no midfield.)*

---

## 5. Turn structure

Turns proceed A→B→… wrapping. On a turn the active player takes **exactly one** action:

| # | Action | Notes |
|---|--------|--------|
| 1 | **Take a leg ticket** | Top of any colour’s **winner** stack, **or** that colour’s **midfield** ticket if still available. No limit on how many tickets a player may hold (including duplicates). One ticket per turn. |
| 2 | **Place or move tile** | Place own tile on a legal space, choosing **jump** or **fall back** face up. If already on the board, this action relocates it. |
| 3 | **Take roll ticket** | Take top roll ticket (+1 cash at leg end). Reveal one die from the pool; move that colour’s piece by the face value; park the die as “used”. |
| 4 | **Place race card** | Choose one held race card and place it on the **overall winner** pile or **overall loser** pile. Card is face-down on the board UI; cannot be retrieved. May place further cards on later turns. |

No pass, no undo.

### 5.1 Tile placement legality

- Space must be **empty** of pieces and of any tile.
- **Not** space **1**.
- **Not adjacent** to a space that already has a tile.
- Player has only one tile; moving uses the same action.

### 5.2 Movement & stacking

- Moving a piece carries **all pieces above it**; pieces below stay.
- Landing on another unit → arriving unit (stack portion) is placed **on top**.
- Landing on **jump** → unit moves **+1** further forward; tile owner **+1 cash**. Then resolve the new space normally if needed (engine must define whether chained tile hits are possible — physical game: tile spaces are empty of other tiles and the +1/−1 lands on a camel stack or empty space; **no second tile adjacency**, so at most one tile trigger per move resolution path except the extra step from jump/fall back onto another stack).
- Landing on **fall back** → unit moves **−1**; tile owner **+1 cash**. On fall back, the moving unit lands **under** any stack already on the destination (per classic Oasis/Mirage asymmetry: Oasis on top, Mirage underneath).
- Ranking: farther along the race direction = ahead; same space → **higher in stack = ahead**.

### 5.3 Dice / roll UI (product note)

Treating “take roll ticket” as choosing a roll from the leg **stacks**; after reveal, the roll numeral appears in the active player’s leg **hand**. Highlight moved piece(s) on the track; optional short motion (ticket + pieces + arrow on the number-line).

---

## 6. End of a leg

Triggered when a player takes the **last (5th) roll ticket**, completes the move, **then** leg scoring runs before the next turn.

1. Pass start-player marker to the **next** player clockwise (they open the next leg).
2. **Score** (§7).
3. **Cleanup:** return all winner/midfield/roll tickets to the board in initial order; return tiles to owners; return all dice to the hidden pool.

---

## 7. Leg scoring

For each ticket a player holds:

### 7.1 Winner tickets

| Rank of that colour | Payout |
|---------------------|--------|
| 1st | Printed value (**5**, **3**, or **2**) |
| 2nd | **+1** |
| 3rd–5th | **−1** (skip if player would go below 0) |

### 7.2 Midfield tickets (one per colour)

| Rank of that colour | Payout |
|---------------------|--------|
| 1st | **−1** |
| 2nd | **+1** |
| 3rd | **+2** |
| 4th | **+1** |
| 5th | **−1** |

### 7.3 Roll tickets

Each roll ticket: **+1** cash.

---

## 8. End of the race

- Ends **immediately** when any piece **crosses the finish line** (board: past space 16 / into the finish / “into space 1” per PDF — engine treats finish as leaving the final stretch beyond space 16).
- First: run a full **leg scoring** round.
- Then score **overall winner** and **overall loser** race piles:
  - Determine winner = leading piece (top of stack if tied on space).
  - Determine loser = rearmost piece (**bottom** of stack if several share the rearmost space).
  - Flip each pile so **first card placed is scored first**.
  - For cards matching the true winner/loser, payouts in order: **+8, +5, +3, +2**, then **+1** for any later correct cards.
  - Each incorrect card: **−1** (floor at 0).
- Most cash wins; **ties shared**.

---

## 9. Secrecy & information (v1 schizolo)

| Element | Board UI | History log |
|---------|----------|-------------|
| Race cards on win/lose piles | **Hidden** (show **counts** only) | **Full detail** (who, colour, win vs lose) — open table |
| Cash | Public (score control) | Updates logged |
| Leg tickets / tiles / dice | Public | Logged |

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
   - **Score:** running cash for the relevant view; tap → all players’ cash.  
   - **Opponents:** compact dump of **entire game state** (as dense as practical).  
   - **History:** full scrollable event log.  
   - **Options:** **Back to menu** only (more entries later).
2. **Track:** partial number-line showing **all pieces and tiles**, plus **three empty spaces ahead** of the forwardmost relevant content (to ease tile placement).
3. **Leg row:** **hand** (left) = taken leg/roll tickets + unplayed tile; **stacks** (right) = remaining winner/midfield tickets and roll availability.
4. **Race row:** **hand** (left) = remaining race cards; **stacks** (right) = winner/loser piles as **counts only**.

Active player should be obvious (e.g. “Player C’s turn”).

### 10.3 Visual language

- Pieces: coloured rectangles (stack = vertical stack of rects).
- Dice / rolls: numerals.
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
track: spaces[1..16] → { stack: PieceColour[], tile?: { owner, side: 'jump'|'fall_back' } }
dicePool: remaining faces/colours still in the pyramid
diceUsed: revealed this leg
legWinnerTickets: per colour → remaining values top-first
legMidfieldTickets: per colour → available bool
rollTicketsRemaining: 0..5
players: per seat → { cash, legTickets[], rollTicketCount, raceCardsRemaining[], tileInHand | onBoard }
raceWinnerPile: { player, colour }[]   # order = place order; UI hides colours
raceLoserPile:  { player, colour }[]
history: string[] | structured events
startPlayerThisLeg: seat
```

Exact TypeScript types live in `packages/engine` when implemented. Saves after every successful action.

---

## 12. Suggested commit ladder (tiny slices)

1. **Framework only** — workspace tooling, empty `packages/engine` + `apps/web`, phone-sized shell, no game.
2. Engine types + empty state + seed RNG.
3. Constants (colours, ticket values, track length).
4. Setup + serialize/continue slot.
5. Legal actions stub → implement actions one family per commit.
6. Menu screen.
7. Game chrome (empty zones).
8. Track render → leg row → race row → score/opponents/history/options.
9. Leg end scoring → race end scoring.
10. Motion polish for rolls.

---

## 13. Open points (non-blocking)

Resolved enough to implement; revisit only if playtest disagrees:

- Exact finish-line geometry vs space indices (tests should freeze “first crossing” cases).
- Whether fall-back onto an empty space vs under a stack needs extra diagrammed cases in engine tests.
- Midfield ticket UI affordance among “stacks” (one slot per colour beside winner stack).

---

## 14. Document history

| Date | Change |
|------|--------|
| 2026-09-04 | Initial spec from design thread + 2014 quick rules PDF; leg tickets corrected to 5/3/2/2 + midfield; race payouts 8/5/3/2/1/−1; TS/Vite plan; schizolo UX. |
