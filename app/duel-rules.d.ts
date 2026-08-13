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
export function equippedMonsterStats(atk: number, defense: number, equippedIds: string[]): { atk: number; def: number };
export function germInfectionPenalty(equippedIds: string[], standbyCount?: number): number;
export function dopingPenalty(equippedIds: string[], standbyCount?: number): number;
export function paralyzingPotionPreventsAttack(equippedIds: string[]): boolean;
export const competitiveCpuDeckLatestPackId: "vol-7";
export const competitiveCpuDeck: readonly string[];

export type SimpleSpellEffect = {
  gain: number;
  damage: number;
  selfDamage?: number;
};

export function simpleSpellEffect(id: string): SimpleSpellEffect | null;

export function shouldCpuUseSimpleSpell(id: string, currentLp: number, startingLp?: number): boolean;
export function resolveSimpleSpellLife(id: string, ownLp: number, opponentLp: number): {
  ownLp: number;
  opponentLp: number;
  outcome: "own-win" | "own-lose" | "draw" | null;
} | null;

export function shouldCpuActivateSwords(
  opponentMonsterCount: number,
  activeSwordsCount: number,
  spellTrapCount: number,
  fieldLimit?: number,
): boolean;

export function raceDestructionKind(id: string): string | null;
export function isRaceDestructionTarget(id: string, kind: string, faceDown: boolean): boolean;
export function shouldCpuUseRaceDestructionSpell(id: string, cpuKinds: string[], opponentKinds: string[]): boolean;
export function shouldCpuUseHeavyStorm(cpuSpellTrapCount: number, opponentSpellTrapCount: number, cpuFieldSpell?: boolean, opponentFieldSpell?: boolean): boolean;

export function strongestAttackIndex(attacks: number[]): number | null;

export function shouldPlayerChooseFlipTarget(
  owner: "player" | "cpu",
  turn: "player" | "cpu",
  phase: "main1" | "battle" | "main2",
): boolean;

export function canMonsterAttackDirectly(id: string): boolean;
export function electricLizardAttackLockTurn(defenderId: string, attackerKind: string, currentTurn: number): number | null;
export function canDeclareAttackOnTurn(attackLockedTurn: number | undefined, currentTurn: number): boolean;
export function attackDeclarationCost(id: string, lifePoints: number): number | null;
export function endsBattlePhaseOnBattleDestruction(id: string, destroyed: boolean): boolean;
export function isMirrorForceDestructionTarget(position: "attack" | "defense"): boolean;
export function ironScorpionDestroyTurn(defenderId: string, attackerKind: string, currentTurn: number): number | null;
export function isIronScorpionDestructionDue(destroyTurn: number | undefined, currentTurn: number): boolean;

export type BattleDamageEffect = "discard-random" | "draw" | "opponent-draw-two";
export function battleDamageEffect(id: string): BattleDamageEffect | null;
export function battleAttackBonus(attackerId: string, defenderAttribute?: string): number;
export function battleDefenseValue(defenderId: string, defenderDefense: number, attackerAttribute?: string): number;
export function mechanicalSpiderDestroys(attackerId: string, defenderAttribute?: string): boolean;
export function foreignSwordsmanDestroyTurn(attackerId: string, currentTurn: number): number | null;
export function mysteriousPuppeteerLifeGain(faceUpMonsterIds: string[], summonedCount?: number): number;
export type PositionChangeEffect = "return-monster" | "destroy-monster" | "shuffle-deck" | "destroy-dragon";
export function positionChangeEffect(id: string, fromPosition: "attack" | "defense", toPosition: "attack" | "defense"): PositionChangeEffect | null;
export function cockroachKnightReturns(id: string): boolean;
export function patrolRoboCanInspect(faceUpMonsterIds: string[], opponentSetCount: number): boolean;
export function hourglassOriginalStats(id: string, atk: number, defense: number, faceUpTurn: number | undefined, currentTurn: number | undefined): { atk: number; def: number };
export function darkCastleUndeadBoost(faceUpTurns: number[], currentTurn: number): number;
export function pumpkingTimedBonus(id: string, castlePresent: boolean, faceUpTurn: number | undefined, currentTurn: number): number;
export function giantSpiderAttackLife(id: string, lifePoints: number, coinMatched: boolean): number;
export function canPayMonsterEffect(lifePoints: number, cost: number): boolean;
export function aileSwordsmanAttackBonus(boostTurn: number | undefined, tributeCount: number | undefined, currentTurn: number | undefined): number;
export function bottomDeckSelection(cards: string[], selectedIndexes: number[]): { remaining: string[]; bottom: string[] };
export function gracefulCharityDraw(hand: string[], deck: string[]): { hand: string[]; deck: string[] } | null;
export function selectedCards(cards: string[], selectedIndexes: number[]): { remaining: string[]; chosen: string[] };
export function justDessertsDamage(monsterCount: number): number;
export function temporaryBattleStatBonus(effectTurn: number | undefined, currentTurn: number | undefined): number;
export function canUseUltimateOffering(lifePoints: number, normalSummoned: boolean, fieldCount: number, hasSummonCandidate: boolean, fieldLimit?: number): boolean;
export function reverseAdjustedStat(base: number, adjusted: number, active: boolean): number;

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
  faceUpPlantCount?: number;
  faceUpMachineCount?: number;
  auraIds?: string[];
  allyIds?: string[];
  fieldSpellIds?: string[];
}): { atk: number; def: number };

export function fieldSpellStatModifier(kind: string, fieldSpellIds?: string[]): number;
export function wormBeastReturns(id: string, faceDown: boolean, summonedTurn: number, currentTurn: number): boolean;
export function bestCpuFieldSpell(fieldSpellIds: string[], cpuKinds: string[], opponentKinds: string[]): string | null;

export function canDeckSearchTarget(sourceId: string, target?: {
  cardType: "monster" | "spell" | "trap";
  atk?: number;
  def?: number;
}): boolean;

export function deSpellDestroys(cardType: "monster" | "spell" | "trap"): boolean;

export function firstSpellTargetIndex(cardTypes: Array<"monster" | "spell" | "trap">): number | null;

export type FlipEffect = "destroy-trap" | "destroy-spell" | "destroy-monster" | "draw" | "return-monster" | "recover-spell" | "recover-trap" | "reorder-five" | "destroy-dragon-jar" | "mill-five" | "reload-five" | "gain-3000" | "damage-spell-traps" | "pay-2000-damage-1000" | "destroy-two-set-spell-traps" | "return-two-monsters";

export function flipEffect(id: string): FlipEffect | null;
export function isDragonCaptureJarLocked(kind: string | undefined, faceDown: boolean, jarActive: boolean): boolean;
