import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlayingCard } from "@/components/PlayingCard";
import {
  type Card, RANKS, SUITS, cardId, evaluateHand,
} from "@/lib/poker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trainer")({
  head: () => ({
    meta: [
      { title: "Hand Trainer — Build Any Poker Hand | Poker Hands" },
      { name: "description", content: "Pick cards from the deck and instantly see what poker hand you've made." },
      { property: "og:title", content: "Poker Hand Trainer" },
      { property: "og:description", content: "Interactive deck — select up to 5 cards and learn what hand you have." },
    ],
  }),
  component: TrainerPage,
});

const MAX_SELECTED = 5;

function TrainerPage() {
  const [selected, setSelected] = useState<Card[]>([]);
  const selectedIds = useMemo(() => new Set(selected.map(cardId)), [selected]);
  const evalInfo = useMemo(() => evaluateHand(selected), [selected]);

  const toggle = (card: Card) => {
    const id = cardId(card);
    if (selectedIds.has(id)) {
      setSelected(s => s.filter(c => cardId(c) !== id));
    } else if (selected.length < MAX_SELECTED) {
      setSelected(s => [...s, card]);
    }
  };

  const clear = () => setSelected([]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold">Hand <span className="text-gold">Trainer</span></h1>
          <p className="text-muted-foreground mt-1">Select up to 5 cards. We'll tell you what you've got.</p>
        </div>

        {/* Result panel */}
        <section className="felt-panel rounded-2xl p-5 sm:p-6 mb-6 sticky top-[68px] z-20">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                {selected.length === 0 ? "No cards selected" : `${selected.length} / ${MAX_SELECTED} cards`}
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-gold">
                {selected.length === 0 ? "—" : evalInfo.name}
              </div>
              {selected.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{evalInfo.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 min-h-[80px]">
                {Array.from({ length: MAX_SELECTED }).map((_, i) => (
                  <PlayingCard key={i} card={selected[i]} size="sm" />
                ))}
              </div>
              <button
                onClick={clear}
                disabled={selected.length === 0}
                className="px-3 py-2 rounded-md text-sm font-medium border border-border bg-secondary/60 hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* Deck grid */}
        <section className="space-y-3">
          {SUITS.map(suit => (
            <div key={suit} className="felt-panel rounded-xl p-3 sm:p-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {RANKS.slice().reverse().map(rank => {
                  const card: Card = { rank, suit };
                  const isSelected = selectedIds.has(cardId(card));
                  const atLimit = !isSelected && selected.length >= MAX_SELECTED;
                  return (
                    <PlayingCard
                      key={cardId(card)}
                      card={card}
                      size="xs"
                      selected={isSelected}
                      faded={atLimit}
                      onClick={() => !atLimit && toggle(card)}
                      className={cn(atLimit && "cursor-not-allowed")}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
