import type { Card } from "./card-data";

export type DeckCardTypeFilter = "all" | Card["cardType"];
export type MonsterClassFilter = "all" | "normal" | "effect" | "fusion";
export type LevelFilter = "all" | `${number}`;
export type AttributeFilter = "all" | string;
export type RaceFilter = "all" | string;

export function matchesDeckFilters(
  card: Card,
  query: string,
  cardType: DeckCardTypeFilter,
  monsterClass: MonsterClassFilter,
  level: LevelFilter,
  attribute?: AttributeFilter,
  race?: RaceFilter,
): boolean;
