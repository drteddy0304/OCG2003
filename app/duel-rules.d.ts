export type BattleOutcome = {
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
  attackerDamage: number;
  defenderDamage: number;
};

export function battleOutcome(
  attack: number,
  defense: number,
  defenderPosition: "attack" | "defense",
): BattleOutcome;

export const equipRules: Readonly<Record<string, string>>;

export type SimpleSpellEffect = {
  gain: number;
  damage: number;
};

export function simpleSpellEffect(id: string): SimpleSpellEffect | null;

export function shouldCpuUseSimpleSpell(id: string, currentLp: number, startingLp?: number): boolean;

export function shouldCpuActivateSwords(
  opponentMonsterCount: number,
  activeSwordsCount: number,
  spellTrapCount: number,
  fieldLimit?: number,
): boolean;

export function strongestAttackIndex(attacks: number[]): number | null;

export function shouldPlayerChooseFlipTarget(
  owner: "player" | "cpu",
  turn: "player" | "cpu",
  phase: "main1" | "battle" | "main2",
): boolean;

export function canMonsterAttackDirectly(id: string): boolean;

export type BattleDamageEffect = "discard-random" | "draw";
export function battleDamageEffect(id: string): BattleDamageEffect | null;

export function advanceSwordsTurns(turns: number[]): {
  remaining: number[];
  expired: number;
};

export function takeGraveyardCard(cards: string[], index: number): {
  cardId: string;
  remaining: string[];
} | null;

export function moveDeckCard(cards: string[], fromIndex: number, toIndex: number): string[];
export function canActivateTributeToDoomed(handSize: number, fieldMonsterCount: number): boolean;
export function toggleLimitedSelection(values: string[], value: string, limit?: number): string[];
export function canActivateCheerfulCoffin(cardTypes: string[]): boolean;

export function deSpellDestroys(cardType: "monster" | "spell" | "trap"): boolean;

export function firstSpellTargetIndex(cardTypes: Array<"monster" | "spell" | "trap">): number | null;

export type FlipEffect = "destroy-trap" | "destroy-spell" | "destroy-monster" | "draw" | "return-monster" | "recover-spell" | "recover-trap" | "reorder-five";

export function flipEffect(id: string): FlipEffect | null;
