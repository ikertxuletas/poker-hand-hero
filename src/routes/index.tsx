import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { CardRow } from "@/components/PlayingCard";
import { HAND_META, HAND_ORDER } from "@/lib/poker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Poker Hand Rankings — Poker Hands" },
      { name: "description", content: "All 10 poker hands ranked from Royal Flush to High Card, with visual card examples." },
      { property: "og:title", content: "Poker Hand Rankings" },
      { property: "og:description", content: "Visual guide to every poker hand, from strongest to weakest." },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <section className="text-center mb-10 sm:mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-3">The Complete Guide</p>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4">
            Poker Hand <span className="text-gold">Rankings</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every hand ranked from strongest to weakest. Learn them, then put your knowledge to the test.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link
              to="/quiz"
              className="px-5 py-2.5 rounded-md bg-gradient-gold text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-transform"
            >
              Take the Quiz →
            </Link>
            <Link
              to="/trainer"
              className="px-5 py-2.5 rounded-md border border-border bg-secondary/60 font-medium hover:bg-secondary transition-colors"
            >
              Open Trainer
            </Link>
          </div>
        </section>

        <ol className="space-y-4 sm:space-y-5">
          {HAND_ORDER.map((cat, i) => {
            const meta = HAND_META[cat];
            return (
              <li
                key={cat}
                className="felt-panel rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center"
              >
                <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:w-32 shrink-0">
                  <div className="font-display text-4xl sm:text-5xl font-black text-gold leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="sm:mt-1">
                    <h2 className="text-lg sm:text-xl font-bold leading-tight">{meta.name}</h2>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground sm:flex-1 sm:max-w-xs">
                  {meta.description}
                </p>
                <CardRow cards={meta.example} size="sm" className="sm:ml-auto" />
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
