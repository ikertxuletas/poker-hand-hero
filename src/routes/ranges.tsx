import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranges")({
  head: () => ({
    meta: [
      { title: "Preflop Ranges by Position | Poker Hands" },
      { name: "description", content: "Visualize opening ranges for every position in Texas Hold'em with a 13×13 grid." },
      { property: "og:title", content: "Preflop Ranges — Poker Hands" },
      { property: "og:description", content: "See which hands to raise, call, or fold from UTG, MP, HJ, CO, BTN, SB, and BB." },
    ],
  }),
  component: RangesPage,
});

type Position = "UTG" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB";
type Action = "raise" | "call" | "fold";

const POSITIONS: Position[] = ["UTG", "MP", "HJ", "CO", "BTN", "SB", "BB"];
const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

// Hardcoded raise ranges per position (cumulative as specified)
const UTG_RAISE = ["AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs","ATs","AKo","AQo","KQs","KJs"];
const MP_RAISE = [...UTG_RAISE, "77","66","A9s","A8s","KTs","QJs","QTs","JTs","KQo"];
const HJ_RAISE = [...MP_RAISE, "55","A7s","A6s","A5s","KJo","QJo","T9s"];
const CO_RAISE = [...HJ_RAISE, "44","33","A4s","A3s","A2s","K9s","Q9s","J9s","T8s","98s","AJo","ATo","KTo"];
const BTN_RAISE = [...CO_RAISE, "22","K8s","K7s","K6s","K5s","K4s","K3s","K2s","Q8s","J8s","T7s","97s","87s","76s","65s","54s","A9o","A8o","A7o","QTo","JTo"];
const SB_RAISE = [...CO_RAISE, "K8s","K7s","Q8s","J8s","T8s","97s","87s","76s","A9o","A8o","KTo","QTo"];
const BB_DEFEND = [...SB_RAISE, "22","33","44","K6s","K5s","K4s","K3s","K2s","Q7s","Q6s","Q5s","J7s","T7s","96s","86s","75s","64s","53s","43s","A5o","A4o","A3o","A2o","K9o","Q9o","J9o","T9o"];

const POSITION_DATA: Record<Position, { raise: string[]; call: string[]; pct: number; combos: number; label: string }> = {
  UTG: { raise: dedupe(UTG_RAISE), call: [], pct: 9, combos: 120, label: "Under the Gun" },
  MP: { raise: dedupe(MP_RAISE), call: [], pct: 15, combos: 200, label: "Middle Position" },
  HJ: { raise: dedupe(HJ_RAISE), call: [], pct: 20, combos: 265, label: "Hijack" },
  CO: { raise: dedupe(CO_RAISE), call: [], pct: 27, combos: 360, label: "Cutoff" },
  BTN: { raise: dedupe(BTN_RAISE), call: [], pct: 45, combos: 600, label: "Button" },
  SB: { raise: dedupe(SB_RAISE), call: [], pct: 38, combos: 505, label: "Small Blind" },
  // BB defends with mostly calls vs BTN open
  BB: { raise: dedupe(["AA","KK","QQ","JJ","AKs","AKo"]), call: dedupe(BB_DEFEND.filter(h => !["AA","KK","QQ","JJ","AKs","AKo"].includes(h))), pct: 55, combos: 730, label: "Big Blind (vs BTN)" },
};

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function handName(rowIdx: number, colIdx: number): string {
  const r1 = RANKS[rowIdx];
  const r2 = RANKS[colIdx];
  if (rowIdx === colIdx) return `${r1}${r2}`;
  if (rowIdx < colIdx) return `${r1}${r2}s`; // top-right = suited
  return `${r2}${r1}o`; // bottom-left = offsuit (higher rank first)
}

function combosFor(rowIdx: number, colIdx: number): number {
  if (rowIdx === colIdx) return 6;
  if (rowIdx < colIdx) return 4;
  return 12;
}

// Rough heuristic equity vs random hand (just for tooltip flavor)
function equityVsRandom(name: string): number {
  if (name === "AA") return 85;
  if (name === "KK") return 82;
  if (name === "QQ") return 80;
  if (name === "JJ") return 77;
  if (name === "TT") return 75;
  if (/^[AKQJT99887766554433]{2}$/.test(name) && name[0] === name[1]) return 70;
  if (name.endsWith("s")) {
    if (name.startsWith("A")) return 65;
    if (name.startsWith("K")) return 60;
    return 55;
  }
  if (name.endsWith("o")) {
    if (name.startsWith("A")) return 58;
    if (name.startsWith("K")) return 53;
    return 45;
  }
  return 50;
}

