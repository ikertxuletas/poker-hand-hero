import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn Poker — Rules, Positions & Strategy | Poker Hands" },
      { name: "description", content: "Learn Texas Hold'em from the ground up: game flow, positions, actions, starting hands, post-flop play, and advanced concepts." },
      { property: "og:title", content: "Learn Poker — From Beginner to Advanced" },
      { property: "og:description", content: "A complete guide to Texas Hold'em poker: rules, strategy, and advanced concepts." },
    ],
  }),
  component: LearnPage,
});

const TABS = [
  "How to Play",
  "Positions",
  "Actions",
  "Starting Hands",
  "Post-Flop",
  "Advanced",
] as const;

type Tab = (typeof TABS)[number];

function LearnPage() {
  const [tab, setTab] = useState<Tab>("How to Play");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Learn <span className="text-gold">Poker</span></h1>
          <p className="text-sm text-muted-foreground mt-1">A practical guide to Texas Hold'em.</p>
        </header>

        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 felt-panel rounded-lg p-1.5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === t
                  ? "bg-gradient-gold text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="felt-panel rounded-xl p-5 sm:p-8">
          {tab === "How to Play" && <HowToPlay />}
          {tab === "Positions" && <Positions />}
          {tab === "Actions" && <Actions />}
          {tab === "Starting Hands" && <StartingHands />}
          {tab === "Post-Flop" && <PostFlop />}
          {tab === "Advanced" && <Advanced />}
        </section>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold mb-4">{children}</h2>;
}

