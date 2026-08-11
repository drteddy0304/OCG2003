import type { Card } from "./card-data";

export type CardLimitStatus = "limited" | "semi-limited" | "unlimited";

export const LIMIT_REGULATION_DATE: "2003-10-15";
export const LIMITED_CARD_NAMES: readonly string[];
export const SEMI_LIMITED_CARD_NAMES: readonly string[];
export function cardLimitStatus(cardOrName: Card | string): CardLimitStatus;
export function cardCopyLimit(cardOrName: Card | string): 1 | 2 | 3;
