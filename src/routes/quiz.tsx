import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CardRow } from "@/components/PlayingCard";
import {
  type Card, type HandInfo, fullDeck, shuffle, evaluateHand, compareHands,
} from "@/lib/poker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Which Poker Hand Wins? | Poker Hands" },
      { name: "description", content: "Test your poker knowledge: pick which of two hands wins each round." },
      { property: "og:title", content: "Poker Quiz: Which Hand Wins?" },
      { property: "og:description", content: "Sharpen your poker ranking instincts in this fast quiz." },
    ],
  }),
  component: QuizPage,
});

type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

const HAND_RARITY: Record<string, number> = {
  "royal-flush": 0.0002,
  "straight-flush": 0.0014,
  "four-of-a-kind": 0.024,
  "full-house": 0.14,
  "flush": 0.2,
  "straight": 0.39,
  "three-of-a-kind": 2.1,
  "two-pair": 4.75,
  "one-pair": 42.3,
  "high-card": 50.1,
};

function rarityLabel(category: string): string {
  const pct = HAND_RARITY[category];
  if (pct === undefined) return "";
  return `Top ${pct < 0.01 ? pct.toFixed(4) : pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}% of all hands`;
}
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Expert"];
const TIMER_SECONDS = 20;

interface Round {
  // displayed cards (5 in classic, 2 in expert per side)
  a: Card[];
  b: Card[];
  community: Card[]; // empty unless Expert
  evalA: HandInfo;
  evalB: HandInfo;
  winner: "a" | "b" | "tie";
}

function newRound(difficulty: Difficulty): Round {
  for (let i = 0; i < 100; i++) {
    const deck = shuffle(fullDeck());
    if (difficulty === "Expert") {
      const community = deck.slice(0, 5);
      const aHole = deck.slice(5, 7);
      const bHole = deck.slice(7, 9);
      const evalA = evaluateHand([...aHole, ...community]);
      const evalB = evaluateHand([...bHole, ...community]);
      const cmp = compareHands(evalA, evalB);
      if (cmp !== 0) {
        return { a: aHole, b: bHole, community, evalA, evalB, winner: cmp > 0 ? "a" : "b" };
      }
    } else {
      const a = deck.slice(0, 5);
      const b = deck.slice(5, 10);
      const evalA = evaluateHand(a);
      const evalB = evaluateHand(b);
      const cmp = compareHands(evalA, evalB);
      if (cmp !== 0) {
        return { a, b, community: [], evalA, evalB, winner: cmp > 0 ? "a" : "b" };
      }
    }
  }
  // Fallback (likely tie)
  const deck = shuffle(fullDeck());
  if (difficulty === "Expert") {
    const community = deck.slice(0, 5);
    const aHole = deck.slice(5, 7);
    const bHole = deck.slice(7, 9);
    return {
      a: aHole, b: bHole, community,
      evalA: evaluateHand([...aHole, ...community]),
      evalB: evaluateHand([...bHole, ...community]),
      winner: "tie",
    };
  }
  const a = deck.slice(0, 5);
  const b = deck.slice(5, 10);
  return { a, b, community: [], evalA: evaluateHand(a), evalB: evaluateHand(b), winner: "tie" };
}

function QuizPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [round, setRound] = useState<Round>(() => newRound("Intermediate"));
  const [pick, setPick] = useState<"a" | "b" | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const revealed = pick !== null || timedOut;

  const choose = useCallback((side: "a" | "b") => {
    if (revealed) return;
    setPick(side);
    if (round.winner === "tie") {
      // tie: don't count
      setScore(s => ({ correct: s.correct, total: s.total }));
    } else {
      setScore(s => ({
        correct: s.correct + (side === round.winner ? 1 : 0),
        total: s.total + 1,
      }));
    }
  }, [revealed, round.winner]);

  const next = () => {
    setRound(newRound(difficulty));
    setPick(null);
    setTimedOut(false);
    setTimeLeft(TIMER_SECONDS);
  };

  // Advanced timer
  useEffect(() => {
    if (difficulty !== "Advanced") return;
    if (revealed) return;
    setTimeLeft(TIMER_SECONDS);
    const start = Date.now();
    const id = setInterval(() => {
      const left = TIMER_SECONDS - Math.floor((Date.now() - start) / 1000);
      if (left <= 0) {
        clearInterval(id);
        setTimeLeft(0);
        setTimedOut(true);
        if (round.winner !== "tie") {
          setScore(s => ({ correct: s.correct, total: s.total + 1 }));
        }
      } else {
        setTimeLeft(left);
      }
    }, 200);
    return () => clearInterval(id);
  }, [difficulty, round, revealed]);

  // Reset on difficulty change
  const changeDifficulty = (d: Difficulty) => {
    if (d === difficulty) return;
    setDifficulty(d);
    setRound(newRound(d));
    setPick(null);
    setTimedOut(false);
    setTimeLeft(TIMER_SECONDS);
    setScore({ correct: 0, total: 0 });
  };

  const isTie = round.winner === "tie";
  const correct = pick !== null && pick === round.winner;

  const feedback = useMemo(() => {
    if (!revealed) return null;
    if (isTie && pick) return { text: "It's a tie — rare but it happens!", tone: "gold" as const };
    if (timedOut && !pick) return { text: "Time's up! Counted as wrong.", tone: "bad" as const };
    if (correct) return { text: "Correct! 🎉", tone: "gold" as const };
    return { text: "Not quite.", tone: "bad" as const };
  }, [revealed, isTie, pick, timedOut, correct]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Which hand <span className="text-gold">wins?</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Tap the winning hand.</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Score</div>
            <div className="font-display text-2xl sm:text-3xl font-bold text-gold">
              {score.correct}<span className="text-muted-foreground">/{score.total}</span>
            </div>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 felt-panel rounded-lg p-1.5">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => changeDifficulty(d)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                difficulty === d
                  ? "bg-gradient-gold text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Advanced timer */}
        {difficulty === "Advanced" && (
          <div className="mb-4 flex items-center justify-center">
            <div className={cn(
              "font-display text-2xl font-bold tabular-nums px-4 py-1.5 rounded-md felt-panel",
              timeLeft <= 5 ? "text-destructive" : "text-foreground",
            )}>
              ⏱ {timeLeft}s
            </div>
          </div>
        )}

        {/* Expert: community cards */}
        {difficulty === "Expert" && (
          <div className="mb-6 felt-panel rounded-xl p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 text-center">Community</div>
            <CardRow cards={round.community} size="sm" className="justify-center" />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {(["a", "b"] as const).map(side => {
            const cards = round[side];
            const info = side === "a" ? round.evalA : round.evalB;
            const isWinner = round.winner === side;
            const isPicked = pick === side;
            const tieHighlight = revealed && isTie;
            return (
              <button
                key={side}
                onClick={() => choose(side)}
                disabled={revealed}
                className={cn(
                  "felt-panel rounded-2xl p-5 sm:p-6 text-left transition-all",
                  !revealed && "hover:-translate-y-1 hover:shadow-glow cursor-pointer",
                  revealed && isWinner && !isTie && "ring-2 ring-gold shadow-glow",
                  tieHighlight && "ring-2 ring-gold shadow-glow",
                  revealed && !isWinner && !isTie && isPicked && "ring-2 ring-destructive opacity-80",
                  revealed && !isWinner && !isTie && !isPicked && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between mb-4 gap-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Hand {side.toUpperCase()}
                  </span>
                  {difficulty === "Beginner" && !revealed && (
                    <span className="text-xs font-bold px-2 py-1 rounded bg-secondary/70 text-foreground">
                      {info.name}
                    </span>
                  )}
                  {revealed && (
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded",
                      tieHighlight
                        ? "bg-gold/20 text-gold"
                        : isWinner
                        ? "bg-gold/20 text-gold"
                        : "bg-muted text-muted-foreground",
                    )}>
                      {tieHighlight ? "TIE" : isWinner ? "WINNER" : "—"}
                    </span>
                  )}
                </div>
                <CardRow cards={cards} size="sm" className="justify-center mb-4" />
                {revealed && (
                  <div className="text-center space-y-2">
                    <div className="font-display text-lg font-bold">{info.name}</div>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-secondary/60 text-muted-foreground">
                      {rarityLabel(info.category)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          {revealed && feedback ? (
            <div className="space-y-4">
              <p className={cn("text-xl font-bold", feedback.tone === "gold" ? "text-gold" : "text-destructive")}>
                {feedback.text}
              </p>
              <button
                onClick={next}
                className="px-6 py-3 rounded-md bg-gradient-gold text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-transform"
              >
                Next hand →
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {difficulty === "Expert" ? "Pick the player whose 2 hole cards make the best 7-card hand." : "Pick the stronger hand to continue."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
