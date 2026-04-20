import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlayingCard } from "@/components/PlayingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Card } from "@/lib/poker";

export const Route = createFileRoute("/coach")({
  component: CoachPage,
});

type Street = "preflop" | "flop" | "turn" | "river";

interface DecisionOption {
  label: string;
  correct: boolean;
  explanation: string;
  equity?: string;
}

interface Decision {
  street: Street;
  prompt: string;
  options: DecisionOption[];
}

interface Scenario {
  id: string;
  title: string;
  concept: string;
  position: string;
  holeCards: Card[];
  villain: string;
  stacksBB: number;
  decisions: Decision[];
  board: { flop?: Card[]; turn?: Card; river?: Card };
}

const c = (rank: Card["rank"], suit: Card["suit"]): Card => ({ rank, suit });

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    title: "BTN vs UTG — 3-Bet or Fold",
    concept: "3-Bet or Fold",
    position: "BTN",
    holeCards: [c("A", "♥"), c("J", "♠")],
    villain: "UTG raises to 3bb, folds to you",
    stacksBB: 100,
    board: {},
    decisions: [
      {
        street: "preflop",
        prompt: "UTG raises 3bb. Folds to you on BTN. Action?",
        options: [
          { label: "Fold", correct: false, explanation: "AJo on BTN has 43% equity vs UTG range. You're getting 3.5:1, folding gives up too much value.", equity: "43% vs UTG range" },
          { label: "Call", correct: false, explanation: "Calling is fine but you play post-flop out of position against a strong UTG range." },
          { label: "Raise to 9bb", correct: true, explanation: "3-betting AJo on BTN applies pressure, takes initiative, and wins the pot outright often. Correct play." },
        ],
      },
    ],
  },
  {
    id: "s2",
    title: "C-Bet on a Dry Board",
    concept: "C-Bet Dry Board",
    position: "BTN",
    holeCards: [c("K", "♠"), c("Q", "♦")],
    villain: "BB calls your pre-flop raise",
    stacksBB: 100,
    board: { flop: [c("7", "♣"), c("2", "♦"), c("4", "♠")] },
    decisions: [
      {
        street: "flop",
        prompt: "Flop 7♣2♦4♠. BB checks to you. You have K-high, no pair.",
        options: [
          { label: "Check", correct: false, explanation: "You have range advantage on this dry board. Checking gives up equity." },
          { label: "Bet ½ pot", correct: true, explanation: "Correct. Dry board favours the pre-flop raiser. A small c-bet with any two cards prints money here long-term." },
          { label: "Bet pot", correct: false, explanation: "Overbetting a dry board where you miss is too much. ½ pot achieves the same fold equity cheaper." },
        ],
      },
    ],
  },
  {
    id: "s3",
    title: "Facing a Flop Check-Raise",
    concept: "Defending TPTK",
    position: "BTN",
    holeCards: [c("A", "♠"), c("K", "♣")],
    villain: "BB check-raises 3x your ½ pot c-bet",
    stacksBB: 100,
    board: { flop: [c("A", "♥"), c("8", "♦"), c("3", "♣")] },
    decisions: [
      {
        street: "flop",
        prompt: "Flop A♥8♦3♣. You bet ½ pot, villain check-raises 3x. Action?",
        options: [
          { label: "Fold", correct: false, explanation: "Top pair top kicker vs a check-raise is too strong to fold. You have 72% equity vs most semi-bluff/two-pair combos.", equity: "72% vs raising range" },
          { label: "Call", correct: true, explanation: "Correct. Call and re-evaluate the turn. You beat all bluffs and most value hands here." },
          { label: "Re-raise", correct: false, explanation: "4-betting here turns your hand into a bluff-catcher role and bloats the pot unnecessarily." },
        ],
      },
    ],
  },
  {
    id: "s4",
    title: "Pot Odds Call on the Turn",
    concept: "Implied Odds",
    position: "BB",
    holeCards: [c("9", "♥"), c("8", "♥")],
    villain: "Villain bets pot on the turn",
    stacksBB: 80,
    board: { flop: [c("K", "♥"), c("7", "♥"), c("2", "♣")], turn: c("3", "♦") },
    decisions: [
      {
        street: "turn",
        prompt: "Board K♥7♥2♣3♦. You have a flush draw (9 outs). Villain bets pot.",
        options: [
          { label: "Fold", correct: false, explanation: "You have 9 outs to a flush. Rule of 2: 9 × 2 = 18% equity. Pot odds are 33% — too expensive on raw odds, but implied odds save the call." },
          { label: "Call", correct: true, explanation: "Marginal but correct with implied odds. If you hit the flush on the river, you can win villain's entire stack. Factor implied odds in — call.", equity: "18% raw, +implied" },
          { label: "Raise", correct: false, explanation: "Semi-bluffing here against a pot bet is too risky. You're behind and raising charges yourself." },
        ],
      },
    ],
  },
  {
    id: "s5",
    title: "Value Betting the River Thin",
    concept: "Thin Value",
    position: "BTN",
    holeCards: [c("Q", "♦"), c("J", "♣")],
    villain: "Villain checks to you on river",
    stacksBB: 100,
    board: { flop: [c("Q", "♠"), c("8", "♥"), c("4", "♦")], turn: c("2", "♣"), river: c("J", "♦") },
    decisions: [
      {
        street: "river",
        prompt: "Board Q♠8♥4♦2♣J♦. You have two pair. Villain checks. Action?",
        options: [
          { label: "Check", correct: false, explanation: "Two pair on a clean board is strong. Checking gives up value — villain can call a bet with worse pairs." },
          { label: "Bet ½ pot", correct: true, explanation: "Correct. Thin value bet. You beat all one-pair hands and some two-pair combos. Get paid." },
          { label: "Bet 2x pot", correct: false, explanation: "Overbetting for value on this board only gets called by better hands. Size down." },
        ],
      },
    ],
  },
  {
    id: "s6",
    title: "Bluff Catch or Fold",
    concept: "Polarised Overbet",
    position: "BB",
    holeCards: [c("K", "♣"), c("T", "♦")],
    villain: "Villain bets 2x pot on river",
    stacksBB: 100,
    board: { flop: [c("K", "♦"), c("9", "♥"), c("4", "♠")], turn: c("2", "♣"), river: c("7", "♦") },
    decisions: [
      {
        street: "river",
        prompt: "Board K♦9♥4♠2♣7♦. You have top pair. Villain overbets 2x pot.",
        options: [
          { label: "Fold", correct: true, explanation: "Correct. A 2x pot river bet is extremely polarised. Villain's bluffs are few here. Top pair is beat by two pair, sets, and straights that take this line. Fold." },
          { label: "Call", correct: false, explanation: "Against a 2x pot overbet, you need 33% equity just to break even. Villain's value range crushes KT here." },
        ],
      },
    ],
  },
  {
    id: "s7",
    title: "Squeeze Pre-Flop",
    concept: "Squeeze Play",
    position: "CO",
    holeCards: [c("Q", "♠"), c("Q", "♦")],
    villain: "UTG raises 3bb, HJ calls",
    stacksBB: 100,
    board: {},
    decisions: [
      {
        street: "preflop",
        prompt: "UTG raises 3bb. HJ calls. You have QQ in CO. Action?",
        options: [
          { label: "Fold", correct: false, explanation: "QQ is a premium hand. Folding pre-flop to a raise and call is a massive mistake." },
          { label: "Call", correct: false, explanation: "Calling with QQ lets multiple players see the flop cheap. You're vulnerable to overcards." },
          { label: "Raise to 12bb", correct: true, explanation: "Correct — this is a squeeze. Isolate UTG, punish the cold-caller, and go heads-up with a premium hand. Make it 3-4x the last raise." },
        ],
      },
    ],
  },
  {
    id: "s8",
    title: "Defend or Fold the Big Blind",
    concept: "BB Defence",
    position: "BB",
    holeCards: [c("7", "♠"), c("6", "♠")],
    villain: "BTN raises to 2.5bb, SB folds",
    stacksBB: 100,
    board: {},
    decisions: [
      {
        street: "preflop",
        prompt: "BTN raises 2.5bb. SB folds. You have 76s in BB. Action?",
        options: [
          { label: "Fold", correct: false, explanation: "You only need to call 1.5bb into a pot of 4bb. That's 37% pot odds. 76s has 38% equity vs BTN range — defend." },
          { label: "Call", correct: true, explanation: "Correct. 76 suited has excellent implied odds. You can flop straights, flushes, two pairs. Price is right.", equity: "38% vs BTN range" },
          { label: "3-bet", correct: false, explanation: "3-betting 76s from BB vs BTN is a light squeeze — viable at higher levels but not recommended for learners." },
        ],
      },
    ],
  },
];

