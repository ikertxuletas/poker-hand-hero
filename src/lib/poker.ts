// Pure poker logic — evaluate any 1-7 card selection into a hand rank.

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
export const RANKS: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
export const RANK_VALUE: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};

export const cardId = (c: Card) => `${c.rank}${c.suit}`;
export const isRed = (s: Suit) => s === "♥" || s === "♦";

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type HandCategory =
  | "royal-flush"
  | "straight-flush"
  | "four-of-a-kind"
  | "full-house"
  | "flush"
  | "straight"
  | "three-of-a-kind"
  | "two-pair"
  | "one-pair"
  | "high-card";

export interface HandInfo {
  category: HandCategory;
  rank: number; // 10 = best, 1 = worst
  name: string;
  description: string;
  tiebreak: number[]; // for ranking equal categories
}

export const HAND_META: Record<HandCategory, { rank: number; name: string; description: string; example: Card[] }> = {
  "royal-flush":     { rank: 10, name: "Royal Flush",      description: "A, K, Q, J, 10 of the same suit. The unbeatable hand.", example: [{rank:"A",suit:"♠"},{rank:"K",suit:"♠"},{rank:"Q",suit:"♠"},{rank:"J",suit:"♠"},{rank:"T",suit:"♠"}] },
  "straight-flush":  { rank: 9,  name: "Straight Flush",   description: "Five consecutive cards, all the same suit.",            example: [{rank:"9",suit:"♥"},{rank:"8",suit:"♥"},{rank:"7",suit:"♥"},{rank:"6",suit:"♥"},{rank:"5",suit:"♥"}] },
  "four-of-a-kind":  { rank: 8,  name: "Four of a Kind",   description: "Four cards of the same rank.",                          example: [{rank:"K",suit:"♠"},{rank:"K",suit:"♥"},{rank:"K",suit:"♦"},{rank:"K",suit:"♣"},{rank:"3",suit:"♠"}] },
  "full-house":      { rank: 7,  name: "Full House",       description: "Three of one rank plus a pair.",                        example: [{rank:"Q",suit:"♠"},{rank:"Q",suit:"♥"},{rank:"Q",suit:"♦"},{rank:"7",suit:"♣"},{rank:"7",suit:"♠"}] },
  "flush":           { rank: 6,  name: "Flush",            description: "Five cards of the same suit, not in sequence.",         example: [{rank:"A",suit:"♦"},{rank:"J",suit:"♦"},{rank:"9",suit:"♦"},{rank:"6",suit:"♦"},{rank:"3",suit:"♦"}] },
  "straight":        { rank: 5,  name: "Straight",         description: "Five consecutive cards of mixed suits.",                example: [{rank:"T",suit:"♠"},{rank:"9",suit:"♥"},{rank:"8",suit:"♦"},{rank:"7",suit:"♣"},{rank:"6",suit:"♠"}] },
  "three-of-a-kind": { rank: 4,  name: "Three of a Kind",  description: "Three cards of the same rank.",                         example: [{rank:"8",suit:"♠"},{rank:"8",suit:"♥"},{rank:"8",suit:"♦"},{rank:"K",suit:"♣"},{rank:"4",suit:"♠"}] },
  "two-pair":        { rank: 3,  name: "Two Pair",         description: "Two different pairs.",                                  example: [{rank:"J",suit:"♠"},{rank:"J",suit:"♥"},{rank:"5",suit:"♦"},{rank:"5",suit:"♣"},{rank:"A",suit:"♠"}] },
  "one-pair":        { rank: 2,  name: "One Pair",         description: "Two cards of the same rank.",                           example: [{rank:"T",suit:"♠"},{rank:"T",suit:"♥"},{rank:"K",suit:"♦"},{rank:"7",suit:"♣"},{rank:"2",suit:"♠"}] },
  "high-card":       { rank: 1,  name: "High Card",        description: "No combination — your highest card plays.",             example: [{rank:"A",suit:"♠"},{rank:"J",suit:"♥"},{rank:"9",suit:"♦"},{rank:"6",suit:"♣"},{rank:"3",suit:"♠"}] },
};

export const HAND_ORDER: HandCategory[] = [
  "royal-flush","straight-flush","four-of-a-kind","full-house","flush",
  "straight","three-of-a-kind","two-pair","one-pair","high-card",
];

