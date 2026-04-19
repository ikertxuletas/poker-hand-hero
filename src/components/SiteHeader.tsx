import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Rankings" },
  { to: "/learn", label: "Learn" },
  { to: "/quiz", label: "Quiz" },
  { to: "/trainer", label: "Trainer" },
  { to: "/blackjack", label: "Blackjack" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 felt-panel border-b border-border/60">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl text-suit-red drop-shadow-[0_0_8px_oklch(0.55_0.22_27_/_0.6)]">♠</span>
          <span className="font-display font-bold text-lg sm:text-xl tracking-tight">
            Poker <span className="text-gold">Hands</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              activeProps={{ className: "px-3 py-1.5 rounded-md text-sm font-semibold text-primary-foreground bg-gradient-gold shadow-glow" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
