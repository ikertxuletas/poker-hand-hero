import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayingCard } from "@/components/PlayingCard";
import { fullDeck, shuffle, type Card, type Rank } from "@/lib/poker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/blackjack")({
  head: () => ({
    meta: [
      { title: "Blackjack — Basic Strategy & Card Counting" },
      { name: "description", content: "Learn blackjack basic strategy and Hi-Lo card counting with interactive drills." },
      { property: "og:title", content: "Blackjack — Basic Strategy & Card Counting" },
      { property: "og:description", content: "Interactive blackjack training: basic strategy table, practice drills, and Hi-Lo counting." },
    ],
  }),
  component: BlackjackPage,
});

// ─────────────────────────────────────────────────────────────
// Strategy types & data
// ─────────────────────────────────────────────────────────────

type Action = "H" | "S" | "D" | "SP";
const DEALER_UPCARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"] as const;
type Upcard = typeof DEALER_UPCARDS[number];

const ACTION_LABEL: Record<Action, string> = {
  H: "Hit",
  S: "Stand",
  D: "Double",
  SP: "Split",
};

const ACTION_CLASS: Record<Action, string> = {
  H: "bg-sky-600/30 text-sky-200 border border-sky-500/40",
  S: "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40",
  D: "bg-amber-500/30 text-amber-100 border border-amber-400/50",
  SP: "bg-purple-600/30 text-purple-200 border border-purple-500/40",
};

// Helpers to build rows
const ALL_H: Action[] = DEALER_UPCARDS.map(() => "H");
const ALL_S: Action[] = DEALER_UPCARDS.map(() => "S");
const ALL_SP: Action[] = DEALER_UPCARDS.map(() => "SP");

function row(map: Partial<Record<Upcard, Action>>, fallback: Action): Action[] {
  return DEALER_UPCARDS.map((u) => map[u] ?? fallback);
}

interface StrategyRow {
  label: string;
  cells: Action[];
}

const HARD_ROWS: StrategyRow[] = [
  { label: "8", cells: ALL_H },
  { label: "9", cells: row({ "3": "D", "4": "D", "5": "D", "6": "D" }, "H") },
  { label: "10", cells: row({ "2": "D", "3": "D", "4": "D", "5": "D", "6": "D", "7": "D", "8": "D", "9": "D" }, "H") },
  { label: "11", cells: row({ "2": "D", "3": "D", "4": "D", "5": "D", "6": "D", "7": "D", "8": "D", "9": "D", "10": "D" }, "H") },
  { label: "12", cells: row({ "4": "S", "5": "S", "6": "S" }, "H") },
  { label: "13", cells: row({ "2": "S", "3": "S", "4": "S", "5": "S", "6": "S" }, "H") },
  { label: "14", cells: row({ "2": "S", "3": "S", "4": "S", "5": "S", "6": "S" }, "H") },
  { label: "15", cells: row({ "2": "S", "3": "S", "4": "S", "5": "S", "6": "S" }, "H") },
  { label: "16", cells: row({ "2": "S", "3": "S", "4": "S", "5": "S", "6": "S" }, "H") },
  { label: "17+", cells: ALL_S },
];

const SOFT_ROWS: StrategyRow[] = [
  { label: "A,2", cells: row({ "5": "D", "6": "D" }, "H") },
  { label: "A,3", cells: row({ "5": "D", "6": "D" }, "H") },
  { label: "A,4", cells: row({ "4": "D", "5": "D", "6": "D" }, "H") },
  { label: "A,5", cells: row({ "4": "D", "5": "D", "6": "D" }, "H") },
  { label: "A,6", cells: row({ "3": "D", "4": "D", "5": "D", "6": "D" }, "H") },
  { label: "A,7", cells: row({ "2": "S", "3": "D", "4": "D", "5": "D", "6": "D", "7": "S", "8": "S" }, "H") },
  { label: "A,8", cells: ALL_S },
  { label: "A,9", cells: ALL_S },
];