// Evaluate exactly 5 cards
function evaluateFive(cards: Card[]): HandInfo {
  const values = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  // groups sorted: by count desc, then by value desc
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const isFlush = suits.every(s => s === suits[0]);
  // straight
  const uniq = [...new Set(values)];
  let isStraight = false;
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) { isStraight = true; straightHigh = uniq[0]; }
    else if (uniq.join(",") === "14,5,4,3,2") { isStraight = true; straightHigh = 5; } // wheel
  }
  const tieFromGroups = groups.flatMap(g => Array(g[1]).fill(g[0]));

  if (isStraight && isFlush && straightHigh === 14)
    return mk("royal-flush", [14]);
  if (isStraight && isFlush)
    return mk("straight-flush", [straightHigh]);
  if (groups[0][1] === 4)
    return mk("four-of-a-kind", [groups[0][0], groups[1][0]]);
  if (groups[0][1] === 3 && groups[1][1] === 2)
    return mk("full-house", [groups[0][0], groups[1][0]]);
  if (isFlush)
    return mk("flush", values);
  if (isStraight)
    return mk("straight", [straightHigh]);
  if (groups[0][1] === 3)
    return mk("three-of-a-kind", [groups[0][0], ...values.filter(v => v !== groups[0][0])]);
  if (groups[0][1] === 2 && groups[1][1] === 2)
    return mk("two-pair", [Math.max(groups[0][0], groups[1][0]), Math.min(groups[0][0], groups[1][0]), groups[2][0]]);
  if (groups[0][1] === 2)
    return mk("one-pair", [groups[0][0], ...values.filter(v => v !== groups[0][0])]);
  return mk("high-card", values);

  function mk(cat: HandCategory, tiebreak: number[]): HandInfo {
    const m = HAND_META[cat];
    return { category: cat, rank: m.rank, name: m.name, description: m.description, tiebreak };
  }
}

// Evaluate any 1-7 card subset — picks the best 5-card combo for 5+ cards;
// for 1-4 cards, returns best partial hand (pair, trips, four-of-a-kind, high card).
export function evaluateHand(cards: Card[]): HandInfo {
  if (cards.length === 0) {
    return { category: "high-card", rank: 0, name: "—", description: "Pick some cards to begin.", tiebreak: [] };
  }
  if (cards.length < 5) {
    const values = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a);
    const counts = new Map<number, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const top = groups[0][1];
    const mk = (cat: HandCategory, tb: number[]): HandInfo => ({
      category: cat, rank: HAND_META[cat].rank, name: HAND_META[cat].name,
      description: HAND_META[cat].description, tiebreak: tb,
    });
    if (top === 4) return mk("four-of-a-kind", [groups[0][0]]);
    if (top === 3 && groups[1]?.[1] === 2) return mk("full-house", [groups[0][0], groups[1][0]]);
    if (top === 3) return mk("three-of-a-kind", [groups[0][0]]);
    if (top === 2 && groups[1]?.[1] === 2) return mk("two-pair", [groups[0][0], groups[1][0]]);
    if (top === 2) return mk("one-pair", [groups[0][0]]);
    return mk("high-card", values);
  }
  // best of all 5-card combinations
  let best: HandInfo | null = null;
  const combos = combinations(cards, 5);
  for (const combo of combos) {
    const h = evaluateFive(combo);
    if (!best || compareHands(h, best) > 0) best = h;
  }
  return best!;
}

export function compareHands(a: HandInfo, b: HandInfo): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
    const av = a.tiebreak[i] ?? 0;
    const bv = b.tiebreak[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function combinations<T>(arr: T[], k: number): T[][] {
  const res: T[][] = [];
  const rec = (start: number, combo: T[]) => {
    if (combo.length === k) { res.push(combo); return; }
    for (let i = start; i < arr.length; i++) rec(i + 1, [...combo, arr[i]]);
  };
  rec(0, []);
  return res;
}

// Deal a random 5-card hand of a specific category (best-effort, with retries)
export function dealHandOfCategory(cat: HandCategory): Card[] {
  const deck = fullDeck();
  for (let attempt = 0; attempt < 2000; attempt++) {
    const picked = shuffle(deck).slice(0, 5);
    if (evaluateFive(picked).category === cat) return picked;
  }
  return HAND_META[cat].example;
}