function StepList({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((it, i) => (
        <li key={it.title} className="flex gap-4">
          <span className="shrink-0 w-9 h-9 rounded-full bg-gradient-gold text-primary-foreground font-bold flex items-center justify-center shadow-glow">
            {i + 1}
          </span>
          <div>
            <div className="font-semibold">{it.title}</div>
            <div className="text-sm text-muted-foreground">{it.desc}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DefList({ items }: { items: { term: string; desc: string }[] }) {
  return (
    <dl className="grid sm:grid-cols-2 gap-3">
      {items.map(it => (
        <div key={it.term} className="rounded-lg border border-border/60 bg-secondary/40 p-4">
          <dt className="font-semibold text-gold">{it.term}</dt>
          <dd className="text-sm text-muted-foreground mt-1">{it.desc}</dd>
        </div>
      ))}
    </dl>
  );
}

function HowToPlay() {
  return (
    <div>
      <SectionTitle>Texas Hold'em Game Flow</SectionTitle>
      <StepList items={[
        { title: "Blinds", desc: "The two players left of the dealer post the small blind and big blind — forced bets that build a pot before any cards are dealt." },
        { title: "Hole Cards", desc: "Each player is dealt 2 private cards face-down. First betting round begins with the player left of the big blind." },
        { title: "The Flop", desc: "Three community cards are dealt face-up. A second betting round starts with the first active player left of the dealer." },
        { title: "The Turn", desc: "A fourth community card is dealt. Bets typically double in size in limit games. Another betting round follows." },
        { title: "The River", desc: "The fifth and final community card is dealt. Final betting round — your last chance to value bet, bluff, or fold." },
        { title: "Showdown", desc: "Remaining players reveal hole cards. Best 5-card hand using any combination of hole and community cards wins the pot." },
      ]} />
    </div>
  );
}

function Positions() {
  return (
    <div>
      <SectionTitle>Table Positions</SectionTitle>
      <p className="text-sm text-muted-foreground mb-4">Position determines when you act. Acting later = more information = a bigger advantage.</p>
      <DefList items={[
        { term: "BTN — Button (Dealer)", desc: "Best position. Acts last on every post-flop street. Play the widest range here." },
        { term: "CO — Cutoff", desc: "Right of the button. Second-best position; great for stealing blinds with raises." },
        { term: "HJ — Hijack", desc: "Two seats right of the button. Late position; open with a moderately wide range." },
        { term: "MP — Middle Position", desc: "Solid hands only. Players behind you can still 3-bet or call to act in position." },
        { term: "UTG — Under the Gun", desc: "First to act preflop. Tightest range — you're out of position against the entire table." },
        { term: "SB — Small Blind", desc: "Posts half the big blind. Acts first post-flop; worst position despite already having money in." },
        { term: "BB — Big Blind", desc: "Posts a full bet. Last to act preflop, but first (after SB) post-flop. Defend with a wide range vs late raises." },
      ]} />
    </div>
  );
}

function Actions() {
  return (
    <div>
      <SectionTitle>Player Actions</SectionTitle>
      <DefList items={[
        { term: "Fold", desc: "Surrender your hand and any chips already in the pot. Costs nothing more." },
        { term: "Check", desc: "Pass the action with no bet. Only available when no one has bet this round." },
        { term: "Call", desc: "Match the current bet to stay in the hand." },
        { term: "Bet", desc: "Put chips in the pot when no one else has bet. Opens the action." },
        { term: "Raise", desc: "Increase the size of the existing bet. Forces others to call more, fold, or re-raise." },
        { term: "3-Bet", desc: "A re-raise of the original raise. Often a strong-hand or pressure move preflop." },
        { term: "All-In", desc: "Push every chip you have. You can't be forced out, but you can only win up to your stack." },
      ]} />
      <h3 className="font-display text-xl font-bold mt-8 mb-3">Bet Sizing Guide</h3>
      <DefList items={[
        { term: "Preflop Open", desc: "Standard open is 2.5×–3× the big blind. Add 1 BB per limper before you." },
        { term: "C-Bet (Continuation)", desc: "33–66% of pot on dry boards, 66–100% on wet boards." },
        { term: "Value Bet", desc: "Size to get called by worse hands — 50–75% of pot is the sweet spot." },
        { term: "Bluff", desc: "Size matches your value bets so opponents can't tell them apart." },
        { term: "Overbet", desc: "Bigger than the pot. Polarizing — represents the nuts or a pure bluff." },
      ]} />
    </div>
  );
}

function StartingHands() {
  const tiers = [
    { tier: "Premium", color: "text-gold", hands: "AA, KK, QQ, AKs", desc: "Raise and re-raise from any position. Always playable." },
    { tier: "Strong", color: "text-gold/80", hands: "JJ, TT, AQs, AKo, AJs, KQs", desc: "Open-raise from any position; call 3-bets from late position." },
    { tier: "Playable", color: "text-foreground", hands: "99, 88, 77, KQo, AJo, ATs, KJs, QJs", desc: "Open from middle/late position. Be cautious vs early raises." },
    { tier: "Speculative", color: "text-foreground/80", hands: "Suited connectors (T9s, 98s, 87s), small pairs, suited aces", desc: "Play in late position or multiway pots — looking to flop big and stack someone." },
    { tier: "Muck / Trash", color: "text-destructive", hands: "72o, 83o, J4o, Q3o, weak offsuit gappers", desc: "Fold without thinking. The biggest leak in poker is playing junk hands." },
  ];
  return (
    <div>
      <SectionTitle>Starting Hand Tiers</SectionTitle>
      <p className="text-sm text-muted-foreground mb-4">Notation: <span className="font-mono">s</span> = suited, <span className="font-mono">o</span> = offsuit. Adjust ranges based on position and stack depth.</p>
      <div className="space-y-3">
        {tiers.map(t => (
          <div key={t.tier} className="rounded-lg border border-border/60 bg-secondary/40 p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className={cn("font-display text-lg font-bold", t.color)}>{t.tier}</div>
              <div className="font-mono text-sm">{t.hands}</div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostFlop() {
  return (
    <div>
      <SectionTitle>Post-Flop Concepts</SectionTitle>
      <h3 className="font-display text-xl font-bold mb-3">Hand Categories on the Flop</h3>
      <DefList items={[
        { term: "Made Hand", desc: "You have a pair or better right now. Decide whether to bet for value or slow-play." },
        { term: "Strong Draw", desc: "Open-ended straight or flush draw — 8–9 outs. Can be played aggressively as a semi-bluff." },
        { term: "Weak Draw", desc: "Gutshot, overcards, or backdoor draws. Usually check/fold without other equity." },
        { term: "Air", desc: "Nothing. Either give up or pure bluff with a clear story." },
      ]} />
      <h3 className="font-display text-xl font-bold mt-8 mb-3">Board Texture</h3>
      <DefList items={[
        { term: "Wet", desc: "Connected and/or suited (e.g. 9♥ T♥ J♣). Many draws possible — bet bigger to deny equity." },
        { term: "Dry", desc: "Disconnected, no flush draw (e.g. K♠ 7♦ 2♣). Few draws — small c-bets work well." },
        { term: "Paired", desc: "Two cards of the same rank (e.g. 8♠ 8♣ 3♦). Reduces opponent's likely range; trips/full houses possible." },
        { term: "Rainbow", desc: "Three different suits — no flush draw possible. Safer to barrel multiple streets." },
        { term: "Monotone", desc: "All three cards the same suit. Anyone with that suit has a flush or strong draw — proceed carefully." },
      ]} />
    </div>
  );
}

function Advanced() {
  return (
    <div>
      <SectionTitle>Advanced Concepts</SectionTitle>
      <DefList items={[
        { term: "Pot Odds", desc: "Formula: call ÷ (pot + call). If a $20 call into a $60 pot = 20/80 = 25% — you need >25% equity to call profitably." },
        { term: "Outs & Rule of 2 & 4", desc: "Multiply outs by 2 for next-card equity, by 4 with two cards to come. Flush draw = 9 outs ≈ 36% by river." },
        { term: "Ranges Thinking", desc: "Stop guessing exact hands. Assign opponents a range of hands consistent with their actions and play vs the whole range." },
        { term: "GTO vs Exploitative", desc: "GTO = unexploitable balanced strategy. Exploitative = deviating to punish specific player tendencies. Use GTO as default, exploit known leaks." },
        { term: "Bankroll Management", desc: "Cash games: 20–30 buy-ins minimum. Tournaments: 50–100 buy-ins. Move down stakes when you drop below threshold." },
        { term: "Position + Aggression", desc: "The two cornerstones of winning poker. Play more hands in position, and be the one applying pressure rather than calling." },
      ]} />
    </div>
  );
}