const PAIR_ROWS: StrategyRow[] = [
  { label: "2,2", cells: row({ "2": "SP", "3": "SP", "4": "SP", "5": "SP", "6": "SP", "7": "SP" }, "H") },
  { label: "3,3", cells: row({ "2": "SP", "3": "SP", "4": "SP", "5": "SP", "6": "SP", "7": "SP" }, "H") },
  { label: "4,4", cells: row({ "5": "SP", "6": "SP" }, "H") },
  { label: "5,5", cells: row({ "2": "D", "3": "D", "4": "D", "5": "D", "6": "D", "7": "D", "8": "D", "9": "D" }, "H") },
  { label: "6,6", cells: row({ "2": "SP", "3": "SP", "4": "SP", "5": "SP", "6": "SP" }, "H") },
  { label: "7,7", cells: row({ "2": "SP", "3": "SP", "4": "SP", "5": "SP", "6": "SP", "7": "SP" }, "H") },
  { label: "8,8", cells: ALL_SP },
  { label: "9,9", cells: row({ "2": "SP", "3": "SP", "4": "SP", "5": "SP", "6": "SP", "7": "S", "8": "SP", "9": "SP", "10": "S", "A": "S" }, "S") },
  { label: "10,10", cells: ALL_S },
  { label: "A,A", cells: ALL_SP },
];

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

function BlackjackPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Blackjack <span className="text-gold">Mastery</span>
          </h1>
          <p className="text-muted-foreground">
            Learn the math that beats the house — basic strategy and card counting.
          </p>
        </header>

        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="strategy">Basic Strategy</TabsTrigger>
            <TabsTrigger value="counting">Card Counting</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="space-y-6 mt-6">
            <StrategySection />
            <PracticeDrill />
          </TabsContent>

          <TabsContent value="counting" className="space-y-6 mt-6">
            <CountingExplanation />
            <CountingDrill />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Strategy table
// ─────────────────────────────────────────────────────────────

function StrategySection() {
  return (
    <section className="felt-panel rounded-lg p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold">Strategy Table</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(ACTION_LABEL) as Action[]).map((a) => (
            <span key={a} className={cn("px-2 py-0.5 rounded font-semibold", ACTION_CLASS[a])}>
              {a} — {ACTION_LABEL[a]}
            </span>
          ))}
        </div>
      </div>

      <StrategyTable title="Hard Totals" rows={HARD_ROWS} firstColLabel="Hand" />
      <StrategyTable title="Soft Totals (with Ace)" rows={SOFT_ROWS} firstColLabel="Hand" />
      <StrategyTable title="Pairs" rows={PAIR_ROWS} firstColLabel="Pair" />
    </section>
  );
}

