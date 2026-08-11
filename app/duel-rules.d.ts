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

export function raceDestructionKind(id: string): string | null;
export function isRaceDestructionTarget(id: string, kind: string, faceDown: boolean): boolean;
export function shouldCpuUseRaceDestructionSpell(id: string, cpuKinds: string[], opponentKinds: string[]): boolean;

export function strongestAttackIndex(attacks: number[]): number | null;

export function shouldPlayerChooseFlipTarget(
  owner: "player" | "cpu",
  turn: "player" | "cpu",
  phase: "main1" | "battle" | "main2",
): boolean;

export function canMonsterAttackDirectly(id: string): boolean;
export function electricLizardAttackLockTurn(defenderId: string, attackerKind: string, currentTurn: number): number | null;
export function canDeclareAttackOnTurn(attackLockedTurn: number | undefined, currentTurn: number): boolean;
export function ironScorpionDestroyTurn(defenderId: string, attackerKind: string, currentTurn: number): number | null;
export function isIronScorpionDestructionDue(destroyTurn: number | undefined, currentTurn: number): boolean;

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
export function canActivateTwoProngedAttack(playerMonsterCount: number, opponentMonsterCount: number, trapIds: string[]): boolean;
export function isGuardianMonster(id: string): boolean;
export function guardianAdjustedAttack(attack: number, activate: boolean): number;
export function canBlastJugglerTarget(faceDown: boolean, attack: number): boolean;
export function canSpecialSummonLarvaeMoth(currentTurn: number, cocoonEquippedTurn?: number): boolean;
export function canSpecialSummonMoth(id: string, currentTurn: number, cocoonEquippedTurn?: number): boolean;
export function canActivateChangeOfHeart(playerMonsterCount: number, opponentMonsterCount: number, fieldLimit?: number): boolean;
export function canRespondWithAntiRaigeki(trapIds: string[], spellId: string): boolean;
export function canActivateSevenTools(lifePoints: number, trapIds: string[]): boolean;
export function canActivateMagicJammer(handSize: number, trapIds: string[]): boolean;
export function canActivateHornOfHeaven(monsterCount: number, trapIds: string[]): boolean;
export function solemnJudgmentRemainingLp(lifePoints: number, trapIds: string[]): number | null;
export function isMonsterRebornBlocked(playerSpellTrap: string[], cpuSpellTrap: string[]): boolean;
export function fakeTrapCanProtect(trapIds: string[], targetIndex: number): boolean;
export function isFaceUpTrapTarget(id: string): boolean;
export function firstFaceUpTrapIndex(ids: string[]): number | null;

export function continuousMonsterStats(input: {
  id: string;
  attribute?: string;
  kind?: string;
  atk: number;
  def: number;
  handSize?: number;
  graveyardMonsterCount?: number;
  auraIds?: string[];
  allyIds?: string[];
  fieldSpellIds?: string[];
}): { atk: number; def: number };

export function fieldSpellStatModifier(kind: string, fieldSpellIds?: string[]): number;
export function bestCpuFieldSpell(fieldSpellIds: string[], cpuKinds: string[], opponentKinds: string[]): string | null;

export function canDeckSearchTarget(sourceId: string, target?: {
  cardType: "monster" | "spell" | "trap";
  atk?: number;
  def?: number;
}): boolean;

export function deSpellDestroys(cardType: "monster" | "spell" | "trap"): boolean;

export function firstSpellTargetIndex(cardTypes: Array<"monster" | "spell" | "trap">): number | null;

export type FlipEffect = "destroy-trap" | "destroy-spell" | "destroy-monster" | "draw" | "return-monster" | "recover-spell" | "recover-trap" | "reorder-five" | "destroy-dragon-jar";

export function flipEffect(id: string): FlipEffect | null;
export function isDragonCaptureJarLocked(kind: string | undefined, faceDown: boolean, jarActive: boolean): boolean;
