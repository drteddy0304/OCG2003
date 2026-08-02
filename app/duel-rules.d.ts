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

export function advanceSwordsTurns(turns: number[]): {
  remaining: number[];
  expired: number;
};
