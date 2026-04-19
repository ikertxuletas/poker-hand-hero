import { type Card, isRed } from "@/lib/poker";
import { cn } from "@/lib/utils";

interface PlayingCardProps {
  card?: Card;
  size?: "xs" | "sm" | "md" | "lg";
  selected?: boolean;
  faded?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  xs: "w-10 h-14 text-sm rounded-md",
  sm: "w-14 h-20 text-lg rounded-lg",
  md: "w-20 h-28 text-2xl rounded-xl",
  lg: "w-24 h-36 text-3xl rounded-xl",
};

const cornerMap = {
  xs: "text-[10px] leading-none",
  sm: "text-xs leading-none",
  md: "text-sm leading-none",
  lg: "text-base leading-none",
};

export function PlayingCard({ card, size = "md", selected, faded, onClick, className }: PlayingCardProps) {
  if (!card) {
    return (
      <div
        className={cn(
          sizeMap[size],
          "border-2 border-dashed border-border/60 bg-felt-deep/40",
          className,
        )}
      />
    );
  }

  const red = isRed(card.suit);
  const interactive = !!onClick;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "relative bg-card shadow-card flex flex-col justify-between p-1.5 select-none transition-all",
        sizeMap[size],
        red ? "text-suit-red" : "text-suit-black",
        interactive && "cursor-pointer hover:-translate-y-1 hover:shadow-glow active:translate-y-0",
        selected && "ring-4 ring-gold -translate-y-2 shadow-glow",
        faded && "opacity-30 grayscale",
        !interactive && "cursor-default",
        className,
      )}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <div className={cn("flex flex-col items-start font-bold", cornerMap[size])}>
        <span>{card.rank === "T" ? "10" : card.rank}</span>
        <span>{card.suit}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-bold opacity-90">{card.suit}</span>
      </div>
      <div className={cn("flex flex-col items-end font-bold rotate-180", cornerMap[size])}>
        <span>{card.rank === "T" ? "10" : card.rank}</span>
        <span>{card.suit}</span>
      </div>
    </button>
  );
}

export function CardRow({ cards, size = "md", className }: { cards: Card[]; size?: PlayingCardProps["size"]; className?: string }) {
  return (
    <div className={cn("flex gap-1.5 sm:gap-2", className)}>
      {cards.map((c, i) => (
        <PlayingCard key={`${c.rank}${c.suit}-${i}`} card={c} size={size} />
      ))}
    </div>
  );
}
