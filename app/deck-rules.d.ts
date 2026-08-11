import type { Card } from "./card-data";

export type DeckCardTypeFilter = "all" | Card["cardType"];
export type MonsterClassFilter = "all" | "normal" | "effect" | "fusion";
export type LevelFilter = "all" | `${number}` | number[];
export type AttributeFilter = "all" | string;
export type RaceFilter = "all" | string;
export type RarityFilter = "all" | Card["rarity"];

export function matchesDeckFilters(
  card: Card,
  query: string,
  cardType: DeckCardTypeFilter,
  monsterClass: MonsterClassFilter,
  level: LevelFilter,
  attribute?: AttributeFilter,
  race?: RaceFilter,
  rarity?: RarityFilter,
  description?: string,
): boolean;

export function sanitizeDeckCounts(
  counts: Record<string, number>,
  collection: Record<string, number>,
  cardsById: Map<string, Card>,
  fusion: boolean,
): Record<string, number>;

export function deckComposition(
  counts: Record<string, number>,
  cardsById: Map<string, Card>,
): { monsters: number; normalMonsters: number; effectMonsters: number; spells: number; traps: number };

export function normalizeDeckLibrary(
  storedLibrary: Record<string, { main?: Record<string, number>; fusion?: Record<string, number> }> | null,
  legacyMain: Record<string, number>,
  legacyFusion: Record<string, number>,
  collection: Record<string, number>,
  cardsById: Map<string, Card>,
  slotCount?: number,
): Record<string, { main: Record<string, number>; fusion: Record<string, number> }>;
