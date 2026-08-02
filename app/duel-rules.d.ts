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

export function advanceSwordsTurns(turns: number[]): {
  remaining: number[];
  expired: number;
};

export function takeGraveyardCard(cards: string[], index: number): {
  cardId: string;
  remaining: string[];
} | null;

export function deSpellDestroys(cardType: "monster" | "spell" | "trap"): boolean;