function StrategyTable({ title, rows, firstColLabel }: { title: string; rows: StrategyRow[]; firstColLabel: string }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground/90">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-medium px-2 py-1">{firstColLabel}</th>
              {DEALER_UPCARDS.map((u) => (
                <th key={u} className="text-center text-muted-foreground font-medium px-2 py-1 min-w-[2.5rem]">
                  {u}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-2 py-1 font-semibold text-foreground/90">{r.label}</td>
                {r.cells.map((a, i) => (
                  <td
                    key={i}
                    className={cn("text-center font-bold rounded px-2 py-1", ACTION_CLASS[a])}
                    title={ACTION_LABEL[a]}
                  >
                    {a}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Practice Drill (Basic Strategy)
// ─────────────────────────────────────────────────────────────

type HandKind = "hard" | "soft" | "pair";
interface DrillHand {
  kind: HandKind;
  label: string;
  cards: Card[];
  upcard: Upcard;
  upcardCard: Card;
  correct: Action;
  rationale: string;
}

function lookupAction(kind: HandKind, label: string, upcard: Upcard): Action {
  const rows = kind === "hard" ? HARD_ROWS : kind === "soft" ? SOFT_ROWS : PAIR_ROWS;
  const r = rows.find((x) => x.label === label);
  if (!r) return "H";
  const idx = DEALER_UPCARDS.indexOf(upcard);
  return r.cells[idx];
}

function rationaleFor(kind: HandKind, label: string, upcard: Upcard, action: Action): string {
  const dealerWeak = ["4", "5", "6"].includes(upcard);
  const dealerBust = ["2", "3", "4", "5", "6"].includes(upcard);
  const dealerStrong = ["7", "8", "9", "10", "A"].includes(upcard);
  switch (action) {
    case "S":
      if (kind === "pair" && label === "10,10") return "Stand — 20 is already a near-lock; never split a winning hand.";
      if (dealerBust) return `Stand — dealer ${upcard} is weak and likely to bust. Let them.`;
      return `Stand — your hand is strong enough that hitting risks busting more than dealer ${upcard} will lose.`;
    case "H":
      if (dealerStrong) return `Hit — dealer ${upcard} is strong, you must improve to compete.`;
      return `Hit — your total is too low to stand against dealer ${upcard}.`;
    case "D":
      if (dealerWeak) return `Double — dealer ${upcard} is bust-prone, so press your edge with extra chips.`;
      return `Double — your starting total is favored against dealer ${upcard}; maximize the bet.`;
    case "SP":
      if (label === "A,A") return "Split Aces — two strong starting hands instead of a stiff 12.";
      if (label === "8,8") return "Split 8s — 16 is the worst total; two 8s play far better.";
      return `Split — you turn one weak hand into two playable hands against dealer ${upcard}.`;
  }
}

function rankToCardRank(r: string): Rank {
  if (r === "10") return "T";
  return r as Rank;
}

function pickCardOfRank(rank: Rank, exclude: Card[] = []): Card {
  const deck = shuffle(fullDeck()).filter(
    (c) => c.rank === rank && !exclude.some((e) => e.rank === c.rank && e.suit === c.suit),
  );
  return deck[0] ?? { rank, suit: "♠" };
}

function generateDrillHand(): DrillHand {
  const kinds: HandKind[] = ["hard", "soft", "pair"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const upcard = DEALER_UPCARDS[Math.floor(Math.random() * DEALER_UPCARDS.length)];

  let label = "";
  let cards: Card[] = [];

  if (kind === "hard") {
    const r = HARD_ROWS[Math.floor(Math.random() * HARD_ROWS.length)];
    label = r.label;
    const target = label === "17+" ? 17 + Math.floor(Math.random() * 4) : parseInt(label, 10);
    cards = makeHardHand(target);
  } else if (kind === "soft") {
    const r = SOFT_ROWS[Math.floor(Math.random() * SOFT_ROWS.length)];
    label = r.label;
    const second = label.split(",")[1];
    const ace = pickCardOfRank("A");
    const other = pickCardOfRank(rankToCardRank(second), [ace]);
    cards = [ace, other];
  } else {
    const r = PAIR_ROWS[Math.floor(Math.random() * PAIR_ROWS.length)];
    label = r.label;
    const pr = label.split(",")[0];
    const rk = rankToCardRank(pr);
    const c1 = pickCardOfRank(rk);
    const c2 = pickCardOfRank(rk, [c1]);
    cards = [c1, c2];
  }

  const upRank = rankToCardRank(upcard);
  const upcardCard = pickCardOfRank(upRank, cards);
  const action = lookupAction(kind, label, upcard);

  return {
    kind,
    label,
    cards,
    upcard,
    upcardCard,
    correct: action,
    rationale: rationaleFor(kind, label, upcard, action),
  };
}

function makeHardHand(total: number): Card[] {
  // Build a 2-card hard total without aces and not a pair
  const ranksInOrder: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "T"];
  const valueOf = (r: Rank) => (r === "T" ? 10 : parseInt(r, 10));
  const tries: [Rank, Rank][] = [];
  for (const a of ranksInOrder) {
    for (const b of ranksInOrder) {
      if (a === b) continue;
      if (valueOf(a) + valueOf(b) === total) tries.push([a, b]);
    }
  }
  if (tries.length === 0) {
    // fall back: 10 + (total-10) if possible
    const r2 = ranksInOrder.find((r) => valueOf(r) === total - 10);
    if (r2) {
      const c1 = pickCardOfRank("T");
      const c2 = pickCardOfRank(r2, [c1]);
      return [c1, c2];
    }
    return [pickCardOfRank("T"), pickCardOfRank("9")];
  }
  const [ra, rb] = tries[Math.floor(Math.random() * tries.length)];
  const c1 = pickCardOfRank(ra);
  const c2 = pickCardOfRank(rb, [c1]);
  return [c1, c2];
}

function PracticeDrill() {
  const [hand, setHand] = useState<DrillHand | null>(null);
  const [picked, setPicked] = useState<Action | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const start = () => {
    setHand(generateDrillHand());
    setPicked(null);
  };

  const onPick = (a: Action) => {
    if (!hand || picked) return;
    setPicked(a);
    setScore((s) => ({
      correct: s.correct + (a === hand.correct ? 1 : 0),
      total: s.total + 1,
    }));
  };

  return (
    <section className="felt-panel rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-xl font-bold">Practice Drill</h2>
        <div className="text-sm text-muted-foreground">
          Score: <span className="text-gold font-bold">{score.correct}</span> / {score.total}
        </div>
      </div>

      {!hand && (
        <Button onClick={start} className="bg-gradient-gold text-primary-foreground">
          Start Practice
        </Button>
      )}

      {hand && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Your Hand ({hand.kind} {hand.label})</div>
              <div className="flex gap-2">
                {hand.cards.map((c, i) => (
                  <PlayingCard key={i} card={c} size="md" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Dealer Upcard</div>
              <div className="flex gap-2">
                <PlayingCard card={hand.upcardCard} size="md" />
                <div className="w-20 h-28 rounded-xl border-2 border-dashed border-border/60 bg-felt-deep/40" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(ACTION_LABEL) as Action[]).map((a) => {
              const isPicked = picked === a;
              const isCorrect = picked && a === hand.correct;
              return (
                <button
                  key={a}
                  onClick={() => onPick(a)}
                  disabled={!!picked}
                  className={cn(
                    "px-4 py-3 rounded-md font-bold text-sm transition-all border",
                    ACTION_CLASS[a],
                    !picked && "hover:scale-[1.02]",
                    picked && isCorrect && "ring-2 ring-emerald-400",
                    picked && isPicked && !isCorrect && "ring-2 ring-red-500",
                    picked && !isPicked && !isCorrect && "opacity-50",
                  )}
                >
                  {a} — {ACTION_LABEL[a]}
                </button>
              );
            })}
          </div>

          {picked && (
            <div
              className={cn(
                "rounded-md p-3 text-sm border",
                picked === hand.correct
                  ? "bg-emerald-600/15 border-emerald-500/40 text-emerald-200"
                  : "bg-red-600/15 border-red-500/40 text-red-200",
              )}
            >
              <div className="font-bold mb-1">
                {picked === hand.correct ? "✓ Correct" : `✗ Correct answer: ${hand.correct} (${ACTION_LABEL[hand.correct]})`}
              </div>
              <div className="text-foreground/90">{hand.rationale}</div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={start} variant="secondary">
              {picked ? "New Hand" : "Skip"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Card Counting
// ─────────────────────────────────────────────────────────────

function hiLoValue(rank: Rank): -1 | 0 | 1 {
  if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
  if (["7", "8", "9"].includes(rank)) return 0;
  return -1; // T, J, Q, K, A — we don't have J/Q here, T and A handled
}

function CountingExplanation() {
  return (
    <section className="felt-panel rounded-lg p-4 sm:p-6 space-y-4">
      <h2 className="font-display text-xl font-bold">The Hi-Lo System</h2>
      <p className="text-muted-foreground">
        Card counting tracks the ratio of high cards to low cards left in the deck. When high
        cards are abundant, players get more blackjacks and dealers bust more often.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-md p-3 bg-emerald-600/15 border border-emerald-500/40">
          <div className="text-xs uppercase text-emerald-300 font-semibold">Low cards 2–6</div>
          <div className="text-2xl font-bold text-emerald-200">+1</div>
          <div className="text-xs text-foreground/80">Helping the dealer leave the deck → count up.</div>
        </div>
        <div className="rounded-md p-3 bg-secondary/60 border border-border">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Neutral 7–9</div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-muted-foreground">Don't change the count.</div>
        </div>
        <div className="rounded-md p-3 bg-purple-600/15 border border-purple-500/40">
          <div className="text-xs uppercase text-purple-300 font-semibold">High cards 10–A</div>
          <div className="text-2xl font-bold text-purple-200">−1</div>
          <div className="text-xs text-foreground/80">Helping you leave the deck → count down.</div>
        </div>
      </div>
      <div className="rounded-md p-3 bg-secondary/40 border border-border space-y-1 text-sm">
        <div><span className="text-gold font-bold">Running Count</span> ≥ +3 → deck is rich in high cards. <span className="text-gold">Bet bigger.</span></div>
        <div><span className="text-gold font-bold">True Count</span> = Running Count ÷ Decks Remaining — used at multi-deck shoes for precise sizing.</div>
      </div>
    </section>
  );
}

function CountingDrill() {
  const [deck, setDeck] = useState<Card[]>(() => shuffle(fullDeck()));
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0, totalMs: 0 });
  const [feedback, setFeedback] = useState<null | { ok: boolean; correctVal: number }>(null);
  const startedAt = useRef<number>(Date.now());
  const lockedRef = useRef(false);

  // reset start time per card
  useEffect(() => {
    startedAt.current = Date.now();
    lockedRef.current = false;
    setFeedback(null);
  }, [index]);

  const card = deck[index];
  const done = index >= deck.length;

  const onPick = (val: -1 | 0 | 1) => {
    if (lockedRef.current || !card) return;
    lockedRef.current = true;
    const correctVal = hiLoValue(card.rank);
    const ok = val === correctVal;
    const elapsed = Date.now() - startedAt.current;

    setRunning((r) => r + correctVal);
    setStats((s) => ({
      correct: s.correct + (ok ? 1 : 0),
      total: s.total + 1,
      totalMs: s.totalMs + elapsed,
    }));
    setFeedback({ ok, correctVal });

    const delay = ok ? 350 : 1000;
    setTimeout(() => setIndex((i) => i + 1), delay);
  };

  const restart = () => {
    setDeck(shuffle(fullDeck()));
    setIndex(0);
    setRunning(0);
    setStats({ correct: 0, total: 0, totalMs: 0 });
    setFeedback(null);
  };

  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
  const avgMs = stats.total === 0 ? 0 : Math.round(stats.totalMs / stats.total);
  const progress = (index / deck.length) * 100;

  const flashClass = useMemo(() => {
    if (!feedback) return "";
    return feedback.ok ? "ring-4 ring-emerald-400" : "ring-4 ring-red-500";
  }, [feedback]);

  return (
    <section className="felt-panel rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold">Counting Drill</h2>
        <div className="text-right space-y-0.5">
          <div className="text-xs uppercase text-muted-foreground">Running Count</div>
          <div
            className={cn(
              "text-3xl font-display font-bold",
              running >= 3 ? "text-emerald-300" : running <= -3 ? "text-purple-300" : "text-foreground",
            )}
          >
            {running > 0 ? `+${running}` : running}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Progress value={progress} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.min(index, deck.length)} / {deck.length} cards</span>
          <span>Accuracy: <span className="text-gold font-bold">{accuracy}%</span></span>
        </div>
      </div>

      {!done && card && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={cn("rounded-xl transition-all", flashClass)}>
            <PlayingCard card={card} size="lg" />
          </div>

          {feedback && !feedback.ok && (
            <div className="text-sm text-red-300">
              Correct: <span className="font-bold">{feedback.correctVal > 0 ? `+${feedback.correctVal}` : feedback.correctVal}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            {([1, 0, -1] as const).map((v) => (
              <button
                key={v}
                onClick={() => onPick(v)}
                disabled={!!feedback}
                className={cn(
                  "px-4 py-3 rounded-md font-bold text-lg border transition-all",
                  v === 1 && "bg-emerald-600/30 border-emerald-500/40 text-emerald-200",
                  v === 0 && "bg-secondary/60 border-border text-foreground",
                  v === -1 && "bg-purple-600/30 border-purple-500/40 text-purple-200",
                  !feedback && "hover:scale-[1.03]",
                  feedback && "opacity-70",
                )}
              >
                {v > 0 ? `+${v}` : v}
              </button>
            ))}
          </div>
        </div>
      )}

      {done && (
        <div className="space-y-3 py-4 text-center">
          <div className="text-2xl font-display font-bold text-gold">
            {accuracy >= 90 ? "Great job!" : accuracy >= 70 ? "Solid work — keep drilling." : "Keep practicing — you'll get there."}
          </div>
          <div className="text-sm text-muted-foreground">
            Accuracy: <span className="text-foreground font-bold">{accuracy}%</span> · Avg response:{" "}
            <span className="text-foreground font-bold">{avgMs} ms</span> · Final running count:{" "}
            <span className="text-foreground font-bold">{running}</span>
          </div>
          <Button onClick={restart} className="bg-gradient-gold text-primary-foreground">
            Restart
          </Button>
        </div>
      )}

      {!done && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={restart}>
            Restart
          </Button>
        </div>
      )}
    </section>
  );
}