const STREETS: Street[] = ["preflop", "flop", "turn", "river"];
const STREET_LABEL: Record<Street, string> = {
  preflop: "Pre-Flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
};

type Mode = "guided" | "test";

function CoachPage() {
  const [mode, setMode] = useState<Mode>("guided");
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];
  const decision = scenario.decisions[stepIdx];
  const finished = stepIdx >= scenario.decisions.length;

  function newScenario() {
    let next = Math.floor(Math.random() * SCENARIOS.length);
    if (SCENARIOS.length > 1 && next === scenarioIdx) next = (next + 1) % SCENARIOS.length;
    setScenarioIdx(next);
    setStepIdx(0);
    setPicks([]);
    setRevealed(false);
  }

  function pick(i: number) {
    if (revealed) return;
    setPicks(p => [...p, i]);
    setRevealed(true);
  }

  function next() {
    setRevealed(false);
    setStepIdx(s => s + 1);
  }

  // determine board cards visible at current street
  const visibleStreets: Street[] = useMemo(() => {
    const upTo = finished ? "river" : decision.street;
    const idx = STREETS.indexOf(upTo);
    return STREETS.slice(0, idx + 1);
  }, [decision, finished]);

  const showFlop = visibleStreets.includes("flop") && scenario.board.flop;
  const showTurn = visibleStreets.includes("turn") && scenario.board.turn;
  const showRiver = visibleStreets.includes("river") && scenario.board.river;

  const correctCount = picks.reduce((acc, p, i) => acc + (scenario.decisions[i].options[p].correct ? 1 : 0), 0);
  const wrongStreets = picks
    .map((p, i) => (scenario.decisions[i].options[p].correct ? null : scenario.decisions[i].street))
    .filter((s): s is Street => s !== null);

  let verdict = "Sharp play";
  if (finished) {
    const ratio = correctCount / scenario.decisions.length;
    if (ratio < 0.5) verdict = "Study this spot";
    else if (ratio < 1) verdict = "Room to improve";
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Mode toggle + new scenario */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            {(["guided", "test"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  mode === m ? "bg-gradient-gold text-primary-foreground" : "bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "guided" ? "Guided" : "Test"}
              </button>
            ))}
          </div>
          <Button onClick={newScenario} variant="secondary">New Scenario</Button>
        </div>

        {/* Progress */}
        <div className="felt-panel rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            {STREETS.map((s, i) => {
              const usedStreets = scenario.decisions.map(d => d.street);
              const isUsed = usedStreets.includes(s);
              const currentStreet = finished ? "river" : decision.street;
              const isCurrent = s === currentStreet && !finished;
              return (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex-1 text-center px-2 py-1.5 rounded font-semibold tracking-wide",
                      isCurrent && "bg-gradient-gold text-primary-foreground shadow-glow",
                      !isCurrent && isUsed && "bg-secondary/60 text-foreground",
                      !isCurrent && !isUsed && "bg-secondary/20 text-muted-foreground/60",
                    )}
                  >
                    {STREET_LABEL[s]}
                  </div>
                  {i < STREETS.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scenario context */}
        <div className="felt-panel rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{scenario.concept}</div>
              <h2 className="font-display text-xl font-bold">{scenario.title}</h2>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">Pos: {scenario.position}</Badge>
              <Badge variant="secondary">{scenario.stacksBB}bb</Badge>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">{scenario.villain}</div>

          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Your hand</div>
              <div className="flex gap-1.5">
                {scenario.holeCards.map((card, i) => (
                  <PlayingCard key={i} card={card} size="sm" />
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Board</div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <PlayingCard key={`f${i}`} card={showFlop ? scenario.board.flop![i] : undefined} size="sm" />
                ))}
                <PlayingCard card={showTurn ? scenario.board.turn : undefined} size="sm" />
                <PlayingCard card={showRiver ? scenario.board.river : undefined} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Decision or summary */}
        {!finished ? (
          <div className="felt-panel rounded-lg p-4 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{STREET_LABEL[decision.street]} decision</div>
              <p className="text-base mt-1">{decision.prompt}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {decision.options.map((opt, i) => {
                const picked = picks[stepIdx];
                const isPicked = revealed && picked === i;
                const showGuide = mode === "guided" && !revealed && opt.correct;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={revealed}
                    className={cn(
                      "rounded-md border px-4 py-3 text-sm font-semibold transition-all text-left",
                      "bg-secondary/40 border-border hover:bg-secondary/70",
                      showGuide && "ring-2 ring-gold shadow-glow",
                      isPicked && opt.correct && "bg-emerald-500/20 border-emerald-500 text-emerald-200",
                      isPicked && !opt.correct && "bg-destructive/20 border-destructive text-destructive-foreground",
                      revealed && !isPicked && opt.correct && "ring-2 ring-gold/70",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {decision.options[picks[stepIdx]].correct ? (
                    <Badge className="bg-emerald-500/20 text-emerald-200 border-transparent">✓ Correct</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Incorrect</Badge>
                  )}
                  {decision.options[picks[stepIdx]].equity && (
                    <Badge variant="secondary">{decision.options[picks[stepIdx]].equity}</Badge>
                  )}
                </div>
                <p className="text-sm text-foreground/90">{decision.options[picks[stepIdx]].explanation}</p>
                {!decision.options[picks[stepIdx]].correct && (
                  <p className="text-xs text-muted-foreground">
                    Correct answer: <span className="text-gold font-semibold">{decision.options.find(o => o.correct)?.label}</span> — {decision.options.find(o => o.correct)?.explanation}
                  </p>
                )}
                <div className="flex justify-end pt-1">
                  <Button onClick={next} size="sm">
                    {stepIdx + 1 < scenario.decisions.length ? "Continue →" : "See Summary →"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="felt-panel rounded-lg p-5 space-y-3 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Hand complete</div>
            <h3 className="font-display text-2xl font-bold text-gold">{verdict}</h3>
            <p className="text-sm text-muted-foreground">
              {correctCount} / {scenario.decisions.length} correct
              {wrongStreets.length > 0 && (
                <> · misplayed: {wrongStreets.map(s => STREET_LABEL[s]).join(", ")}</>
              )}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button onClick={newScenario}>New Scenario</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setStepIdx(0);
                  setPicks([]);
                  setRevealed(false);
                }}
              >
                Replay
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