function RangesPage() {
  const [position, setPosition] = useState<Position>("BTN");
  const [hover, setHover] = useState<{ name: string; action: Action; combos: number } | null>(null);

  const data = POSITION_DATA[position];
  const raiseSet = useMemo(() => new Set(data.raise), [data.raise]);
  const callSet = useMemo(() => new Set(data.call), [data.call]);

  const stats = useMemo(() => {
    let raiseCombos = 0;
    let callCombos = 0;
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const name = handName(r, c);
        const combos = combosFor(r, c);
        if (raiseSet.has(name)) raiseCombos += combos;
        else if (callSet.has(name)) callCombos += combos;
      }
    }
    const foldCombos = 1326 - raiseCombos - callCombos;
    return {
      raisePct: (raiseCombos / 1326) * 100,
      callPct: (callCombos / 1326) * 100,
      foldPct: (foldCombos / 1326) * 100,
      raiseCombos, callCombos, foldCombos,
    };
  }, [raiseSet, callSet]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Preflop <span className="text-gold">Ranges</span></h1>
          <p className="text-sm text-muted-foreground mt-1">
            Which hands to play from each position. Based on standard 100bb cash game opens.
          </p>
        </div>

        {/* Position selector */}
        <div className="felt-panel rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {POSITIONS.map(p => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-bold transition-all",
                  position === p
                    ? "bg-gradient-gold text-primary-foreground shadow-glow"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-baseline gap-6 border-t border-border/60 pt-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Position</div>
              <div className="font-display text-lg font-bold">{data.label}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">% of Hands</div>
              <div className="font-display text-2xl font-bold text-gold">{data.pct}%</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Combos</div>
              <div className="font-display text-2xl font-bold">{data.combos}<span className="text-sm text-muted-foreground">/1326</span></div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="felt-panel rounded-xl p-3 sm:p-5 mb-6 overflow-x-auto">
          <div className="grid grid-cols-13 gap-0.5 min-w-[560px]" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
            {Array.from({ length: 13 }).map((_, r) =>
              Array.from({ length: 13 }).map((_, c) => {
                const name = handName(r, c);
                const combos = combosFor(r, c);
                const action: Action = raiseSet.has(name) ? "raise" : callSet.has(name) ? "call" : "fold";
                const isPair = r === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    onMouseEnter={() => setHover({ name, action, combos })}
                    onMouseLeave={() => setHover(null)}
                    className={cn(
                      "aspect-square rounded-sm flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold transition-all hover:scale-110 hover:z-10 hover:shadow-glow relative",
                      action === "raise" && "bg-gradient-gold text-primary-foreground",
                      action === "call" && "bg-blue-600/80 text-white",
                      action === "fold" && "bg-secondary/40 text-muted-foreground/60",
                      isPair && action !== "fold" && "ring-1 ring-foreground/30",
                    )}
                    title={`${name} • ${action} • ${combos} combos`}
                  >
                    <span className="leading-none">{name}</span>
                    <span className="text-[8px] sm:text-[9px] opacity-70 leading-none mt-0.5">{combos}</span>
                  </button>
                );
              }),
            )}
          </div>

          {/* Hover info */}
          <div className="mt-4 h-12 flex items-center justify-center">
            {hover ? (
              <div className="felt-panel rounded-md px-4 py-2 text-sm flex items-center gap-3">
                <span className="font-display text-lg font-bold text-gold">{hover.name}</span>
                <span className="text-muted-foreground">•</span>
                <span className={cn(
                  "uppercase font-bold",
                  hover.action === "raise" && "text-gold",
                  hover.action === "call" && "text-blue-400",
                  hover.action === "fold" && "text-muted-foreground",
                )}>{hover.action}</span>
                <span className="text-muted-foreground">•</span>
                <span>{hover.combos} combos</span>
                <span className="text-muted-foreground">•</span>
                <span>{equityVsRandom(hover.name)}% equity vs random</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Hover a cell for details</span>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-2 text-xs">
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-gold inline-block" /> Raise</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-blue-600/80 inline-block" /> Call</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-secondary/40 inline-block" /> Fold</span>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div className="felt-panel rounded-xl p-5">
          <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <span>Action distribution</span>
            <span>{(stats.raiseCombos + stats.callCombos)} / 1326 combos played</span>
          </div>
          <div className="flex h-8 rounded-md overflow-hidden mb-3">
            <div className="bg-gradient-gold flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ width: `${stats.raisePct}%` }}>
              {stats.raisePct >= 8 && `${stats.raisePct.toFixed(1)}%`}
            </div>
            <div className="bg-blue-600/80 flex items-center justify-center text-xs font-bold text-white" style={{ width: `${stats.callPct}%` }}>
              {stats.callPct >= 6 && `${stats.callPct.toFixed(1)}%`}
            </div>
            <div className="bg-secondary/60 flex items-center justify-center text-xs font-bold text-muted-foreground" style={{ width: `${stats.foldPct}%` }}>
              {stats.foldPct >= 6 && `${stats.foldPct.toFixed(1)}%`}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Raise</div>
              <div className="font-display text-xl font-bold text-gold">{stats.raisePct.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{stats.raiseCombos} combos</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Call</div>
              <div className="font-display text-xl font-bold text-blue-400">{stats.callPct.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{stats.callCombos} combos</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Fold</div>
              <div className="font-display text-xl font-bold text-muted-foreground">{stats.foldPct.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{stats.foldCombos} combos</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
