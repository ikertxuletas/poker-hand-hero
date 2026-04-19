import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
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

interface Round {
  a: Card[];
  b: Card[];
  evalA: HandInfo;
  evalB: HandInfo;
  winner: "a" | "b" | "tie";
}

function newRound(): Round {
  // ensure two distinct hands with a clear winner
  for (let i = 0; i < 100; i++) {
    const deck = shuffle(fullDeck());
    const a = deck.slice(0, 5);
    const b = deck.slice(5, 10);
    const evalA = evaluateHand(a);
    const evalB = evaluateHand(b);
    const cmp = compareHands(evalA, evalB);
    if (cmp !== 0) {
      return { a, b, evalA, evalB, winner: cmp > 0 ? "a" : "b" };
    }
  }
  const deck = shuffle(fullDeck());
  const a = deck.slice(0, 5);
  const b = deck.slice(5, 10);
  return { a, b, evalA: evaluateHand(a), evalB: evaluateHand(b), winner: "tie" };
}

function QuizPage() {
  const [round, setRound] = useState<Round>(() => newRound());
  const [pick, setPick] = useState<"a" | "b" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const choose = useCallback((side: "a" | "b") => {
    if (pick) return;
    setPick(side);
    setScore(s => ({
      correct: s.correct + (side === round.winner ? 1 : 0),
      total: s.total + 1,
    }));
  }, [pick, round.winner]);

  const next = () => { setRound(newRound()); setPick(null); };

  const correct = pick !== null && pick === round.winner;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
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

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {(["a", "b"] as const).map(side => {
            const cards = round[side];
            const info = side === "a" ? round.evalA : round.evalB;
            const isWinner = round.winner === side;
            const isPicked = pick === side;
            return (
              <button
                key={side}
                onClick={() => choose(side)}
                disabled={!!pick}
                className={cn(
                  "felt-panel rounded-2xl p-5 sm:p-6 text-left transition-all",
                  !pick && "hover:-translate-y-1 hover:shadow-glow cursor-pointer",
                  pick && isWinner && "ring-2 ring-gold shadow-glow",
                  pick && !isWinner && isPicked && "ring-2 ring-destructive opacity-80",
                  pick && !isWinner && !isPicked && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Hand {side.toUpperCase()}
                  </span>
                  {pick && (
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded",
                      isWinner ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground",
                    )}>
                      {isWinner ? "WINNER" : "—"}
                    </span>
                  )}
                </div>
                <CardRow cards={cards} size="sm" className="justify-center mb-4" />
                {pick && (
                  <div className="text-center">
                    <div className="font-display text-lg font-bold">{info.name}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          {pick ? (
            <div className="space-y-4">
              <p className={cn("text-xl font-bold", correct ? "text-gold" : "text-destructive")}>
                {correct ? "Correct! 🎉" : "Not quite."}
              </p>
              <button
                onClick={next}
                className="px-6 py-3 rounded-md bg-gradient-gold text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-transform"
              >
                Next hand →
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Pick the stronger hand to continue.</p>
          )}
        </div>
      </main>
    </div>
  );
}
