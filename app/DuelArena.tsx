"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardById, type Card } from "./card-data";
import { advanceSwordsTurns, aileSwordsmanAttackBonus, attackDeclarationCost, barrelDragonCoinResult, battleAttackBonus, battleDamageEffect, battleDefenseValue, battleOutcome, battleRemovalOutcome, bestCpuBattleTargetIndex, bestCpuFieldSpell, bottomDeckSelection, canActivateChangeOfHeart, canActivateCheerfulCoffin, canActivateHornOfHeaven, canActivateMagicJammer, canActivateSevenTools, canActivateTributeToDoomed, canActivateTwoProngedAttack, canBlastJugglerTarget, canDeclareAttackOnTurn, canDeckSearchTarget, canMonsterAttackDirectly, canNormalSummonMonster, canPayMonsterEffect, canRespondWithAntiRaigeki, canSpecialSummonMoth, canStopAttackTarget, canTransferMatango, canUseKuriboh, canUseUltimateOffering, catapultTurtleDamage, cockroachKnightReturns, competitiveCpuDeck, continuousMonsterStats, controlChangeLifeEffect, darkCastleUndeadBoost, deSpellDestroys, dopingPenalty, dragonTargetProtected, electricLizardAttackLockTurn, endsBattlePhaseOnBattleDestruction, equipRules, equippedMonsterStats, fakeTrapCanProtect, firstFaceUpTrapIndex, firstSpellTargetIndex, flipEffect, flipLifeAmount, foreignSwordsmanDestroyTurn, germInfectionPenalty, giantSpiderAttackLife, gracefulCharityDraw, graveyardLifeLoss, guardianAdjustedAttack, hourglassOriginalStats, ironScorpionDestroyTurn, isDragonCaptureJarLocked, isElegantEgotistTarget, isFaceUpTrapTarget, isGuardianMonster, isIronScorpionDestructionDue, isMirrorForceDestructionTarget, isMonsterRebornBlocked, isRaceDestructionTarget, justDessertsDamage, magicThornDamage, matangoStandbyDamage, mechanicalSpiderDestroys, moveDeckCard, mysteriousPuppeteerLifeGain, paralyzingPotionPreventsAttack, patrolRoboCanInspect, phantomWallReturnsAttacker, positionChangeEffect, pumpkingTimedBonus, raceDestructionKind, resolveSimpleSpellLife, resolveUpstartGoblin, reverseAdjustedStat, robbinGoblinCanTrigger, royalDecreeNegatesTraps, selectedCards, shouldCpuActivateSwords, shouldCpuUseHeavyStorm, shouldCpuUseRaceDestructionSpell, shouldCpuUseSimpleSpell, shouldPlayerChooseFlipTarget, simpleSpellEffect, solemnJudgmentRemainingLp, spellSpecificTrapResponse, strongestAttackIndex, swappedMonsterStats, takeGraveyardCard, temporaryBattleStatBonus, thunderDragonSearchIndexes, toggleLimitedSelection, wormBeastReturns } from "./duel-rules.mjs";
import { cardCopyLimit } from "./limit-regulation.mjs";
import { feedbackForMessage, isPendingActionMessage } from "./duel-feedback.mjs";
import { playDuelSound, startDuelBgm, stopDuelBgm, unlockDuelAudio, type DuelSound } from "./duel-audio";
import { bestFusionChoice, canSelectFusionMaterial, fusionChoices, fusionMaterialSelection, fusionRecipe, isValidFusionSelection } from "./fusion-rules.mjs";
import { attackDeclarationPayment, resolveDelinquentDuo, resolveHandDisruption } from "./duel-rules.mjs";
import { darknessApproachesDiscard, resolvePainfulChoice } from "./duel-rules.mjs";
import { snatchStealStandbyGain } from "./duel-rules.mjs";
import { curseOfFiendPosition } from "./duel-rules.mjs";
import { blackPendantTriggerCounts, canPayChainEnergy, chainEnergyCost, monsterSentFromFieldToGrave } from "./duel-rules.mjs";

const DECK_STORAGE_KEY = "ocg2003.deck.main.v1";
const FUSION_DECK_STORAGE_KEY = "ocg2003.deck.fusion.v1";
const MIN_DECK_SIZE = 40;
const STARTING_LP = 8000;
const FIELD_LIMIT = 5;

type Position = "attack" | "defense";
type Side = "player" | "cpu";
type Result = "win" | "lose" | "draw" | null;
type Phase = "standby" | "main1" | "battle" | "main2";
type PendingTribute = {
  handIndex: number;
  position: Position;
  required: number;
  selected: number[];
};
type CpuPlayback = {
  finalState: DuelState;
  messages: string[];
  index: number;
};
type PendingTrapResponse = {
  trapIndex: number;
  monsterIndex: number;
  monsterId: string;
};
type PendingSevenTools = {
  sevenToolsIndex: number;
  trapIndex: number;
  monsterIndex: number;
  monsterId: string;
  playerTributes: ZoneCard[];
  cpuTributes: ZoneCard[];
};
type PendingMagicJammer = {
  trapIndex: number;
  spellId: string;
};
type PendingHornOfHeaven = {
  trapIndex: number;
  monsterIndex: number;
  monsterId: string;
};
type PendingSolemnJudgment = {
  kind: "spell" | "trap" | "summon";
  trapIndex: number;
  cardId: string;
  monsterIndex?: number;
  playerTributes?: ZoneCard[];
  cpuTributes?: ZoneCard[];
};
type PendingGuardianResponse = {
  attackerIndex: number;
  defenderIndex: number;
  guardianId: string;
};
type PendingMirrorForce = {
  trapIndex: number;
  attackerIndex: number;
  defenderIndex: number | null;
};
type PendingKuribohResponse = {
  attackerIndex: number;
  defenderIndex: number | null;
  guardianEffect: boolean;
};
type PendingWabokuResponse = {
  trapIndex: number;
  attackerIndex: number;
  defenderIndex: number | null;
  guardianEffect: boolean;
};
type PendingRobbinGoblin = { trapIndex: number };
type PendingAntiRaigeki = {
  trapIndex: number;
};
type PendingSpellSpecificTrap = {
  trapIndex: number;
  trapId: "bo4-white-hole" | "bo4-call-grave" | "bo7-griffin-wing";
  spellId: string;
};
type PendingFakeTrap = {
  monsterId: string;
  targetIndex: number;
  targetId: string;
  fakeTrapIndex: number;
};
type PendingTwoPronged = {
  trapIndex: number;
  selectedPlayer: number[];
  selectedCpu: number | null;
};
type PendingBlastJuggler = {
  monsterIndex: number;
  selected: string[];
};
type PendingFlipTarget = {
  monsterId: string;
  owner: Side;
  effect: "destroy-monster" | "return-monster" | "destroy-spell" | "destroy-trap" | "recover-spell" | "recover-trap" | "swap-control";
};
type PendingFlipQueueItem = { owner: Side; monsterId: string };
type PendingMultiTarget = {
  monsterId: string;
  effect: "destroy-dragon" | "return-two-monsters" | "destroy-two-set-spell-traps";
  selected: string[];
};
type PendingCyberStein = { sourceIndex: number; fusionId: string | null };
type PendingYadoKaru = { sourceIndex: number; selected: number[] };
type PendingCardInspection = { kind: "spy" | "telescope"; selected: number | null };
type PendingHandDisruption = { kind: "confiscation" | "forceful-sentry"; spellIndex: number };
type PendingSharePain = { spellIndex: number };
type PendingTemporaryStat = {
  cardId: "mr-rush-recklessly" | "mr-reliable-guardian" | "mr-snake-fang";
  source: "hand" | "trap";
  sourceIndex: number;
};
type PendingPainfulChoice = { spellIndex: number; selected: number[] };
type PendingDarknessApproaches = { spellIndex: number; discardIndexes: number[] };
type PendingTailor = { spellIndex: number; sourceSide: Side | null; sourceIndex: number | null; equipId: string | null };
type PendingJustDesserts = { trapIndex: number };
type PendingBattleStatTrap = { trapIndex: number; trapId: "bo3-reinforcements" | "bo3-castle-walls"; attackerIndex: number; defenderIndex: number };
type PendingReverseTrap = { trapIndex: number; attackerIndex: number; defenderIndex: number };
type PendingDeckReorder = {
  monsterId: string;
  cards: string[];
};
type PendingDeckSearch = {
  monsterIds: string[];
};
type PendingTributeToDoomed = {
  spellIndex: number;
  discardIndex: number | null;
};
type PendingSoulRelease = {
  spellIndex: number;
  selected: string[];
};
type PendingCheerfulCoffin = {
  spellIndex: number;
  selected: string[];
};
type FusionMaterialSelection = { source: "hand" | "field"; index: number; id: string };
type PendingFusion = {
  spellIndex: number;
  fusionId: string | null;
  selected: FusionMaterialSelection[];
};
type PendingDragonFlute = { spellIndex: number; selected: number[] };
type DuelFeedback = { kind: DuelSound; title: string; detail: string; message: string; duration: number };

type ZoneCard = {
  id: string;
  position: Position;
  faceDown: boolean;
  attacked: boolean;
  equipped: string[];
  summonedTurn: number;
  faceUpTurn?: number;
  positionChanged: boolean;
  guardianEffectUsed?: boolean;
  attackLockedTurn?: number;
  ironScorpionDestroyTurn?: number;
  foreignSwordsmanDestroyTurn?: number;
  blastPromptedTurn?: number;
  cocoonEquippedTurn?: number;
  controlReturn?: Side;
  permanentControl?: boolean;
  snatchStealControl?: boolean;
  snatchReturnSide?: Side;
  spellbindingCircleOwner?: Side;
  revivedByMonsterReborn?: boolean;
  catapultUsedTurn?: number;
  barrelUsedTurn?: number;
  matangoOfferedTurn?: number;
  statsSwappedTurn?: number;
  aileBoostTurn?: number;
  aileTributeCount?: number;
  battleAtkBonusTurn?: number;
  battleDefBonusTurn?: number;
  battleAtkBonusValue?: number;
  battleDefBonusValue?: number;
  germStandbys?: number;
};

type DuelState = {
  playerDeck: string[];
  playerFusionDeck: string[];
  cpuDeck: string[];
  cpuFusionDeck: string[];
  playerHand: string[];
  cpuHand: string[];
  playerField: ZoneCard[];
  cpuField: ZoneCard[];
  playerSpellTrap: string[];
  playerFieldSpell: string | null;
  playerSwordsTurns: number[];
  cpuSpellTrap: string[];
  cpuFieldSpell: string | null;
  cpuSwordsTurns: number[];
  playerExtraBattles: number;
  cpuExtraBattles: number;
  playerGraveyard: string[];
  cpuGraveyard: string[];
  playerMonsterSentToGraveTurn: number | null;
  cpuMonsterSentToGraveTurn: number | null;
  playerLp: number;
  cpuLp: number;
  turn: Side;
  turnNumber: number;
  phase: Phase;
  normalSummoned: boolean;
  reverseTrapTurn: number | null;
  reverseTrapDeclinedTurn: number | null;
  playerWabokuTurn: number | null;
  result: Result;
  pendingTrapResponse: PendingTrapResponse | null;
  pendingSevenTools: PendingSevenTools | null;
  pendingMagicJammer: PendingMagicJammer | null;
  pendingHornOfHeaven: PendingHornOfHeaven | null;
  pendingSolemnJudgment: PendingSolemnJudgment | null;
  pendingGuardianResponse: PendingGuardianResponse | null;
  pendingMirrorForce: PendingMirrorForce | null;
  pendingKuribohResponse: PendingKuribohResponse | null;
  pendingWabokuResponse: PendingWabokuResponse | null;
  pendingRobbinGoblin: PendingRobbinGoblin | null;
  pendingJustDesserts: PendingJustDesserts | null;
  pendingBattleStatTrap: PendingBattleStatTrap | null;
  pendingReverseTrap: PendingReverseTrap | null;
  playerActiveTraps: string[];
  cpuActiveTraps: string[];
  pendingBlastJuggler: PendingBlastJuggler | null;
  pendingAntiRaigeki: PendingAntiRaigeki | null;
  pendingSpellSpecificTrap: PendingSpellSpecificTrap | null;
  pendingFakeTrap: PendingFakeTrap | null;
  pendingTwoPronged: PendingTwoPronged | null;
  pendingFlipTarget: PendingFlipTarget | null;
  pendingFlipQueue: PendingFlipQueueItem[];
  pendingMultiTarget: PendingMultiTarget | null;
  pendingDeckReorder: PendingDeckReorder | null;
  pendingDeckSearch: PendingDeckSearch | null;
  log: string[];
};

const CPU_DECK = [...competitiveCpuDeck];
const CPU_FUSION_DECK = ["vol3-gaia-dragon-champion", "vol3-gaia-dragon-champion", "vol3-gaia-dragon-champion"];
const EQUIP_RULES = equipRules;
const FIELD_SPELL_IDS = ["stb-forest", "stb-wasteland", "stb-mountain", "stb-sogen", "stb-umi", "stb-yami", "mr-chorus-sanctuary"];

export function DuelArena({
  collection,
  onReward,
}: {
  collection: Record<string, number>;
  onReward: (cardId: string) => boolean;
}) {
  const [duel, rawSetDuel] = useState<DuelState | null>(null);

  function setDuel(next: DuelState | null) {
    rawSetDuel((previous) => previous && next
      ? applyBlackPendantGraveTriggers(previous, trackMonstersSentToGrave(previous, next))
      : next);
  }
  const [selectedAttacker, setSelectedAttacker] = useState<number | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<number | null>(null);
  const [pendingTribute, setPendingTribute] = useState<PendingTribute | null>(null);
  const [pendingReborn, setPendingReborn] = useState<number | null>(null);
  const [pendingDeSpell, setPendingDeSpell] = useState<number | null>(null);
  const [pendingEgotist, setPendingEgotist] = useState<number | null>(null);
  const [pendingTributeToDoomed, setPendingTributeToDoomed] = useState<PendingTributeToDoomed | null>(null);
  const [pendingSoulRelease, setPendingSoulRelease] = useState<PendingSoulRelease | null>(null);
  const [pendingCheerfulCoffin, setPendingCheerfulCoffin] = useState<PendingCheerfulCoffin | null>(null);
  const [pendingFusion, setPendingFusion] = useState<PendingFusion | null>(null);
  const [pendingLastWill, setPendingLastWill] = useState<number | null>(null);
  const [pendingDragonFlute, setPendingDragonFlute] = useState<PendingDragonFlute | null>(null);
  const [pendingChangeOfHeart, setPendingChangeOfHeart] = useState<number | null>(null);
  const [pendingCannonSoldier, setPendingCannonSoldier] = useState<number | null>(null);
  const [pendingCatapultTurtle, setPendingCatapultTurtle] = useState<number | null>(null);
  const [pendingBarrelDragon, setPendingBarrelDragon] = useState<number | null>(null);
  const [pendingGaleDogra, setPendingGaleDogra] = useState<number | null>(null);
  const [pendingCyberStein, setPendingCyberStein] = useState<PendingCyberStein | null>(null);
  const [pendingAileSwordsman, setPendingAileSwordsman] = useState<number | null>(null);
  const [pendingYadoKaru, setPendingYadoKaru] = useState<PendingYadoKaru | null>(null);
  const [pendingGracefulCharity, setPendingGracefulCharity] = useState<number[] | null>(null);
  const [pendingCardInspection, setPendingCardInspection] = useState<PendingCardInspection | null>(null);
  const [pendingHandDisruption, setPendingHandDisruption] = useState<PendingHandDisruption | null>(null);
  const [pendingFinalDestiny, setPendingFinalDestiny] = useState<{ spellIndex: number; selected: number[] } | null>(null);
  const [pendingSharePain, setPendingSharePain] = useState<PendingSharePain | null>(null);
  const [pendingTemporaryStat, setPendingTemporaryStat] = useState<PendingTemporaryStat | null>(null);
  const [pendingSpellbindingCircle, setPendingSpellbindingCircle] = useState<number | null>(null);
  const [pendingPainfulChoice, setPendingPainfulChoice] = useState<PendingPainfulChoice | null>(null);
  const [pendingDarknessApproaches, setPendingDarknessApproaches] = useState<PendingDarknessApproaches | null>(null);
  const [pendingTailor, setPendingTailor] = useState<PendingTailor | null>(null);
  const [pendingMatangoTransfer, setPendingMatangoTransfer] = useState<number | null>(null);
  const [pendingStopAttack, setPendingStopAttack] = useState<number | null>(null);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [graveyardView, setGraveyardView] = useState<Side | null>(null);
  const [cpuPlayback, setCpuPlayback] = useState<CpuPlayback | null>(null);
  const [rewardName, setRewardName] = useState<string | null>(null);
  const [rewardDiscarded, setRewardDiscarded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackQueue, setFeedbackQueue] = useState<DuelFeedback[]>([]);
  const [activeFeedback, setActiveFeedback] = useState<DuelFeedback | null>(null);
  const rewarded = useRef(false);
  const lastFeedbackKey = useRef("");

  const savedDeck = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const counts = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
      return expandDeck(counts);
    } catch {
      return [];
    }
  }, [collection, duel]);
  const savedFusionDeck = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const counts = JSON.parse(localStorage.getItem(FUSION_DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
      return expandFusionDeck(counts);
    } catch {
      return [];
    }
  }, [collection, duel]);
  const isPlayerMainPhase = duel?.turn === "player"
    && !duel.pendingGuardianResponse
    && !duel.pendingMirrorForce
    && !duel.pendingKuribohResponse
    && !duel.pendingWabokuResponse
    && !duel.pendingRobbinGoblin
    && !duel.pendingBattleStatTrap
    && !duel.pendingReverseTrap
    && !duel.pendingSevenTools
    && !duel.pendingBlastJuggler
    && !duel.pendingAntiRaigeki
    && !duel.pendingSpellSpecificTrap
    && !duel.pendingFakeTrap
    && !duel.pendingTwoPronged
    && !duel.pendingFlipTarget
    && !duel.pendingMultiTarget
    && !duel.pendingDeckReorder
    && !duel.pendingDeckSearch
    && pendingTributeToDoomed === null
    && pendingSoulRelease === null
    && pendingCheerfulCoffin === null
    && pendingFusion === null
    && pendingLastWill === null
    && pendingDragonFlute === null
    && pendingChangeOfHeart === null
    && pendingCannonSoldier === null
    && pendingCatapultTurtle === null
    && pendingBarrelDragon === null
    && pendingGaleDogra === null
    && pendingCyberStein === null
    && pendingAileSwordsman === null
    && pendingYadoKaru === null
    && pendingGracefulCharity === null
    && pendingCardInspection === null
    && pendingHandDisruption === null
    && pendingFinalDestiny === null
    && pendingSharePain === null
    && pendingTemporaryStat === null
    && pendingSpellbindingCircle === null
    && pendingPainfulChoice === null
    && pendingDarknessApproaches === null
    && pendingTailor === null
    && pendingMatangoTransfer === null
    && pendingStopAttack === null
    && pendingEgotist === null
    && (duel.phase === "main1" || duel.phase === "main2");
  const feedbackMessage = duel
    ? cpuPlayback
      ? ""
      : duel.log.at(-1) ?? ""
    : "";
  const feedbackKey = duel
    ? cpuPlayback
      ? `cpu-${duel.turnNumber}-${cpuPlayback.index}-${feedbackMessage}`
      : `log-${duel.log.length}-${feedbackMessage}`
    : "";

  useEffect(() => {
    try {
      setSoundEnabled(localStorage.getItem("ocg2003.duel-sound.v1") !== "off");
    } catch {
      setSoundEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!feedbackKey || lastFeedbackKey.current === feedbackKey) return;
    lastFeedbackKey.current = feedbackKey;
    const events = feedbackForMessage(feedbackMessage) as DuelFeedback[];
    if (events.length) setFeedbackQueue((current) => [...current, ...events]);
  }, [feedbackKey, feedbackMessage]);

  useEffect(() => {
    if (activeFeedback || feedbackQueue.length === 0) return;
    const [next, ...remaining] = feedbackQueue;
    setFeedbackQueue(remaining);
    setActiveFeedback(next);
  }, [activeFeedback, feedbackQueue]);

  useEffect(() => {
    if (!activeFeedback) return;
    playDuelSound(activeFeedback.kind, soundEnabled);
    const timer = window.setTimeout(() => setActiveFeedback(null), activeFeedback.duration);
    return () => window.clearTimeout(timer);
  }, [activeFeedback, soundEnabled]);

  useEffect(() => {
    if (duel && soundEnabled) startDuelBgm(true);
    else stopDuelBgm();
    return () => stopDuelBgm();
  }, [duel !== null, soundEnabled]);

  useEffect(() => {
    if (duel?.result !== "win" || rewarded.current) return;
    rewarded.current = true;
    const rewardId = CPU_DECK[Math.floor(Math.random() * CPU_DECK.length)];
    const kept = onReward(rewardId);
    setRewardName(cardById.get(rewardId)?.name ?? null);
    setRewardDiscarded(!kept);
  }, [duel?.result, onReward]);

  function startDuel() {
    unlockDuelAudio(soundEnabled);
    const counts = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
    const fusionCounts = JSON.parse(localStorage.getItem(FUSION_DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
    const playerCards = expandDeck(counts);
    const playerFusionCards = expandFusionDeck(fusionCounts);
    if (playerCards.length < MIN_DECK_SIZE) return;

    const shuffledPlayer = shuffle(playerCards);
    const shuffledCpu = shuffle(CPU_DECK);
    const playerDraw = shuffledPlayer.slice(0, 6);
    const cpuDraw = shuffledCpu.slice(0, 5);
    rewarded.current = false;
    setRewardName(null);
    setRewardDiscarded(false);
    setSelectedAttacker(null);
    setPendingTribute(null);
    setPendingReborn(null);
    setPendingDeSpell(null);
    setPendingEgotist(null);
    setPendingTributeToDoomed(null);
    setPendingSoulRelease(null);
    setPendingCheerfulCoffin(null);
    setPendingFusion(null);
    setPendingLastWill(null);
    setPendingChangeOfHeart(null);
    setPendingCannonSoldier(null);
    setPendingCatapultTurtle(null);
    setPendingBarrelDragon(null);
    setPendingGaleDogra(null);
    setPendingCyberStein(null);
    setPendingAileSwordsman(null);
    setPendingYadoKaru(null);
    setPendingGracefulCharity(null);
    setPendingCardInspection(null);
    setPendingHandDisruption(null);
    setPendingFinalDestiny(null);
    setPendingSharePain(null);
    setPendingMatangoTransfer(null);
    setPendingStopAttack(null);
    setPendingSpellbindingCircle(null);
    setCpuPlayback(null);
    setFeedbackQueue([]);
    setActiveFeedback(null);
    setDuel({
      playerDeck: shuffledPlayer.slice(6),
      playerFusionDeck: playerFusionCards,
      cpuDeck: shuffledCpu.slice(5),
      cpuFusionDeck: [...CPU_FUSION_DECK],
      playerHand: playerDraw,
      cpuHand: cpuDraw,
      playerField: [],
      cpuField: [],
      playerSpellTrap: [],
      playerFieldSpell: null,
      playerSwordsTurns: [],
      cpuSpellTrap: [],
      cpuFieldSpell: null,
      cpuSwordsTurns: [],
      playerExtraBattles: 0,
      cpuExtraBattles: 0,
      playerGraveyard: [],
      cpuGraveyard: [],
      playerMonsterSentToGraveTurn: null,
      cpuMonsterSentToGraveTurn: null,
      playerLp: STARTING_LP,
      cpuLp: STARTING_LP,
      turn: "player",
      turnNumber: 1,
      phase: "standby",
      normalSummoned: false,
      reverseTrapTurn: null,
      reverseTrapDeclinedTurn: null,
      playerWabokuTurn: null,
      result: null,
      pendingTrapResponse: null,
      pendingSevenTools: null,
      pendingMagicJammer: null,
      pendingHornOfHeaven: null,
      pendingSolemnJudgment: null,
      pendingGuardianResponse: null,
      pendingMirrorForce: null,
      pendingKuribohResponse: null,
      pendingWabokuResponse: null,
      pendingRobbinGoblin: null,
      pendingJustDesserts: null,
      pendingBattleStatTrap: null,
      pendingReverseTrap: null,
      playerActiveTraps: [],
      cpuActiveTraps: [],
      pendingBlastJuggler: null,
      pendingAntiRaigeki: null,
      pendingSpellSpecificTrap: null,
      pendingFakeTrap: null,
      pendingTwoPronged: null,
      pendingFlipTarget: null,
      pendingFlipQueue: [],
      pendingMultiTarget: null,
      pendingDeckReorder: null,
      pendingDeckSearch: null,
      log: ["デュエル開始。先攻プレイヤーは6枚でスタート。", "第1ターンは攻撃できません。"],
    });
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("ocg2003.duel-sound.v1", next ? "on" : "off");
    if (next) {
      unlockDuelAudio(true);
      playDuelSound("effect", true);
    }
  }

  function summon(handIndex: number, position: Position) {
    if (!duel || !isPlayerMainPhase || duel.normalSummoned || duel.result || pendingReborn !== null || pendingDeSpell !== null) return;
    if (!canPayDuelChainEnergy(duel, "player")) return;
    const id = duel.playerHand[handIndex];
    const card = cardById.get(id);
    if (!card || card.cardType !== "monster" || !canNormalSummonMonster(card.id, card.fusion)) return;
    const tributes = tributeCount(card);
    if (duel.playerField.length < tributes || duel.playerField.length - tributes >= FIELD_LIMIT) return;
    if (tributes > 0) {
      setPendingTribute({ handIndex, position, required: tributes, selected: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }
    performSummon(handIndex, position, []);
  }

  function performSummon(handIndex: number, position: Position, tributeIndexes: number[]) {
    if (!duel) return;
    const id = duel.playerHand[handIndex];
    const card = cardById.get(id);
    if (!card || card.cardType !== "monster" || !canNormalSummonMonster(card.id, card.fusion) || tributeIndexes.length !== tributeCount(card)) return;
    const tributedZones = duel.playerField.filter((_, index) => tributeIndexes.includes(index));
    const returnedTributes = tributedZones.filter((zone) => zone.controlReturn === "cpu");
    const playerTributes = tributedZones.filter((zone) => zone.controlReturn !== "cpu");
    const tributeNames = tributeIndexes.map((index) => cardById.get(duel.playerField[index].id)?.name).filter(Boolean);
    const nextField = duel.playerField.filter((_, index) => !tributeIndexes.includes(index));
    const lockedByJar = isDragonCaptureJarLocked(card.kind, false, isDragonCaptureJarActive(duel));
    const summonPosition: Position = position === "attack" && lockedByJar ? "defense" : position;
    nextField.push({
      id,
      position: summonPosition,
      faceDown: position === "defense",
      attacked: false,
      equipped: [],
      summonedTurn: duel.turnNumber,
      positionChanged: false,
    });
    let nextState: DuelState = {
      ...duel,
      playerHand: duel.playerHand.filter((_, index) => index !== handIndex),
      playerLp: duel.playerLp - duelChainEnergyCost(duel),
      playerField: nextField,
      playerSpellTrap: discardEquips(duel.playerSpellTrap, playerTributes),
      cpuSpellTrap: discardEquips(duel.cpuSpellTrap, returnedTributes),
      playerGraveyard: [...duel.playerGraveyard, ...graveCards(playerTributes)],
      cpuGraveyard: [...duel.cpuGraveyard, ...graveCards(returnedTributes)],
      normalSummoned: true,
      log: appendLog(duel.log, `${card.name}を${position === "attack" ? lockedByJar ? "召喚し、封印の壺で守備表示" : "攻撃表示で召喚" : "裏側守備表示でセット"}。${tributeNames.length ? `（${tributeNames.join("、")}をリリース）` : ""}`),
    };
    if (duelChainEnergyCost(duel) > 0) {
      nextState.log = appendLog(nextState.log, `魔力の枷によりプレイヤーが${duelChainEnergyCost(duel)}LPを支払った。`);
    }
    if (position === "attack") nextState = applyMysteriousPuppeteerGain(nextState);
    const cpuTrapIndex = areTrapEffectsNegated(nextState) ? -1 : nextState.cpuSpellTrap.indexOf("vol1-trap-hole");
    if (position === "attack" && (card.atk ?? 0) >= 1000 && cpuTrapIndex >= 0) {
      const trappedMonster = nextState.playerField[nextState.playerField.length - 1];
      const sevenToolsIndex = nextState.playerSpellTrap.indexOf("vol6-seven-tools");
      if (trappedMonster && sevenToolsIndex >= 0 && canActivateSevenTools(nextState.playerLp, nextState.playerSpellTrap)) {
        nextState = {
          ...nextState,
          pendingSevenTools: {
            sevenToolsIndex,
            trapIndex: cpuTrapIndex,
            monsterIndex: nextState.playerField.length - 1,
            monsterId: card.id,
            playerTributes,
            cpuTributes: returnedTributes,
          },
          log: appendLog(nextState.log, `CPUが落とし穴を発動。盗賊の七つ道具を発動しますか？`),
        };
        setDuel(nextState);
        setPendingTribute(null);
        return;
      }
      const solemnIndex = areTrapEffectsNegated(nextState) ? -1 : nextState.playerSpellTrap.indexOf("vol6-solemn-judgment");
      if (trappedMonster && solemnIndex >= 0) {
        nextState = {
          ...nextState,
          pendingSolemnJudgment: {
            kind: "trap",
            trapIndex: solemnIndex,
            cardId: "vol1-trap-hole",
            monsterIndex: nextState.playerField.length - 1,
            playerTributes,
            cpuTributes: returnedTributes,
          },
          log: appendLog(nextState.log, "CPUが落とし穴を発動。神の宣告を発動しますか？"),
        };
        setDuel(nextState);
        setPendingTribute(null);
        return;
      }
      nextState = {
        ...nextState,
        playerField: nextState.playerField.filter((_, index) => index !== nextState.playerField.length - 1),
        cpuSpellTrap: nextState.cpuSpellTrap.filter((_, index) => index !== cpuTrapIndex),
        playerGraveyard: [...nextState.playerGraveyard, card.id],
        cpuGraveyard: [...nextState.cpuGraveyard, "vol1-trap-hole"],
        log: appendLog(nextState.log, `CPUが落とし穴を発動。${card.name}を破壊。`),
      };
      nextState = applyDeckSearchTriggers(nextState, trappedMonster ? [...playerTributes, trappedMonster] : playerTributes, returnedTributes);
    } else {
      nextState = applyDeckSearchTriggers(nextState, playerTributes, returnedTributes);
    }
    setDuel(nextState);
    setPendingTribute(null);
  }

  function toggleTribute(index: number) {
    if (!pendingTribute) return;
    setPendingTribute((current) => {
      if (!current) return null;
      if (current.selected.includes(index)) {
        return { ...current, selected: current.selected.filter((value) => value !== index) };
      }
      if (current.selected.length >= current.required) return current;
      return { ...current, selected: [...current.selected, index] };
    });
  }

  function changePosition(index: number) {
    if (!duel || !isPlayerMainPhase || duel.result || pendingTribute || pendingReborn !== null || pendingDeSpell !== null) return;
    const zone = duel.playerField[index];
    if (!zone || zone.attacked || zone.positionChanged || zone.summonedTurn === duel.turnNumber) return;
    if (isSpellbindingCircleLocked(duel, zone)) return;
    if (isDragonCaptureJarLocked(cardById.get(zone.id)?.kind, zone.faceDown, isDragonCaptureJarActive(duel))) return;
    const nextPosition: Position = zone.position === "defense" ? "attack" : "defense";
    let next: DuelState = {
      ...duel,
      playerField: duel.playerField.map((item, fieldIndex) =>
        fieldIndex === index
          ? { ...item, position: nextPosition, faceDown: false, faceUpTurn: item.faceDown ? duel.turnNumber : item.faceUpTurn, positionChanged: true }
          : item,
      ),
      log: appendLog(
        duel.log,
        `${cardById.get(zone.id)?.name ?? "モンスター"}を${nextPosition === "attack" ? "攻撃" : "守備"}表示に変更。`,
      ),
    };
    if (zone.faceDown) {
      next = applyMysteriousPuppeteerGain(next);
      next = resolveFlipEffect(next, "player", zone.id);
    } else {
      const effect = positionChangeEffect(zone.id, zone.position, nextPosition);
      if (effect === "shuffle-deck") {
        next = {
          ...next,
          playerDeck: shuffle(next.playerDeck),
          log: appendLog(next.log, `${cardById.get(zone.id)?.name}の効果が発動。自分のデッキをシャッフル。`),
        };
      } else if (effect === "destroy-monster" || effect === "return-monster") {
        const pending = { monsterId: zone.id, owner: "player" as Side, effect } as PendingFlipTarget;
        next = flipTargetChoices(next, pending).length > 0
          ? {
              ...next,
              pendingFlipTarget: pending,
              log: appendLog(next.log, `${cardById.get(zone.id)?.name}の効果が発動。対象を選んでください。`),
            }
          : { ...next, log: appendLog(next.log, `${cardById.get(zone.id)?.name}の効果が発動したが、対象はいなかった。`) };
      } else if (effect === "destroy-dragon") {
        const pending: PendingMultiTarget = { monsterId: zone.id, effect, selected: [] };
        next = multiTargetChoices(next, pending).length > 0
          ? { ...next, pendingMultiTarget: pending, log: appendLog(next.log, `${cardById.get(zone.id)?.name}の効果が発動。破壊するドラゴン族を選んでください。`) }
          : { ...next, log: appendLog(next.log, `${cardById.get(zone.id)?.name}の効果が発動したが、ドラゴン族はいなかった。`) };
      }
    }
    setDuel(next);
    if (zone.id === "bo7-yado-karu" && !zone.faceDown && zone.position === "attack" && nextPosition === "defense" && duel.playerHand.length > 0) {
      setPendingYadoKaru({ sourceIndex: index, selected: [] });
    }
    setSelectedAttacker(null);
  }

  function useSpell(handIndex: number) {
    if (!duel || duel.result || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingDragonFlute !== null || pendingLastWill !== null) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "spell") return;
    const curseOfFiendStandby = card.id === "mr-curse-fiend" && duel.phase === "standby";
    if (!isPlayerMainPhase && !curseOfFiendStandby) return;
    if (!canPayDuelChainEnergy(duel, "player")) return;
    if (card.id === "mr-chain-energy") {
      const next = removeHandCard(duel, handIndex);
      setDuel({
        ...next,
        playerSpellTrap: [...next.playerSpellTrap, card.id],
        log: appendLog(next.log, "魔力の枷を発動。以後、手札からカードを出すたびに1枚につき500LPを支払う。"),
      });
      return;
    }
    if (card.id === "mr-curse-fiend") {
      const revealed: PendingFlipQueueItem[] = [
        ...duel.playerField.filter((zone) => zone.position === "defense" && zone.faceDown).map((zone) => ({ owner: "player" as Side, monsterId: zone.id })),
        ...duel.cpuField.filter((zone) => zone.position === "defense" && zone.faceDown).map((zone) => ({ owner: "cpu" as Side, monsterId: zone.id })),
      ];
      let next: DuelState = {
        ...removeHandCard(duel, handIndex),
        playerField: switchAllMonsterPositions(duel.playerField, duel.turnNumber),
        cpuField: switchAllMonsterPositions(duel.cpuField, duel.turnNumber),
        playerGraveyard: [...duel.playerGraveyard, card.id],
        log: appendLog(duel.log, "邪悪な儀式を発動。全モンスターの表示形式を入れ替え、このターンの表示形式変更を封じた。"),
      };
      next = resolveFlipItems(next, revealed);
      setDuel(next);
      return;
    }
    if (FIELD_SPELL_IDS.includes(card.id)) {
      const oldFieldSpell = duel.playerFieldSpell;
      setDuel({
        ...removeHandCard(duel, handIndex),
        playerFieldSpell: card.id,
        playerGraveyard: oldFieldSpell ? [...duel.playerGraveyard, oldFieldSpell] : duel.playerGraveyard,
        log: appendLog(duel.log, `${card.name}を発動。フィールドのモンスターに種族補正を適用。`),
      });
      return;
    }
    if (EQUIP_RULES[card.id]) {
      if (!canActivateEquip(duel, card.id)) return;
      setSelectedEquip(handIndex);
      setSelectedAttacker(null);
      return;
    }

    if (card.id === "ex-039") {
      if (duel.playerMonsterSentToGraveTurn !== duel.turnNumber || duel.playerField.length >= FIELD_LIMIT || lastWillTargets(duel.playerDeck).length === 0) return;
      setPendingLastWill(handIndex);
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "mr-rush-recklessly" || card.id === "mr-reliable-guardian") {
      if (![...duel.playerField, ...duel.cpuField].some((zone) => !zone.faceDown)) return;
      setPendingTemporaryStat({ cardId: card.id, source: "hand", sourceIndex: handIndex });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "mr-tailor-fickle") {
      if (![...duel.playerField, ...duel.cpuField].some((zone) => zone.equipped.some((id) => cardById.get(id)?.kind === "装備魔法"))) return;
      setPendingTailor({ spellIndex: handIndex, sourceSide: null, sourceIndex: null, equipId: null });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol2-monster-reborn") {
      if (isMonsterRebornBlocked(duel.playerSpellTrap, duel.cpuSpellTrap)) return;
      const hasTarget = [...duel.playerGraveyard, ...duel.cpuGraveyard]
        .some((id) => cardById.get(id)?.cardType === "monster");
      if (!hasTarget || duel.playerField.length >= FIELD_LIMIT) return;
      setPendingReborn(handIndex);
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol2-de-spell" || card.id === "stb-remove-trap" || card.id === "mr-mystical-space-typhoon") {
      const hasRemoveTrapTarget = [...duel.playerSpellTrap, ...duel.cpuSpellTrap].some(isFaceUpTrapTarget);
      if (card.id === "stb-remove-trap" && !hasRemoveTrapTarget) return;
      if ((card.id === "vol2-de-spell" || card.id === "mr-mystical-space-typhoon") && duel.playerSpellTrap.length + duel.cpuSpellTrap.length === 0 && !duel.playerFieldSpell && !duel.cpuFieldSpell) return;
      setPendingDeSpell(handIndex);
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol4-elegant-egotist") {
      if (!canActivateElegantEgotist(duel, handIndex)) return;
      setPendingEgotist(handIndex);
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol5-tribute-doomed") {
      if (!canActivateTributeToDoomed(duel.playerHand.length, duel.playerField.length + duel.cpuField.length)) return;
      setPendingTributeToDoomed({ spellIndex: handIndex, discardIndex: null });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol5-soul-release") {
      if (duel.playerGraveyard.length + duel.cpuGraveyard.length === 0) return;
      setPendingSoulRelease({ spellIndex: handIndex, selected: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol5-cheerful-coffin") {
      const otherCardTypes = duel.playerHand.flatMap((id, index) =>
        index === handIndex ? [] : [cardById.get(id)?.cardType ?? ""],
      );
      if (!canActivateCheerfulCoffin(otherCardTypes)) return;
      setPendingCheerfulCoffin({ spellIndex: handIndex, selected: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol5-change-heart") {
      if (!canActivateChangeOfHeart(duel.playerField.length, duel.cpuField.length, FIELD_LIMIT)
        || !duel.cpuField.some((zone) => !isEffectTargetProtected(duel, "cpu", zone))) return;
      setPendingChangeOfHeart(handIndex);
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol7-stop-attack") {
      if (!duel.cpuField.some((zone) => canStopAttackTarget(zone.position, zone.faceDown) && !isEffectTargetProtected(duel, "cpu", zone))) return;
      setPendingStopAttack(handIndex);
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "stb-polymerization" || card.id === "vol6-polymerization") {
      const choices = fusionChoices(
        duel.playerFusionDeck,
        [...duel.playerHand.filter((_, index) => index !== handIndex), ...duel.playerField.map((zone) => zone.id)],
      );
      if (duel.playerField.length >= FIELD_LIMIT || choices.length === 0) return;
      setPendingFusion({ spellIndex: handIndex, fusionId: null, selected: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "ex-085") {
      const lordFaceUp = duel.playerField.some((zone) => zone.id === "ex-084" && !zone.faceDown);
      const dragonInHand = duel.playerHand.some((id, index) => index !== handIndex && cardById.get(id)?.kind === "ドラゴン族");
      if (!lordFaceUp || !dragonInHand || duel.playerField.length >= FIELD_LIMIT) return;
      setPendingDragonFlute({ spellIndex: handIndex, selected: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol2-swords-revealing-light") {
      if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
      const next = removeHandCard(duel, handIndex);
      let revealed: DuelState = {
        ...next,
        cpuField: next.cpuField.map((zone) => ({ ...zone, faceDown: false, faceUpTurn: zone.faceDown ? next.turnNumber : zone.faceUpTurn })),
        playerSpellTrap: [...next.playerSpellTrap, card.id],
        playerSwordsTurns: [...next.playerSwordsTurns, 3],
        log: appendLog(next.log, "光の護封剣を発動。相手モンスターを表にし、3ターン攻撃を封じます。"),
      };
      revealed = resolveFlipSequence(revealed, "cpu", next.cpuField.filter((item) => item.faceDown).map((zone) => zone.id));
      setDuel(revealed);
      return;
    }

    if (card.id === "mr-upstart-goblin") {
      const handWithoutSpell = duel.playerHand.filter((_, index) => index !== handIndex);
      const resolved = resolveUpstartGoblin(handWithoutSpell, duel.playerDeck, duel.cpuLp);
      if (!resolved) return;
      setDuel({
        ...duel,
        playerHand: resolved.hand,
        playerDeck: resolved.deck,
        cpuLp: resolved.opponentLp,
        playerGraveyard: [...duel.playerGraveyard, card.id],
        log: appendLog(duel.log, "成金ゴブリンを発動。1枚ドローし、CPUは1000LP回復。"),
      });
      return;
    }

    if (card.id === "mr-gravekeepers-servant" || card.id === "mr-toll") {
      if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
      const next = removeHandCard(duel, handIndex);
      setDuel({
        ...next,
        playerSpellTrap: [...next.playerSpellTrap, card.id],
        log: appendLog(next.log, `${card.name}を発動。攻撃宣言に必要なコストを適用します。`),
      });
      return;
    }

    if (card.id === "mr-confiscation" || card.id === "mr-forceful-sentry") {
      if (duel.cpuHand.length === 0 || (card.id === "mr-confiscation" && duel.playerLp <= 1000)) return;
      setPendingHandDisruption({
        kind: card.id === "mr-confiscation" ? "confiscation" : "forceful-sentry",
        spellIndex: handIndex,
      });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "mr-delinquent-duo") {
      if (duel.cpuHand.length === 0 || duel.playerLp <= 1000) return;
      const result = resolveDelinquentDuo(duel.cpuHand, Math.floor(Math.random() * duel.cpuHand.length), 0);
      const next = removeHandCard(duel, handIndex);
      const resolved: DuelState = {
        ...next,
        playerLp: next.playerLp - 1000,
        cpuHand: result.hand,
        playerGraveyard: [...next.playerGraveyard, card.id],
        cpuGraveyard: [...next.cpuGraveyard, ...result.discarded],
        log: appendLog(next.log, `いたずら好きな双子悪魔を発動。1000LPを払い、CPUは手札を${result.discarded.length}枚捨てた。`),
      };
      setDuel(applyOpponentDiscardTriggers(resolved, "cpu", result.discarded));
      return;
    }

    if (card.id === "mr-final-destiny") {
      if (duel.playerHand.length < 6) return;
      setPendingFinalDestiny({ spellIndex: handIndex, selected: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "mr-painful-choice") {
      if (duel.playerDeck.length < 5) return;
      setPendingPainfulChoice({ spellIndex: handIndex, selected: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "mr-darkness-approaches") {
      if (duel.playerHand.length < 3 || ![...duel.playerField, ...duel.cpuField].some((zone) => !zone.faceDown)) return;
      setPendingDarknessApproaches({ spellIndex: handIndex, discardIndexes: [] });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "bo2-light-reveal") {
      const next = removeHandCard(duel, handIndex);
      setDuel({
        ...next,
        cpuField: next.cpuField.map((zone) => ({ ...zone, faceDown: false, faceUpTurn: zone.faceDown ? next.turnNumber : zone.faceUpTurn })),
        playerGraveyard: [...next.playerGraveyard, card.id],
        log: appendLog(next.log, `闇をかき消す光を発動。相手の裏側表示モンスター${next.cpuField.filter((zone) => zone.faceDown).length}体を確認。`),
      });
      return;
    }

    if (card.id === "bo2-amateur-spy") {
      if (duel.cpuHand.length === 0) return;
      const next = removeHandCard(duel, handIndex);
      setDuel({ ...next, playerGraveyard: [...next.playerGraveyard, card.id], log: appendLog(next.log, "未熟な密偵を発動。確認する相手の手札を選んでください。") });
      setPendingCardInspection({ kind: "spy", selected: null });
      return;
    }

    if (card.id === "bo3-ancient-telescope") {
      if (duel.cpuDeck.length === 0) return;
      const next = removeHandCard(duel, handIndex);
      setDuel({ ...next, playerGraveyard: [...next.playerGraveyard, card.id], log: appendLog(next.log, "古代の遠眼鏡を発動。相手デッキの上から5枚を確認。") });
      setPendingCardInspection({ kind: "telescope", selected: null });
      return;
    }

    if (card.id === "bo4-graceful-charity") {
      const handWithoutSpell = duel.playerHand.filter((_, index) => index !== handIndex);
      const drawn = gracefulCharityDraw(handWithoutSpell, duel.playerDeck);
      if (!drawn) return;
      setDuel({
        ...duel,
        playerHand: drawn.hand,
        playerDeck: drawn.deck,
        playerGraveyard: [...duel.playerGraveyard, card.id],
        log: appendLog(duel.log, "天使の施しを発動。3枚ドローし、捨てる2枚を選んでください。"),
      });
      setPendingGracefulCharity([]);
      return;
    }

    if (card.id === "bo6-fusion-sage") {
      const fusionIndex = duel.playerDeck.findIndex((id) => id === "stb-polymerization" || id === "vol6-polymerization");
      if (fusionIndex < 0) return;
      const fusionId = duel.playerDeck[fusionIndex];
      const next = removeHandCard(duel, handIndex);
      setDuel({
        ...next,
        playerDeck: next.playerDeck.filter((_, index) => index !== fusionIndex),
        playerHand: [...next.playerHand, fusionId],
        playerGraveyard: [...next.playerGraveyard, card.id],
        log: appendLog(next.log, "融合賢者を発動。デッキから「融合」を手札に加えた。"),
      });
      return;
    }

    if (card.id === "bo6-revolution") {
      const damage = duel.cpuHand.length * 200;
      const next = removeHandCard(duel, handIndex);
      const cpuLp = Math.max(0, next.cpuLp - damage);
      setDuel({
        ...next,
        cpuLp,
        playerGraveyard: [...next.playerGraveyard, card.id],
        result: cpuLp === 0 ? "win" : next.result,
        log: appendLog(next.log, `革命を発動。相手の手札${duel.cpuHand.length}枚につき200、合計${damage}ダメージ。`),
      });
      return;
    }

    if (card.id === "bo7-share-pain") {
      if (duel.playerField.length === 0 || duel.cpuField.length === 0) return;
      setPendingSharePain({ spellIndex: handIndex });
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    let next = {
      ...removeHandCard(duel, handIndex),
      playerGraveyard: [...duel.playerGraveyard, card.id],
    };
    if (card.id === "vol1-dark-hole") {
      const returnedMonsters = next.playerField.filter((zone) => zone.controlReturn === "cpu");
      const playerMonsters = next.playerField.filter((zone) => zone.controlReturn !== "cpu");
      const cpuMonsters = next.cpuField;
      next = {
        ...next,
        playerField: [],
        cpuField: [],
        playerSpellTrap: discardEquips(next.playerSpellTrap, playerMonsters),
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, [...next.cpuField, ...returnedMonsters]),
        playerGraveyard: [...next.playerGraveyard, ...graveCards(playerMonsters)],
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards(next.cpuField), ...graveCards(returnedMonsters)],
      };
      next = applyDeckSearchTriggers(next, playerMonsters, [...cpuMonsters, ...returnedMonsters]);
    } else if (card.id === "bo7-heavy-storm") {
      const playerCards = [...next.playerSpellTrap, ...(next.playerFieldSpell ? [next.playerFieldSpell] : [])];
      const cpuCards = [...next.cpuSpellTrap, ...(next.cpuFieldSpell ? [next.cpuFieldSpell] : [])];
      next = {
        ...next,
        playerField: next.playerField.map((zone) => ({ ...zone, equipped: [] })),
        cpuField: next.cpuField.map((zone) => ({ ...zone, equipped: [] })),
        playerSpellTrap: [],
        cpuSpellTrap: [],
        playerFieldSpell: null,
        cpuFieldSpell: null,
        playerSwordsTurns: [],
        cpuSwordsTurns: [],
        playerGraveyard: [...next.playerGraveyard, ...playerCards],
        cpuGraveyard: [...next.cpuGraveyard, ...cpuCards],
        log: appendLog(next.log, `大嵐を発動。フィールドの魔法・罠カード${playerCards.length + cpuCards.length}枚をすべて破壊。`),
      };
    } else if (card.id === "mr-giant-trunade") {
      const playerCards = [...next.playerSpellTrap, ...(next.playerFieldSpell ? [next.playerFieldSpell] : [])];
      const cpuCards = [...next.cpuSpellTrap, ...(next.cpuFieldSpell ? [next.cpuFieldSpell] : [])];
      next = {
        ...next,
        playerField: next.playerField.map((zone) => ({ ...zone, equipped: [] })),
        cpuField: next.cpuField.map((zone) => ({ ...zone, equipped: [] })),
        playerHand: [...next.playerHand, ...playerCards],
        cpuHand: [...next.cpuHand, ...cpuCards],
        playerSpellTrap: [],
        cpuSpellTrap: [],
        playerFieldSpell: null,
        cpuFieldSpell: null,
        playerSwordsTurns: [],
        cpuSwordsTurns: [],
        playerActiveTraps: [],
        cpuActiveTraps: [],
      };
    } else if (card.id === "stb-raigeki") {
      const destroyedCpu = next.cpuField;
      next = {
        ...next,
        cpuField: [],
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, next.cpuField),
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards(next.cpuField)],
      };
      next = applyDeckSearchTriggers(next, [], destroyedCpu);
    } else if (raceDestructionKind(card.id)) {
      const matches = (zone: ZoneCard) => isRaceDestructionTarget(card.id, cardById.get(zone.id)?.kind ?? "", zone.faceDown);
      const destroyedPlayer = next.playerField.filter((zone) => matches(zone) && zone.controlReturn !== "cpu");
      const returnedCpu = next.playerField.filter((zone) => matches(zone) && zone.controlReturn === "cpu");
      const destroyedCpu = next.cpuField.filter(matches);
      if (destroyedPlayer.length + returnedCpu.length + destroyedCpu.length === 0) return;
      next = {
        ...next,
        playerField: next.playerField.filter((zone) => !matches(zone)),
        cpuField: next.cpuField.filter((zone) => !matches(zone)),
        playerSpellTrap: discardEquips(next.playerSpellTrap, destroyedPlayer),
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, [...destroyedCpu, ...returnedCpu]),
        playerGraveyard: [...next.playerGraveyard, ...graveCards(destroyedPlayer)],
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards(destroyedCpu), ...graveCards(returnedCpu)],
      };
      next = applyDeckSearchTriggers(next, destroyedPlayer, [...destroyedCpu, ...returnedCpu]);
    } else if (simpleSpellEffect(card.id)) {
      const resolution = resolveSimpleSpellLife(card.id, next.playerLp, next.cpuLp);
      if (!resolution) return;
      next = {
        ...next,
        playerLp: resolution.ownLp,
        cpuLp: resolution.opponentLp,
        result: resolution.outcome === "own-win" ? "win" : resolution.outcome === "own-lose" ? "lose" : resolution.outcome,
      };
    } else if (card.id === "vol1-fissure") {
      const target = lowestFaceUpAttackIndex(next.cpuField, next, "cpu");
      if (target === null) return;
      const destroyedCpu = next.cpuField[target];
      next = {
        ...next,
        cpuField: next.cpuField.filter((_, index) => index !== target),
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, [next.cpuField[target]]),
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards([next.cpuField[target]])],
      };
      next = applyDeckSearchTriggers(next, [], destroyedCpu ? [destroyedCpu] : []);
    } else if (card.id === "vol3-pot-of-greed") {
      if (next.playerDeck.length < 2) return;
      next = {
        ...next,
        playerHand: [...next.playerHand, ...next.playerDeck.slice(0, 2)],
        playerDeck: next.playerDeck.slice(2),
      };
    } else if (card.id === "vol3-stop-defense") {
      const target = next.cpuField.findIndex((zone) => zone.position === "defense"
        && !isDragonCaptureJarLocked(cardById.get(zone.id)?.kind, zone.faceDown, isDragonCaptureJarActive(next)));
      if (target < 0) return;
      const targetZone = next.cpuField[target];
      next = {
        ...next,
        cpuField: next.cpuField.map((zone, index) => index === target
          ? { ...zone, position: "attack", faceDown: false, faceUpTurn: zone.faceDown ? next.turnNumber : zone.faceUpTurn, positionChanged: true }
          : zone),
      };
      if (targetZone.faceDown) next = resolveFlipEffect(next, "cpu", targetZone.id);
    } else if (card.id === "vol3-gravedigger-ghoul") {
      const targets = next.cpuGraveyard
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => cardById.get(id)?.cardType === "monster")
        .slice(0, 2)
        .map(({ index }) => index);
      if (targets.length === 0) return;
      next = { ...next, cpuGraveyard: next.cpuGraveyard.filter((_, index) => !targets.includes(index)) };
    } else if (card.id === "vol7-shield-sword") {
      next = {
        ...next,
        playerField: next.playerField.map((zone) => zone.faceDown ? zone : { ...zone, statsSwappedTurn: duel.turnNumber }),
        cpuField: next.cpuField.map((zone) => zone.faceDown ? zone : { ...zone, statsSwappedTurn: duel.turnNumber }),
      };
    } else return;
    next.log = appendLog(
      next.log,
      card.id === "vol7-tremendous-fire"
        ? "火炎地獄を発動。CPUに1000ダメージ、自分に500ダメージ。"
        : card.id === "vol7-shield-sword"
          ? "右手に盾を左手に剣をを発動。現在表側表示の全モンスターの元々のATKとDEFをターン終了時まで入れ替えた。"
        : `${card.name}を発動。`,
    );
    next = cleanupSnatchStealControl(next);
    setDuel(next);
  }

  function toggleGracefulCharityCard(handIndex: number) {
    setPendingGracefulCharity((current) => {
      if (current === null) return null;
      if (current.includes(handIndex)) return current.filter((index) => index !== handIndex);
      if (current.length >= 2) return current;
      return [...current, handIndex].sort((a, b) => a - b);
    });
  }

  function resolveGracefulCharity() {
    if (!duel || pendingGracefulCharity?.length !== 2) return;
    const discarded = selectedCards(duel.playerHand, pendingGracefulCharity);
    setDuel({
      ...duel,
      playerHand: discarded.remaining,
      playerGraveyard: [...duel.playerGraveyard, ...discarded.chosen],
      log: appendLog(duel.log, `天使の施しの効果で${discarded.chosen.map((id) => cardById.get(id)?.name).join("、")}を捨てた。`),
    });
    setPendingGracefulCharity(null);
  }

  function resolveHandDisruptionSpell(targetIndex: number) {
    if (!duel || !pendingHandDisruption) return;
    const spellId = pendingHandDisruption.kind === "confiscation" ? "mr-confiscation" : "mr-forceful-sentry";
    if (duel.playerHand[pendingHandDisruption.spellIndex] !== spellId) return;
    const result = resolveHandDisruption(
      pendingHandDisruption.kind === "confiscation" ? "discard" : "return-deck",
      duel.cpuHand,
      duel.cpuDeck,
      targetIndex,
    );
    if (!result || (pendingHandDisruption.kind === "confiscation" && duel.playerLp <= 1000)) return;
    const next = removeHandCard(duel, pendingHandDisruption.spellIndex);
    const targetName = cardById.get(result.affected)?.name ?? "カード";
    const resolved: DuelState = {
      ...next,
      playerLp: pendingHandDisruption.kind === "confiscation" ? next.playerLp - 1000 : next.playerLp,
      cpuHand: result.hand,
      cpuDeck: result.deck,
      playerGraveyard: [...next.playerGraveyard, spellId],
      cpuGraveyard: pendingHandDisruption.kind === "confiscation" ? [...next.cpuGraveyard, result.affected] : next.cpuGraveyard,
      log: appendLog(next.log, pendingHandDisruption.kind === "confiscation"
        ? `押収を発動。1000LPを払い、CPUの${targetName}を墓地へ捨てた。`
        : `強引な番兵を発動。CPUの${targetName}をデッキに戻した。`),
    };
    setDuel(pendingHandDisruption.kind === "confiscation"
      ? applyOpponentDiscardTriggers(resolved, "cpu", [result.affected])
      : resolved);
    setPendingHandDisruption(null);
  }

  function beginSnakeFang(trapIndex: number) {
    if (!duel || !isPlayerMainPhase || areTrapEffectsNegated(duel) || duel.playerSpellTrap[trapIndex] !== "mr-snake-fang") return;
    if (![...duel.playerField, ...duel.cpuField].some((zone) => !zone.faceDown)) return;
    setPendingTemporaryStat({ cardId: "mr-snake-fang", source: "trap", sourceIndex: trapIndex });
    setSelectedAttacker(null);
    setSelectedEquip(null);
  }

  function beginSpellbindingCircle(trapIndex: number) {
    if (!duel || !isPlayerMainPhase || areTrapEffectsNegated(duel) || duel.playerSpellTrap[trapIndex] !== "mr-spellbinding-circle") return;
    if (hasSpellbindingCircleTarget(duel, "player")) return;
    if (!duel.cpuField.some((zone) => !zone.faceDown && !isEffectTargetProtected(duel, "cpu", zone))) return;
    setPendingSpellbindingCircle(trapIndex);
    setSelectedAttacker(null);
    setSelectedEquip(null);
  }

  function resolveSpellbindingCircle(targetIndex: number) {
    if (!duel || pendingSpellbindingCircle === null || duel.playerSpellTrap[pendingSpellbindingCircle] !== "mr-spellbinding-circle") return;
    const target = duel.cpuField[targetIndex];
    if (!target || target.faceDown || isEffectTargetProtected(duel, "cpu", target)) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    setDuel({
      ...duel,
      cpuField: duel.cpuField.map((zone, index) => index === targetIndex ? { ...zone, spellbindingCircleOwner: "player" } : zone),
      playerActiveTraps: [...new Set([...duel.playerActiveTraps, "mr-spellbinding-circle"])],
      log: appendLog(duel.log, `六芒星の呪縛を発動。${targetName}の攻撃と表示形式の変更を封じた。`),
    });
    setPendingSpellbindingCircle(null);
  }

  function resolveTemporaryStat(side: Side, targetIndex: number) {
    if (!duel || !pendingTemporaryStat) return;
    const field = side === "player" ? duel.playerField : duel.cpuField;
    const target = field[targetIndex];
    if (!target || target.faceDown) return;
    const sourceId = pendingTemporaryStat.source === "hand"
      ? duel.playerHand[pendingTemporaryStat.sourceIndex]
      : duel.playerSpellTrap[pendingTemporaryStat.sourceIndex];
    if (sourceId !== pendingTemporaryStat.cardId) return;

    const cardName = cardById.get(pendingTemporaryStat.cardId)?.name ?? "カード";
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const isAttackBoost = pendingTemporaryStat.cardId === "mr-rush-recklessly";
    const amount = pendingTemporaryStat.cardId === "mr-snake-fang" ? -500 : 700;
    const updatedField = field.map((zone, index) => index !== targetIndex ? zone : isAttackBoost
      ? { ...zone, battleAtkBonusTurn: duel.turnNumber, battleAtkBonusValue: amount }
      : { ...zone, battleDefBonusTurn: duel.turnNumber, battleDefBonusValue: amount });
    const withoutSource = pendingTemporaryStat.source === "hand"
      ? { playerHand: duel.playerHand.filter((_, index) => index !== pendingTemporaryStat.sourceIndex), playerSpellTrap: duel.playerSpellTrap }
      : { playerHand: duel.playerHand, playerSpellTrap: duel.playerSpellTrap.filter((_, index) => index !== pendingTemporaryStat.sourceIndex) };
    const paidDuel = pendingTemporaryStat.source === "hand" ? applyChainEnergyPayment(duel, "player") : duel;
    setDuel({
      ...paidDuel,
      ...withoutSource,
      [side === "player" ? "playerField" : "cpuField"]: updatedField,
      playerGraveyard: [...duel.playerGraveyard, pendingTemporaryStat.cardId],
      log: appendLog(paidDuel.log, `${cardName}を発動。${targetName}の${isAttackBoost ? "ATK" : "DEF"}をターン終了時まで${amount > 0 ? `${amount}アップ` : `${Math.abs(amount)}ダウン`}。`),
    });
    setPendingTemporaryStat(null);
  }

  function togglePainfulChoiceCard(deckIndex: number) {
    setPendingPainfulChoice((current) => {
      if (!current) return null;
      if (current.selected.includes(deckIndex)) return { ...current, selected: current.selected.filter((index) => index !== deckIndex) };
      if (current.selected.length >= 5) return current;
      return { ...current, selected: [...current.selected, deckIndex].sort((a, b) => a - b) };
    });
  }

  function confirmPainfulChoice() {
    if (!duel || !pendingPainfulChoice || duel.playerHand[pendingPainfulChoice.spellIndex] !== "mr-painful-choice") return;
    const offered = pendingPainfulChoice.selected.map((index) => duel.playerDeck[index]);
    const cpuChoice = weakestHandCardIndex(offered);
    const result = resolvePainfulChoice(duel.playerDeck, pendingPainfulChoice.selected, cpuChoice);
    if (!result) return;
    const chosenName = cardById.get(result.handCard)?.name ?? "カード";
    const paidDuel = applyChainEnergyPayment(duel, "player");
    setDuel({
      ...paidDuel,
      playerHand: [...duel.playerHand.filter((_, index) => index !== pendingPainfulChoice.spellIndex), result.handCard],
      playerDeck: result.deck,
      playerGraveyard: [...duel.playerGraveyard, "mr-painful-choice", ...result.graveCards],
      log: appendLog(paidDuel.log, `苦渋の選択を発動。5枚を公開し、CPUが選んだ${chosenName}を手札へ加え、残り4枚を墓地へ送った。`),
    });
    setPendingPainfulChoice(null);
  }

  function toggleDarknessDiscard(handIndex: number) {
    setPendingDarknessApproaches((current) => {
      if (!current || handIndex === current.spellIndex) return current;
      if (current.discardIndexes.includes(handIndex)) return { ...current, discardIndexes: current.discardIndexes.filter((index) => index !== handIndex) };
      if (current.discardIndexes.length >= 2) return current;
      return { ...current, discardIndexes: [...current.discardIndexes, handIndex].sort((a, b) => a - b) };
    });
  }

  function resolveDarknessApproaches(side: Side, targetIndex: number) {
    if (!duel || !pendingDarknessApproaches || duel.playerHand[pendingDarknessApproaches.spellIndex] !== "mr-darkness-approaches") return;
    const discarded = darknessApproachesDiscard(duel.playerHand, pendingDarknessApproaches.spellIndex, pendingDarknessApproaches.discardIndexes);
    const field = side === "player" ? duel.playerField : duel.cpuField;
    const target = field[targetIndex];
    if (!discarded || !target || target.faceDown) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const spellTrapKey = side === "player" ? "playerSpellTrap" : "cpuSpellTrap";
    const nextField = field.map((zone, index) => index === targetIndex
      ? { ...zone, faceDown: true, faceUpTurn: undefined, equipped: [] }
      : zone);
    const paidDuel = applyChainEnergyPayment(duel, "player");
    setDuel({
      ...paidDuel,
      playerHand: discarded.hand,
      [side === "player" ? "playerField" : "cpuField"]: nextField,
      [spellTrapKey]: discardEquips(duel[spellTrapKey], [target]),
      playerGraveyard: [...duel.playerGraveyard, "mr-darkness-approaches", ...discarded.discarded, ...(side === "player" ? target.equipped : [])],
      cpuGraveyard: [...duel.cpuGraveyard, ...(side === "cpu" ? target.equipped : [])],
      log: appendLog(paidDuel.log, `闇の訪れを発動。手札2枚を捨て、${targetName}を表示形式を変えずに裏側表示にした。`),
    });
    setPendingDarknessApproaches(null);
  }

  function selectTailorEquip(side: Side, sourceIndex: number, equipId: string) {
    if (!duel || !pendingTailor || duel.playerHand[pendingTailor.spellIndex] !== "mr-tailor-fickle") return;
    const source = (side === "player" ? duel.playerField : duel.cpuField)[sourceIndex];
    if (!source?.equipped.includes(equipId) || cardById.get(equipId)?.kind !== "装備魔法") return;
    setPendingTailor({ ...pendingTailor, sourceSide: side, sourceIndex, equipId });
  }

  function resolveTailor(side: Side, targetIndex: number) {
    if (!duel || !pendingTailor?.equipId || pendingTailor.sourceSide === null || pendingTailor.sourceIndex === null) return;
    if (duel.playerHand[pendingTailor.spellIndex] !== "mr-tailor-fickle") return;
    if (side === pendingTailor.sourceSide && targetIndex === pendingTailor.sourceIndex) return;
    const sourceField = pendingTailor.sourceSide === "player" ? duel.playerField : duel.cpuField;
    const targetField = side === "player" ? duel.playerField : duel.cpuField;
    const source = sourceField[pendingTailor.sourceIndex];
    const target = targetField[targetIndex];
    const targetCard = target ? cardById.get(target.id) : null;
    if (!source?.equipped.includes(pendingTailor.equipId) || !target || target.faceDown || !targetCard || !canEquip(pendingTailor.equipId, targetCard)) return;
    const sourceSpellTrap = pendingTailor.sourceSide === "player" ? duel.playerSpellTrap : duel.cpuSpellTrap;
    const targetSpellTrap = side === "player" ? duel.playerSpellTrap : duel.cpuSpellTrap;
    if (side !== pendingTailor.sourceSide && targetSpellTrap.length >= FIELD_LIMIT) return;

    const removeFromSource = (field: ZoneCard[]) => field.map((zone, index) => index === pendingTailor.sourceIndex
      ? { ...zone, equipped: removeCardCopies(zone.equipped, pendingTailor.equipId!, 1) }
      : zone);
    const addToTarget = (field: ZoneCard[]) => field.map((zone, index) => index === targetIndex
      ? { ...zone, equipped: [...zone.equipped, pendingTailor.equipId!] }
      : zone);
    let playerField = duel.playerField;
    let cpuField = duel.cpuField;
    if (pendingTailor.sourceSide === "player") playerField = removeFromSource(playerField);
    else cpuField = removeFromSource(cpuField);
    if (side === "player") playerField = addToTarget(playerField);
    else cpuField = addToTarget(cpuField);

    let playerSpellTrap = duel.playerSpellTrap;
    let cpuSpellTrap = duel.cpuSpellTrap;
    if (side !== pendingTailor.sourceSide) {
      if (pendingTailor.sourceSide === "player") {
        playerSpellTrap = removeCardCopies(sourceSpellTrap, pendingTailor.equipId, 1);
        cpuSpellTrap = [...targetSpellTrap, pendingTailor.equipId];
      } else {
        cpuSpellTrap = removeCardCopies(sourceSpellTrap, pendingTailor.equipId, 1);
        playerSpellTrap = [...targetSpellTrap, pendingTailor.equipId];
      }
    }
    const equipName = cardById.get(pendingTailor.equipId)?.name ?? "装備魔法";
    const targetName = targetCard.name;
    const paidDuel = applyChainEnergyPayment(duel, "player");
    setDuel({
      ...paidDuel,
      playerHand: duel.playerHand.filter((_, index) => index !== pendingTailor.spellIndex),
      playerField,
      cpuField,
      playerSpellTrap,
      cpuSpellTrap,
      playerGraveyard: [...duel.playerGraveyard, "mr-tailor-fickle"],
      log: appendLog(paidDuel.log, `移り気な仕立屋を発動。${equipName}を${targetName}へ移し替えた。`),
    });
    setPendingTailor(null);
  }

  function toggleFinalDestinyCard(handIndex: number) {
    setPendingFinalDestiny((current) => {
      if (!current || handIndex === current.spellIndex) return current;
      if (current.selected.includes(handIndex)) return { ...current, selected: current.selected.filter((index) => index !== handIndex) };
      if (current.selected.length >= 5) return current;
      return { ...current, selected: [...current.selected, handIndex].sort((a, b) => a - b) };
    });
  }

  function resolveFinalDestiny() {
    if (!duel || !pendingFinalDestiny || pendingFinalDestiny.selected.length !== 5 || duel.playerHand[pendingFinalDestiny.spellIndex] !== "mr-final-destiny") return;
    const discarded = selectedCards(duel.playerHand, pendingFinalDestiny.selected);
    const playerOwned = duel.playerField.filter((zone) => zone.controlReturn !== "cpu");
    const cpuOwnedOnPlayerField = duel.playerField.filter((zone) => zone.controlReturn === "cpu");
    const remainingHand = duel.playerHand.filter((_, index) => index !== pendingFinalDestiny.spellIndex && !pendingFinalDestiny.selected.includes(index));
    const paidDuel = applyChainEnergyPayment(duel, "player");
    let next: DuelState = {
      ...paidDuel,
      playerHand: remainingHand,
      playerField: [],
      cpuField: [],
      playerSpellTrap: [],
      cpuSpellTrap: [],
      playerFieldSpell: null,
      cpuFieldSpell: null,
      playerSwordsTurns: [],
      cpuSwordsTurns: [],
      playerActiveTraps: [],
      cpuActiveTraps: [],
      playerGraveyard: [
        ...duel.playerGraveyard,
        "mr-final-destiny",
        ...discarded.chosen,
        ...playerOwned.map((zone) => zone.id),
        ...duel.playerSpellTrap,
        ...(duel.playerFieldSpell ? [duel.playerFieldSpell] : []),
      ],
      cpuGraveyard: [
        ...duel.cpuGraveyard,
        ...duel.cpuField.map((zone) => zone.id),
        ...cpuOwnedOnPlayerField.map((zone) => zone.id),
        ...duel.cpuSpellTrap,
        ...(duel.cpuFieldSpell ? [duel.cpuFieldSpell] : []),
      ],
      log: appendLog(paidDuel.log, "最終戦争を発動。手札を5枚捨て、フィールドのカードを全て破壊した。"),
    };
    next = applyDeckSearchTriggers(next, playerOwned, [...duel.cpuField, ...cpuOwnedOnPlayerField]);
    setDuel(next);
    setPendingFinalDestiny(null);
  }

  function resolveSharePain(playerIndex: number) {
    if (!duel || !pendingSharePain || duel.playerHand[pendingSharePain.spellIndex] !== "bo7-share-pain") return;
    const playerTarget = duel.playerField[playerIndex];
    const cpuIndex = lowestAttackIndexes(duel.cpuField, 1)[0];
    const cpuTarget = cpuIndex === undefined ? null : duel.cpuField[cpuIndex];
    if (!playerTarget || !cpuTarget) return;
    const playerName = cardById.get(playerTarget.id)?.name ?? "モンスター";
    const cpuName = cardById.get(cpuTarget.id)?.name ?? "モンスター";
    const returnedCpu = playerTarget.controlReturn === "cpu" ? [playerTarget] : [];
    const ownTribute = playerTarget.controlReturn === "cpu" ? [] : [playerTarget];
    const paidDuel = applyChainEnergyPayment(duel, "player");
    let resolved: DuelState = {
      ...paidDuel,
      playerHand: duel.playerHand.filter((_, index) => index !== pendingSharePain.spellIndex),
      playerField: duel.playerField.filter((_, index) => index !== playerIndex),
      cpuField: duel.cpuField.filter((_, index) => index !== cpuIndex),
      playerSpellTrap: discardEquips(duel.playerSpellTrap, ownTribute),
      cpuSpellTrap: discardEquips(duel.cpuSpellTrap, [cpuTarget, ...returnedCpu]),
      playerGraveyard: [...duel.playerGraveyard, "bo7-share-pain", ...graveCards(ownTribute), ...returnedCpu.flatMap((zone) => zone.equipped)],
      cpuGraveyard: [...duel.cpuGraveyard, ...graveCards([cpuTarget]), ...returnedCpu.map((zone) => zone.id)],
      log: appendLog(paidDuel.log, `痛み分けを発動。自分は${playerName}、CPUは${cpuName}を生け贄にした。`),
    };
    resolved = applyDeckSearchTriggers(resolved, ownTribute, [cpuTarget, ...returnedCpu]);
    setPendingSharePain(null);
    setDuel(resolved);
  }

  function chooseFusionMonster(fusionId: string) {
    if (!duel || !pendingFusion) return;
    const available = fusionChoices(
      duel.playerFusionDeck,
      [...duel.playerHand.filter((_, index) => index !== pendingFusion.spellIndex), ...duel.playerField.map((zone) => zone.id)],
    );
    if (!available.includes(fusionId)) return;
    setPendingFusion({ ...pendingFusion, fusionId, selected: [] });
  }

  function summonWithLastWill(deckIndex: number, position: Position) {
    if (!duel || pendingLastWill === null || duel.playerHand[pendingLastWill] !== "ex-039" || duel.playerField.length >= FIELD_LIMIT) return;
    const monsterId = duel.playerDeck[deckIndex];
    if (!lastWillTargets(duel.playerDeck).some((target) => target.index === deckIndex)) return;
    const monster = cardById.get(monsterId);
    if (!monster) return;
    const next = removeHandCard(duel, pendingLastWill);
    setDuel({
      ...next,
      playerDeck: next.playerDeck.filter((_, index) => index !== deckIndex),
      playerField: [
        ...next.playerField,
        {
          id: monsterId,
          position,
          faceDown: false,
          attacked: false,
          equipped: [],
          summonedTurn: next.turnNumber,
          faceUpTurn: next.turnNumber,
          positionChanged: false,
        },
      ],
      playerGraveyard: [...next.playerGraveyard, "ex-039"],
      log: appendLog(next.log, `遺言状を発動。デッキから${monster.name}を${position === "attack" ? "攻撃" : "守備"}表示で特殊召喚。`),
    });
    setPendingLastWill(null);
  }

  function chooseFusionMaterial(source: "hand" | "field", index: number) {
    if (!duel || !pendingFusion?.fusionId) return;
    const recipe = fusionRecipe(pendingFusion.fusionId);
    const requiredId = recipe?.[pendingFusion.selected.length];
    const id = source === "hand" ? duel.playerHand[index] : duel.playerField[index]?.id;
    if (!requiredId || !id || !canSelectFusionMaterial(recipe ?? [], pendingFusion.selected.map((choice) => choice.id), id) || (source === "hand" && index === pendingFusion.spellIndex)) return;
    if (pendingFusion.selected.some((choice) => choice.source === source && choice.index === index)) return;
    setPendingFusion({ ...pendingFusion, selected: [...pendingFusion.selected, { source, index, id }] });
  }

  function resolveFusion(position: Position) {
    if (!duel || !pendingFusion?.fusionId || duel.playerField.length >= FIELD_LIMIT) return;
    const recipe = fusionRecipe(pendingFusion.fusionId);
    if (!recipe || !isValidFusionSelection(recipe, pendingFusion.selected.map((choice) => choice.id))) return;
    const handIndexes = new Set([pendingFusion.spellIndex, ...pendingFusion.selected.filter((choice) => choice.source === "hand").map((choice) => choice.index)]);
    const fieldIndexes = new Set(pendingFusion.selected.filter((choice) => choice.source === "field").map((choice) => choice.index));
    const fieldMaterials = duel.playerField.filter((_, index) => fieldIndexes.has(index));
    const fusionName = cardById.get(pendingFusion.fusionId)?.name ?? "融合モンスター";
    const paidDuel = applyChainEnergyPayment(duel, "player");
    let next: DuelState = {
      ...paidDuel,
      playerHand: duel.playerHand.filter((_, index) => !handIndexes.has(index)),
      playerField: [
        ...duel.playerField.filter((_, index) => !fieldIndexes.has(index)),
        { id: pendingFusion.fusionId, position, faceDown: false, attacked: false, equipped: [], summonedTurn: duel.turnNumber, positionChanged: false },
      ],
      playerFusionDeck: removeCardCopies(duel.playerFusionDeck, pendingFusion.fusionId, 1),
      playerSpellTrap: discardEquips(duel.playerSpellTrap, fieldMaterials),
      playerGraveyard: [
        ...duel.playerGraveyard,
        duel.playerHand[pendingFusion.spellIndex],
        ...pendingFusion.selected.filter((choice) => choice.source === "hand").map((choice) => choice.id),
        ...graveCards(fieldMaterials),
      ],
      log: appendLog(paidDuel.log, `「融合」を発動。${fusionName}を融合召喚。`),
    };
    next = applyDeckSearchTriggers(next, fieldMaterials, []);
    setDuel(next);
    setPendingFusion(null);
  }

  function toggleDragonFluteCard(handIndex: number) {
    if (!duel || !pendingDragonFlute || handIndex === pendingDragonFlute.spellIndex) return;
    if (cardById.get(duel.playerHand[handIndex])?.kind !== "ドラゴン族") return;
    const limit = Math.min(2, FIELD_LIMIT - duel.playerField.length);
    setPendingDragonFlute((current) => {
      if (!current) return null;
      if (current.selected.includes(handIndex)) {
        return { ...current, selected: current.selected.filter((index) => index !== handIndex) };
      }
      if (current.selected.length >= limit) return current;
      return { ...current, selected: [...current.selected, handIndex].sort((a, b) => a - b) };
    });
  }

  function resolveDragonFlute(position: Position) {
    if (!duel || !pendingDragonFlute || pendingDragonFlute.selected.length === 0) return;
    if (duel.playerHand[pendingDragonFlute.spellIndex] !== "ex-085") return;
    if (!duel.playerField.some((zone) => zone.id === "ex-084" && !zone.faceDown)) return;
    const selectedIndexes = new Set(pendingDragonFlute.selected);
    const playerDragons = duel.playerHand.filter((id, index) => selectedIndexes.has(index) && cardById.get(id)?.kind === "ドラゴン族").slice(0, 2);
    if (playerDragons.length === 0 || playerDragons.length > FIELD_LIMIT - duel.playerField.length) return;
    const cpuDragonIndexes = duel.cpuHand
      .flatMap((id, index) => cardById.get(id)?.kind === "ドラゴン族" ? [{ id, index, atk: cardById.get(id)?.atk ?? 0 }] : [])
      .sort((a, b) => b.atk - a.atk)
      .slice(0, Math.min(2, FIELD_LIMIT - duel.cpuField.length));
    const playerActionCount = 1 + playerDragons.length;
    const cpuActionCount = cpuDragonIndexes.length;
    if (!canPayDuelChainEnergy(duel, "player", playerActionCount)) return;
    const affordableCpuDragons = canPayDuelChainEnergy(duel, "cpu", cpuActionCount) ? cpuDragonIndexes : [];
    const affordableCpuIndexSet = new Set(affordableCpuDragons.map(({ index }) => index));
    const dragonJarActive = isDragonCaptureJarActive(duel);
    const playerZones: ZoneCard[] = playerDragons.map((id) => ({
      id,
      position: dragonJarActive ? "defense" : position,
      faceDown: false,
      attacked: false,
      equipped: [],
      summonedTurn: duel.turnNumber,
      faceUpTurn: duel.turnNumber,
      positionChanged: false,
    }));
    const cpuZones: ZoneCard[] = affordableCpuDragons.map(({ id }) => ({
      id,
      position: dragonJarActive ? "defense" : "attack",
      faceDown: false,
      attacked: false,
      equipped: [],
      summonedTurn: duel.turnNumber,
      faceUpTurn: duel.turnNumber,
      positionChanged: false,
    }));
    let next = applyChainEnergyPayment(duel, "player", playerActionCount);
    if (cpuZones.length > 0) next = applyChainEnergyPayment(next, "cpu", cpuZones.length);
    setDuel({
      ...next,
      playerHand: duel.playerHand.filter((_, index) => index !== pendingDragonFlute.spellIndex && !selectedIndexes.has(index)),
      cpuHand: duel.cpuHand.filter((_, index) => !affordableCpuIndexSet.has(index)),
      playerField: [...duel.playerField, ...playerZones],
      cpuField: [...duel.cpuField, ...cpuZones],
      playerGraveyard: [...duel.playerGraveyard, "ex-085"],
      log: appendLog(next.log, `ドラゴンを呼ぶ笛を発動。あなたは${playerZones.length}体、CPUは${cpuZones.length}体のドラゴン族を手札から特殊召喚。`),
    });
    setPendingDragonFlute(null);
  }

  function summonHarpie(source: "hand" | "deck", cardId: string, position: Position) {
    if (!duel || pendingEgotist === null || !isElegantEgotistTarget(cardId)) return;
    if (duel.playerHand[pendingEgotist] !== "vol4-elegant-egotist" || duel.playerField.length >= FIELD_LIMIT) return;
    if (!duel.playerField.some((zone) => !zone.faceDown && zone.id === "vol4-harpie-lady")) return;

    const handWithoutSpell = duel.playerHand.filter((_, index) => index !== pendingEgotist);
    const sourceCards = source === "hand" ? handWithoutSpell : duel.playerDeck;
    const targetIndex = sourceCards.indexOf(cardId);
    if (targetIndex < 0) return;
    const actionCount = source === "hand" ? 2 : 1;
    if (!canPayDuelChainEnergy(duel, "player", actionCount)) return;
    const nextHand = source === "hand"
      ? handWithoutSpell.filter((_, index) => index !== targetIndex)
      : handWithoutSpell;
    const nextDeck = source === "deck"
      ? duel.playerDeck.filter((_, index) => index !== targetIndex)
      : duel.playerDeck;
    const target = cardById.get(cardId);
    const paidDuel = applyChainEnergyPayment(duel, "player", actionCount);
    setDuel({
      ...paidDuel,
      playerHand: nextHand,
      playerDeck: nextDeck,
      playerField: [
        ...duel.playerField,
        {
          id: cardId,
          position,
          faceDown: false,
          attacked: false,
          equipped: [],
          summonedTurn: duel.turnNumber,
          positionChanged: false,
        },
      ],
      playerGraveyard: [...duel.playerGraveyard, "vol4-elegant-egotist"],
      log: appendLog(paidDuel.log, `万華鏡－華麗なる分身－を発動。${target?.name ?? "ハーピィ"}を${source === "hand" ? "手札" : "デッキ"}から特殊召喚。`),
    });
    setPendingEgotist(null);
  }

  function reviveMonster(graveSide: Side, graveIndex: number, position: Position) {
    if (!duel || pendingReborn === null || duel.playerField.length >= FIELD_LIMIT) return;
    if (duel.playerHand[pendingReborn] !== "vol2-monster-reborn") return;
    const graveyard = graveSide === "player" ? duel.playerGraveyard : duel.cpuGraveyard;
    const taken = takeGraveyardCard(graveyard, graveIndex);
    const monster = taken ? cardById.get(taken.cardId) : null;
    if (!taken || monster?.cardType !== "monster") return;
    const revivePosition: Position = isDragonCaptureJarLocked(monster.kind, false, isDragonCaptureJarActive(duel)) ? "defense" : position;
    setDuel({
      ...removeHandCard(duel, pendingReborn),
      playerField: [
        ...duel.playerField,
        {
          id: taken.cardId,
          position: revivePosition,
          faceDown: false,
          attacked: false,
          equipped: [],
          summonedTurn: duel.turnNumber,
          positionChanged: false,
          revivedByMonsterReborn: true,
        },
      ],
      playerGraveyard: [
        ...(graveSide === "player" ? taken.remaining : duel.playerGraveyard),
        "vol2-monster-reborn",
      ],
      cpuGraveyard: graveSide === "cpu" ? taken.remaining : duel.cpuGraveyard,
      log: appendLog(duel.log, `死者蘇生を発動。${monster.name}を${revivePosition === "attack" ? "攻撃" : "守備"}表示で特殊召喚。`),
    });
    setPendingReborn(null);
  }

  function resolveDeSpell(targetSide: Side, targetIndex: number, fieldSpell = false) {
    if (!duel || pendingDeSpell === null) return;
    const spellId = duel.playerHand[pendingDeSpell];
    if (spellId !== "vol2-de-spell" && spellId !== "stb-remove-trap" && spellId !== "mr-mystical-space-typhoon") return;
    const targetZones = targetSide === "player" ? duel.playerSpellTrap : duel.cpuSpellTrap;
    const targetId = fieldSpell
      ? targetSide === "player" ? duel.playerFieldSpell : duel.cpuFieldSpell
      : targetZones[targetIndex];
    const target = cardById.get(targetId);
    if (!target) return;
    if (spellId === "stb-remove-trap" && (fieldSpell || !isFaceUpTrapTarget(targetId))) return;
    let next: DuelState = {
      ...removeHandCard(duel, pendingDeSpell),
      playerGraveyard: [...duel.playerGraveyard, spellId],
    };
    if (spellId === "stb-remove-trap") {
      next = targetSide === "player"
        ? {
          ...next,
          playerSpellTrap: next.playerSpellTrap.filter((_, index) => index !== targetIndex),
          playerActiveTraps: next.playerActiveTraps.filter((id) => id !== targetId),
          playerGraveyard: [...next.playerGraveyard, targetId],
        }
        : {
          ...next,
          cpuSpellTrap: next.cpuSpellTrap.filter((_, index) => index !== targetIndex),
          cpuActiveTraps: next.cpuActiveTraps.filter((id) => id !== targetId),
          cpuGraveyard: [...next.cpuGraveyard, targetId],
        };
      next.log = appendLog(next.log, `罠はずしを発動。${target.name}を破壊。`);
      setDuel(next);
      setPendingDeSpell(null);
      return;
    }
    if (spellId === "mr-mystical-space-typhoon" || deSpellDestroys(target.cardType, target.id)) {
      if (fieldSpell) {
        next = targetSide === "player"
          ? { ...next, playerFieldSpell: null, playerGraveyard: [...next.playerGraveyard, targetId] }
          : { ...next, cpuFieldSpell: null, cpuGraveyard: [...next.cpuGraveyard, targetId] };
      } else if (targetSide === "player") {
        const swordsIndex = targetId === "vol2-swords-revealing-light"
          ? duel.playerSpellTrap.slice(0, targetIndex + 1).filter((id) => id === targetId).length - 1
          : -1;
        next = {
          ...next,
          playerField: removeEquippedCard(next.playerField, targetId),
          playerSpellTrap: next.playerSpellTrap.filter((_, index) => index !== targetIndex),
          playerSwordsTurns: swordsIndex >= 0
            ? next.playerSwordsTurns.filter((_, index) => index !== swordsIndex)
            : next.playerSwordsTurns,
          playerGraveyard: [...next.playerGraveyard, targetId],
        };
      } else {
        const swordsIndex = targetId === "vol2-swords-revealing-light"
          ? duel.cpuSpellTrap.slice(0, targetIndex + 1).filter((id) => id === targetId).length - 1
          : -1;
        next = {
          ...next,
          cpuField: removeEquippedCard(next.cpuField, targetId),
          cpuSpellTrap: next.cpuSpellTrap.filter((_, index) => index !== targetIndex),
          cpuSwordsTurns: swordsIndex >= 0
            ? next.cpuSwordsTurns.filter((_, index) => index !== swordsIndex)
            : next.cpuSwordsTurns,
          cpuGraveyard: [...next.cpuGraveyard, targetId],
        };
      }
      next.log = appendLog(next.log, `${spellId === "mr-mystical-space-typhoon" ? "サイクロン" : "魔法除去"}を発動。${target.name}を破壊。`);
    } else {
      next.log = appendLog(next.log, `魔法除去で伏せカードを確認。${target.name}は罠カードのため元に戻します。`);
    }
    setDuel(cleanupSnatchStealControl(next));
    setPendingDeSpell(null);
  }

  function resolveTributeToDoomed(targetSide: Side, targetIndex: number) {
    if (!duel || !pendingTributeToDoomed || pendingTributeToDoomed.discardIndex === null) return;
    const { spellIndex, discardIndex } = pendingTributeToDoomed;
    if (duel.playerHand[spellIndex] !== "vol5-tribute-doomed" || discardIndex === spellIndex) return;
    const discardedId = duel.playerHand[discardIndex];
    const targetField = targetSide === "player" ? duel.playerField : duel.cpuField;
    const target = targetField[targetIndex];
    if (!discardedId || !target || isEffectTargetProtected(duel, targetSide, target)) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const paidDuel = applyChainEnergyPayment(duel, "player");
    let next: DuelState = {
      ...paidDuel,
      playerHand: duel.playerHand.filter((_, index) => index !== spellIndex && index !== discardIndex),
      playerGraveyard: [...duel.playerGraveyard, "vol5-tribute-doomed", discardedId],
    };
    if (targetSide === "player") {
      next = {
        ...next,
        playerField: next.playerField.filter((_, index) => index !== targetIndex),
        playerSpellTrap: discardEquips(next.playerSpellTrap, [target]),
        playerGraveyard: [...next.playerGraveyard, ...graveCards([target])],
      };
    } else {
      next = {
        ...next,
        cpuField: next.cpuField.filter((_, index) => index !== targetIndex),
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, [target]),
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards([target])],
      };
    }
    next = applyDeckSearchTriggers(next, targetSide === "player" ? [target] : [], targetSide === "cpu" ? [target] : []);
    next.log = appendLog(next.log, `死者への手向けを発動。手札を1枚捨て、${targetName}を破壊。`);
    setDuel(next);
    setPendingTributeToDoomed(null);
  }

  function toggleSoulReleaseCard(side: Side, index: number) {
    if (!pendingSoulRelease) return;
    const key = `${side}:${index}`;
    setPendingSoulRelease({
      ...pendingSoulRelease,
      selected: toggleLimitedSelection(pendingSoulRelease.selected, key, 5),
    });
  }

  function confirmSoulRelease() {
    if (!duel || !pendingSoulRelease || pendingSoulRelease.selected.length === 0) return;
    if (duel.playerHand[pendingSoulRelease.spellIndex] !== "vol5-soul-release") return;
    const playerIndexes = new Set(pendingSoulRelease.selected
      .filter((key) => key.startsWith("player:"))
      .map((key) => Number(key.split(":")[1])));
    const cpuIndexes = new Set(pendingSoulRelease.selected
      .filter((key) => key.startsWith("cpu:"))
      .map((key) => Number(key.split(":")[1])));
    const next = removeHandCard(duel, pendingSoulRelease.spellIndex);
    setDuel({
      ...next,
      playerGraveyard: [...next.playerGraveyard.filter((_, index) => !playerIndexes.has(index)), "vol5-soul-release"],
      cpuGraveyard: next.cpuGraveyard.filter((_, index) => !cpuIndexes.has(index)),
      log: appendLog(next.log, `魂の解放を発動。墓地から${pendingSoulRelease.selected.length}枚を除外。`),
    });
    setPendingSoulRelease(null);
  }

  function toggleCheerfulCoffinCard(index: number) {
    if (!duel || !pendingCheerfulCoffin || index === pendingCheerfulCoffin.spellIndex) return;
    if (cardById.get(duel.playerHand[index])?.cardType !== "monster") return;
    const key = String(index);
    setPendingCheerfulCoffin({
      ...pendingCheerfulCoffin,
      selected: toggleLimitedSelection(pendingCheerfulCoffin.selected, key, 3),
    });
  }

  function confirmCheerfulCoffin() {
    if (!duel || !pendingCheerfulCoffin || pendingCheerfulCoffin.selected.length === 0) return;
    if (duel.playerHand[pendingCheerfulCoffin.spellIndex] !== "vol5-cheerful-coffin") return;
    const selectedIndexes = new Set(pendingCheerfulCoffin.selected.map(Number));
    const discarded = duel.playerHand.filter((id, index) =>
      selectedIndexes.has(index) && cardById.get(id)?.cardType === "monster",
    );
    if (discarded.length === 0) return;
    const paidDuel = applyChainEnergyPayment(duel, "player");
    setDuel({
      ...paidDuel,
      playerHand: duel.playerHand.filter((_, index) => index !== pendingCheerfulCoffin.spellIndex && !selectedIndexes.has(index)),
      playerGraveyard: [...duel.playerGraveyard, "vol5-cheerful-coffin", ...discarded],
      log: appendLog(paidDuel.log, `陽気な葬儀屋を発動。手札からモンスター${discarded.length}枚を墓地へ送った。`),
    });
    setPendingCheerfulCoffin(null);
  }

  function resolveChangeOfHeart(targetIndex: number) {
    if (!duel || pendingChangeOfHeart === null) return;
    if (duel.playerHand[pendingChangeOfHeart] !== "vol5-change-heart") return;
    if (!canActivateChangeOfHeart(duel.playerField.length, duel.cpuField.length, FIELD_LIMIT)) return;
    const target = duel.cpuField[targetIndex];
    if (!target || isEffectTargetProtected(duel, "cpu", target)) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const changedState = {
      ...removeHandCard(duel, pendingChangeOfHeart),
      playerField: [
        ...duel.playerField,
        { ...target, attacked: false, positionChanged: false, controlReturn: "cpu" },
      ],
      cpuField: duel.cpuField.filter((_, index) => index !== targetIndex),
      playerGraveyard: [...duel.playerGraveyard, "vol5-change-heart"],
      log: appendLog(duel.log, `心変わりを発動。${targetName}のコントロールをターン終了時まで得た。`),
    };
    const changed = target.faceDown
      ? changedState
      : applyControlChangeLifeTrigger(changedState, target.id, "cpu", "player");
    setDuel(changed);
    setPendingChangeOfHeart(null);
  }

  function resolveStopAttack(targetIndex: number) {
    if (!duel || pendingStopAttack === null || duel.playerHand[pendingStopAttack] !== "vol7-stop-attack") return;
    const target = duel.cpuField[targetIndex];
    if (!target || !canStopAttackTarget(target.position, target.faceDown) || isEffectTargetProtected(duel, "cpu", target)) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const next = removeHandCard(duel, pendingStopAttack);
    setDuel({
      ...next,
      cpuField: next.cpuField.map((zone, index) => index === targetIndex
        ? { ...zone, position: "defense", positionChanged: true }
        : zone),
      playerGraveyard: [...next.playerGraveyard, "vol7-stop-attack"],
      log: appendLog(next.log, `『攻撃』封じを発動。${targetName}を表側守備表示に変更した。`),
    });
    setPendingStopAttack(null);
  }

  function activateCannonSoldier(targetIndex: number) {
    if (!duel || pendingCannonSoldier === null || duel.turn !== "player" || (duel.phase !== "main1" && duel.phase !== "main2")) return;
    const source = duel.playerField[pendingCannonSoldier];
    const target = duel.playerField[targetIndex];
    if (!source || source.id !== "vol6-cannon-soldier" || source.faceDown || !target) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const isCpuOwned = target.controlReturn === "cpu";
    const cpuLp = Math.max(0, duel.cpuLp - 500);
    let resolved: DuelState = {
      ...duel,
      playerField: duel.playerField.filter((_, index) => index !== targetIndex),
      playerSpellTrap: discardEquips(duel.playerSpellTrap, [target]),
      playerGraveyard: isCpuOwned
        ? [...duel.playerGraveyard, ...target.equipped]
        : [...duel.playerGraveyard, ...graveCards([target])],
      cpuGraveyard: isCpuOwned ? [...duel.cpuGraveyard, target.id] : duel.cpuGraveyard,
      cpuLp,
      result: cpuLp === 0 ? "win" : duel.result,
      log: appendLog(duel.log, `キャノン・ソルジャーの効果で${targetName}を生け贄にし、CPUに500ダメージ。`),
    };
    if (cpuLp > 0) {
      resolved = applyDeckSearchTriggers(resolved, isCpuOwned ? [] : [target], isCpuOwned ? [target] : []);
    }
    setPendingCannonSoldier(null);
    setDuel(resolved);
  }

  function openCannonSoldierPicker(monsterIndex: number) {
    setFeedbackQueue([]);
    setActiveFeedback(null);
    setPendingCannonSoldier(monsterIndex);
  }

  function openCatapultTurtlePicker(monsterIndex: number) {
    setFeedbackQueue([]);
    setActiveFeedback(null);
    setPendingCatapultTurtle(monsterIndex);
  }

  function activateCatapultTurtle(targetIndex: number) {
    if (!duel || pendingCatapultTurtle === null || duel.turn !== "player" || (duel.phase !== "main1" && duel.phase !== "main2")) return;
    const source = duel.playerField[pendingCatapultTurtle];
    const target = duel.playerField[targetIndex];
    if (!source || source.id !== "vol7-catapult-turtle" || source.faceDown || source.catapultUsedTurn === duel.turnNumber || !target) return;
    const targetCard = cardById.get(target.id);
    const damage = catapultTurtleDamage(targetCard?.atk);
    const targetName = targetCard?.name ?? "モンスター";
    const isCpuOwned = target.controlReturn === "cpu";
    const cpuLp = Math.max(0, duel.cpuLp - damage);
    let resolved: DuelState = {
      ...duel,
      playerField: duel.playerField
        .map((zone, index) => index === pendingCatapultTurtle ? { ...zone, catapultUsedTurn: duel.turnNumber } : zone)
        .filter((_, index) => index !== targetIndex),
      playerSpellTrap: discardEquips(duel.playerSpellTrap, [target]),
      playerGraveyard: isCpuOwned ? [...duel.playerGraveyard, ...target.equipped] : [...duel.playerGraveyard, ...graveCards([target])],
      cpuGraveyard: isCpuOwned ? [...duel.cpuGraveyard, target.id] : duel.cpuGraveyard,
      cpuLp,
      result: cpuLp === 0 ? "win" : duel.result,
      log: appendLog(duel.log, `カタパルト・タートルの効果で${targetName}を生け贄にし、元々のATKの半分となる${damage}ダメージ。`),
    };
    if (cpuLp > 0) resolved = applyDeckSearchTriggers(resolved, isCpuOwned ? [] : [target], isCpuOwned ? [target] : []);
    setPendingCatapultTurtle(null);
    setDuel(resolved);
  }

  function activateThunderDragon(handIndex: number) {
    if (!duel || !isPlayerMainPhase || duel.playerHand[handIndex] !== "vol7-thunder-dragon") return;
    const indexes = thunderDragonSearchIndexes(duel.playerDeck);
    const indexSet = new Set(indexes);
    const searched = indexes.map((index) => duel.playerDeck[index]);
    setDuel({
      ...duel,
      playerHand: [...duel.playerHand.filter((_, index) => index !== handIndex), ...searched],
      playerDeck: duel.playerDeck.filter((_, index) => !indexSet.has(index)),
      playerGraveyard: [...duel.playerGraveyard, "vol7-thunder-dragon"],
      log: appendLog(duel.log, `サンダー・ドラゴンを手札から捨て、デッキから同名カードを${searched.length}枚手札に加えた。`),
    });
  }

  function openBarrelDragonPicker(monsterIndex: number) {
    setFeedbackQueue([]);
    setActiveFeedback(null);
    setPendingBarrelDragon(monsterIndex);
  }

  function activateBarrelDragon(targetIndex: number) {
    if (!duel || pendingBarrelDragon === null || duel.turn !== "player" || (duel.phase !== "main1" && duel.phase !== "main2")) return;
    const source = duel.playerField[pendingBarrelDragon];
    const target = duel.cpuField[targetIndex];
    if (!source || source.id !== "vol7-barrel-dragon" || source.faceDown || source.barrelUsedTurn === duel.turnNumber || !target || isEffectTargetProtected(duel, "cpu", target)) return;
    const tosses = Array.from({ length: 3 }, () => Math.random() < 0.5);
    const result = barrelDragonCoinResult(tosses);
    const targetName = target.faceDown ? "裏側モンスター" : cardById.get(target.id)?.name ?? "モンスター";
    let resolved: DuelState = {
      ...duel,
      playerField: duel.playerField.map((zone, index) => index === pendingBarrelDragon ? { ...zone, barrelUsedTurn: duel.turnNumber } : zone),
      log: appendLog(duel.log, `リボルバー・ドラゴンの効果でコイントス。表${result.heads}・裏${3 - result.heads}。${result.destroys ? `${targetName}を破壊した。` : "破壊できなかった。"}`),
    };
    if (result.destroys) {
      resolved = {
        ...resolved,
        cpuField: resolved.cpuField.filter((_, index) => index !== targetIndex),
        cpuSpellTrap: discardEquips(resolved.cpuSpellTrap, [target]),
        cpuGraveyard: [...resolved.cpuGraveyard, ...graveCards([target])],
      };
      resolved = applyDeckSearchTriggers(resolved, [], [target]);
    }
    setPendingBarrelDragon(null);
    setDuel(resolved);
  }

  function activateMonsterEye() {
    if (!duel || !isPlayerMainPhase || !canPayMonsterEffect(duel.playerLp, 1000)) return;
    if (!duel.playerField.some((zone) => zone.id === "bo6-monster-eye" && !zone.faceDown)) return;
    const fusionIndex = duel.playerGraveyard.indexOf("vol1-polymerization");
    if (fusionIndex < 0) return;
    setDuel({
      ...duel,
      playerLp: duel.playerLp - 1000,
      playerGraveyard: duel.playerGraveyard.filter((_, index) => index !== fusionIndex),
      playerHand: [...duel.playerHand, "vol1-polymerization"],
      log: appendLog(duel.log, "モンスター・アイの効果を発動。1000LPを払い、墓地の融合を手札に戻した。"),
    });
  }

  function activateAileSwordsman(targetIndex: number) {
    if (!duel || pendingAileSwordsman === null || duel.turn !== "player" || (duel.phase !== "main1" && duel.phase !== "main2")) return;
    const source = duel.playerField[pendingAileSwordsman];
    const target = duel.playerField[targetIndex];
    if (!source || source.id !== "bo7-aile-swordsman" || source.faceDown || !target) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const isCpuOwned = target.controlReturn === "cpu";
    let resolved: DuelState = {
      ...duel,
      playerField: duel.playerField
        .map((zone, index) => index === pendingAileSwordsman
          ? {
              ...zone,
              aileBoostTurn: duel.turnNumber,
              aileTributeCount: zone.aileBoostTurn === duel.turnNumber ? (zone.aileTributeCount ?? 0) + 1 : 1,
            }
          : zone)
        .filter((_, index) => index !== targetIndex),
      playerSpellTrap: discardEquips(duel.playerSpellTrap, [target]),
      playerGraveyard: isCpuOwned ? [...duel.playerGraveyard, ...target.equipped] : [...duel.playerGraveyard, ...graveCards([target])],
      cpuGraveyard: isCpuOwned ? [...duel.cpuGraveyard, target.id] : duel.cpuGraveyard,
      log: appendLog(duel.log, `アイルの小剣士の効果で${targetName}を生け贄にし、ターン終了までATKを700アップ。`),
    };
    resolved = applyDeckSearchTriggers(resolved, isCpuOwned ? [] : [target], isCpuOwned ? [target] : []);
    setPendingAileSwordsman(null);
    setDuel(resolved);
  }

  function toggleYadoKaruCard(handIndex: number) {
    setPendingYadoKaru((current) => current
      ? {
          ...current,
          selected: current.selected.includes(handIndex)
            ? current.selected.filter((index) => index !== handIndex)
            : [...current.selected, handIndex].sort((a, b) => a - b),
        }
      : null);
  }

  function resolveYadoKaru() {
    if (!duel || !pendingYadoKaru) return;
    const source = duel.playerField[pendingYadoKaru.sourceIndex];
    if (!source || source.id !== "bo7-yado-karu" || source.faceDown || source.position !== "defense") {
      setPendingYadoKaru(null);
      return;
    }
    const moved = bottomDeckSelection(duel.playerHand, pendingYadoKaru.selected);
    setDuel({
      ...duel,
      playerHand: moved.remaining,
      playerDeck: [...duel.playerDeck, ...moved.bottom],
      log: appendLog(duel.log, moved.bottom.length > 0
        ? `ヤドカリューの効果で手札${moved.bottom.length}枚をデッキの一番下へ戻した。`
        : "ヤドカリューの効果を使わずに終了。"),
    });
    setPendingYadoKaru(null);
  }

  function activateGaleDogra(fusionIndex: number) {
    if (!duel || pendingGaleDogra === null || duel.turn !== "player" || (duel.phase !== "main1" && duel.phase !== "main2") || !canPayMonsterEffect(duel.playerLp, 3000)) return;
    const source = duel.playerField[pendingGaleDogra];
    const fusionId = duel.playerFusionDeck[fusionIndex];
    if (!source || source.id !== "bo6-gale-dogra" || source.faceDown || !fusionId) return;
    setDuel({
      ...duel,
      playerLp: duel.playerLp - 3000,
      playerFusionDeck: duel.playerFusionDeck.filter((_, index) => index !== fusionIndex),
      playerGraveyard: [...duel.playerGraveyard, fusionId],
      log: appendLog(duel.log, `ゲール・ドグラの効果を発動。3000LPを払い、${cardById.get(fusionId)?.name}を融合デッキから墓地へ送った。`),
    });
    setPendingGaleDogra(null);
  }

  function chooseCyberSteinFusion(fusionId: string) {
    if (!pendingCyberStein) return;
    setPendingCyberStein({ ...pendingCyberStein, fusionId });
  }

  function activateCyberStein(position: Position) {
    if (!duel || !pendingCyberStein?.fusionId || duel.turn !== "player" || (duel.phase !== "main1" && duel.phase !== "main2") || !canPayMonsterEffect(duel.playerLp, 5000) || duel.playerField.length >= FIELD_LIMIT) return;
    const source = duel.playerField[pendingCyberStein.sourceIndex];
    const fusionIndex = duel.playerFusionDeck.indexOf(pendingCyberStein.fusionId);
    const fusion = cardById.get(pendingCyberStein.fusionId);
    if (!source || source.id !== "bo6-cyber-stein" || source.faceDown || fusionIndex < 0 || !fusion?.fusion) return;
    const lockedByJar = isDragonCaptureJarLocked(fusion.kind, false, isDragonCaptureJarActive(duel));
    const summonPosition: Position = position === "attack" && lockedByJar ? "defense" : position;
    setDuel({
      ...duel,
      playerLp: duel.playerLp - 5000,
      playerFusionDeck: duel.playerFusionDeck.filter((_, index) => index !== fusionIndex),
      playerField: [...duel.playerField, {
        id: fusion.id,
        position: summonPosition,
        faceDown: false,
        attacked: false,
        equipped: [],
        summonedTurn: duel.turnNumber,
        faceUpTurn: duel.turnNumber,
        positionChanged: false,
      }],
      log: appendLog(duel.log, `デビル・フランケンの効果を発動。5000LPを払い、${fusion.name}を特殊召喚。`),
    });
    setPendingCyberStein(null);
  }

  function equipSpell(fieldIndex: number, owner: Side = "player") {
    if (!duel || !isPlayerMainPhase || selectedEquip === null) return;
    const spell = cardById.get(duel.playerHand[selectedEquip]);
    const fieldKey = owner === "player" ? "playerField" : "cpuField";
    const spellTrapKey = owner === "player" ? "playerSpellTrap" : "cpuSpellTrap";
    const zone = duel[fieldKey][fieldIndex];
    const monster = zone ? cardById.get(zone.id) : null;
    if (!spell || !zone || zone.faceDown || !monster || !canEquip(spell.id, monster) || (spell.id !== "mr-snatch-steal" && duel[spellTrapKey].length >= FIELD_LIMIT)) return;
    if (spell.id === "mr-snatch-steal") {
      if (owner !== "cpu" || duel.playerField.length >= FIELD_LIMIT || duel.playerSpellTrap.length >= FIELD_LIMIT || isEffectTargetProtected(duel, "cpu", zone)) return;
      const moved: ZoneCard = {
        ...zone,
        attacked: false,
        positionChanged: false,
        equipped: [...zone.equipped, spell.id],
        controlReturn: zone.controlReturn ?? "cpu",
        snatchStealControl: true,
        snatchReturnSide: "cpu",
      };
      let next: DuelState = {
        ...removeHandCard(duel, selectedEquip),
        playerField: [...duel.playerField, moved],
        cpuField: duel.cpuField.filter((_, index) => index !== fieldIndex),
        playerSpellTrap: [...duel.playerSpellTrap, spell.id],
        log: appendLog(duel.log, `強奪を${monster.name}に装備。コントロールを得た。`),
      };
      next = applyControlChangeLifeTrigger(next, zone.id, zone.controlReturn ?? "cpu", "player");
      setDuel(next);
      setSelectedEquip(null);
      return;
    }
    setDuel({
      ...removeHandCard(duel, selectedEquip),
      [fieldKey]: duel[fieldKey].map((item, index) =>
        index === fieldIndex
          ? {
              ...item,
              equipped: [...item.equipped, spell.id],
              ...(spell.id === "vol4-cocoon-evolution" ? { cocoonEquippedTurn: duel.turnNumber } : {}),
            }
          : item,
      ),
      [spellTrapKey]: [...duel[spellTrapKey], spell.id],
      log: appendLog(
        duel.log,
        spell.id === "vol4-cocoon-evolution"
          ? `進化の繭を${monster.name}に装備。ATK 0・DEF 2000を適用。`
          : spell.id === "vol7-germ-infection"
            ? `細菌感染を${monster.name}に装備。スタンバイフェイズ毎にATKが300ダウン。`
            : spell.id === "vol7-paralyzing-potion"
              ? `しびれ薬を${monster.name}に装備。攻撃を封じた。`
            : spell.id === "vol7-sword-deep-seated"
              ? `執念の剣を${monster.name}に装備。ATK・DEFが500アップ。`
              : spell.id === "mr-axe-despair"
                ? `デーモンの斧を${monster.name}に装備。ATKが1000アップ。`
                : spell.id === "mr-black-pendant"
                  ? `黒いペンダントを${monster.name}に装備。ATKが500アップ。`
                  : spell.id === "mr-horn-light"
                    ? `光の角を${monster.name}に装備。DEFが800アップ。`
                    : spell.id === "mr-malevolent-nuzzler"
                      ? `悪魔のくちづけを${monster.name}に装備。ATKが700アップ。`
                : spell.id.startsWith("bo2-")
                  ? `${spell.name}を${monster.name}に装備。ATKが400アップし、DEFが200ダウン。`
                  : `${spell.name}を${monster.name}に装備。ATK・DEFが300アップ。`,
      ),
    });
    setSelectedEquip(null);
  }

  function summonMoth(handIndex: number, position: Position) {
    if (!duel || !isPlayerMainPhase) return;
    if (!canPayDuelChainEnergy(duel, "player")) return;
    const mothId = duel.playerHand[handIndex];
    if (mothId !== "vol5-larvae-moth" && mothId !== "vol6-great-moth") return;
    const targetIndex = mothTargetIndex(duel, mothId);
    if (targetIndex < 0) return;
    const petitMoth = duel.playerField[targetIndex];
    const mothName = cardById.get(mothId)?.name ?? "進化モンスター";
    setDuel({
      ...duel,
      playerHand: duel.playerHand.filter((_, index) => index !== handIndex),
      playerLp: duel.playerLp - duelChainEnergyCost(duel),
      playerField: [
        ...duel.playerField.filter((_, index) => index !== targetIndex),
        {
          id: mothId,
          position,
          faceDown: false,
          attacked: false,
          equipped: [],
          summonedTurn: duel.turnNumber,
          positionChanged: false,
        },
      ],
      playerSpellTrap: discardEquips(duel.playerSpellTrap, [petitMoth]),
      playerGraveyard: [...duel.playerGraveyard, ...graveCards([petitMoth])],
      log: appendLog(duel.log, `プチモスを生け贄にし、${mothName}を${position === "attack" ? "攻撃" : "守備"}表示で特殊召喚。`),
    });
    setSelectedAttacker(null);
    setSelectedEquip(null);
  }

  function setTrap(handIndex: number) {
    if (!duel || !isPlayerMainPhase || duel.result || pendingReborn !== null || pendingDeSpell !== null || duel.playerSpellTrap.length >= FIELD_LIMIT) return;
    if (!canPayDuelChainEnergy(duel, "player")) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "trap" || !isTrapImplemented(card.id)) return;
    if (card.id === "vol5-call-darkness") {
      const revivedPlayer = duel.playerField.filter((zone) => zone.revivedByMonsterReborn);
      const revivedCpu = duel.cpuField.filter((zone) => zone.revivedByMonsterReborn);
      setDuel(applyDeckSearchTriggers({
        ...removeHandCard(duel, handIndex),
        playerField: duel.playerField.filter((zone) => !zone.revivedByMonsterReborn),
        cpuField: duel.cpuField.filter((zone) => !zone.revivedByMonsterReborn),
        playerSpellTrap: [...discardEquips(duel.playerSpellTrap, revivedPlayer), card.id],
        cpuSpellTrap: discardEquips(duel.cpuSpellTrap, revivedCpu),
        playerGraveyard: [...duel.playerGraveyard, ...graveCards(revivedPlayer)],
        cpuGraveyard: [...duel.cpuGraveyard, ...graveCards(revivedCpu)],
        log: appendLog(duel.log, `闇からの呼び声を発動。死者蘇生を封じ、蘇生されていたモンスター${revivedPlayer.length + revivedCpu.length}体を墓地へ送った。`),
      }, revivedPlayer, revivedCpu));
      return;
    }
    if (card.id === "stb-dragon-capture-jar") {
      const next = removeHandCard(duel, handIndex);
      setDuel({
        ...next,
        playerField: forceFaceUpDragonsToPosition(next.playerField, "defense"),
        cpuField: forceFaceUpDragonsToPosition(next.cpuField, "defense"),
        playerSpellTrap: [...next.playerSpellTrap, card.id],
        log: appendLog(next.log, "ドラゴン族・封印の壺を発動。表側のドラゴン族を守備表示にして表示形式を封じた。"),
      });
      return;
    }
    if (card.id === "bo5-royal-decree" || card.id === "bo6-magic-thorn") {
      const next = removeHandCard(duel, handIndex);
      setDuel({
        ...next,
        playerSpellTrap: [...next.playerSpellTrap, card.id],
        playerActiveTraps: [...new Set([...next.playerActiveTraps, card.id])],
        log: appendLog(next.log, `${card.name}を発動。永続罠として表側表示にした。`),
      });
      return;
    }
    setDuel({
      ...removeHandCard(duel, handIndex),
      playerSpellTrap: [...duel.playerSpellTrap, card.id],
      log: appendLog(duel.log, "罠カードを1枚セット。"),
    });
  }

  function hasUltimateOfferingSummonCandidate(state: DuelState) {
    return state.playerHand.some((id) => {
      const card = cardById.get(id);
      if (!card || card.cardType !== "monster" || !canNormalSummonMonster(card.id, card.fusion)) return false;
      const tributes = tributeCount(card);
      return state.playerField.length >= tributes && state.playerField.length - tributes < FIELD_LIMIT;
    });
  }

  function activateUltimateOffering() {
    if (!duel || !isPlayerMainPhase || !duel.playerSpellTrap.includes("bo3-ultimate-offering")) return;
    if (!canUseUltimateOffering(duel.playerLp, duel.normalSummoned, duel.playerField.length, hasUltimateOfferingSummonCandidate(duel), FIELD_LIMIT)) return;
    setDuel({
      ...duel,
      playerLp: duel.playerLp - 500,
      normalSummoned: false,
      playerActiveTraps: [...new Set([...duel.playerActiveTraps, "bo3-ultimate-offering"])],
      log: appendLog(duel.log, "血の代償を発動。500LPを払い、このターンにもう1度通常召喚できる。"),
    });
  }

  function chooseAttacker(index: number) {
    if (!duel || duel.turn !== "player" || duel.phase !== "battle" || duel.turnNumber === 1 || duel.result || duel.cpuSwordsTurns.length > 0) return;
    const zone = duel.playerField[index];
    if (!zone || zone.position !== "attack" || zone.attacked || isSpellbindingCircleLocked(duel, zone) || !canDeclareAttackOnTurn(zone.attackLockedTurn, duel.turnNumber) || duelAttackPayment(duel, "player", zone.id) === null) return;
    if (duel.cpuField.length === 0) {
      resolvePlayerAttack(index, null);
      setSelectedAttacker(null);
      return;
    }
    setSelectedAttacker(index);
  }

  function resolvePlayerAttack(attackerIndex: number, defenderIndex: number | null) {
    if (!duel) return;
    const mirrorForceIndex = areTrapEffectsNegated(duel) ? -1 : duel.cpuSpellTrap.indexOf("vol7-mirror-force");
    if (mirrorForceIndex < 0) {
      setDuel(resolveBattle(duel, "player", attackerIndex, defenderIndex));
      return;
    }
    const destroyedOnPlayerField = duel.playerField.filter((zone) => isMirrorForceDestructionTarget(zone.position));
    const returnedCpu = destroyedOnPlayerField.filter((zone) => zone.controlReturn === "cpu");
    const destroyedPlayer = destroyedOnPlayerField.filter((zone) => zone.controlReturn !== "cpu");
    const attacker = duel.playerField[attackerIndex];
    const payment = attacker ? duelAttackPayment(duel, "player", attacker.id) : { lifeCost: 0, millCount: 0 };
    if (!payment) return;
    const milled = duel.playerDeck.slice(0, payment.millCount);
    const costLog = payment.lifeCost > 0 || payment.millCount > 0
      ? appendLog(duel.log, `攻撃宣言のコストとして${payment.lifeCost > 0 ? `${payment.lifeCost}LP` : ""}${payment.lifeCost > 0 && payment.millCount > 0 ? "と" : ""}${payment.millCount > 0 ? `デッキ上${payment.millCount}枚` : ""}を支払った。`)
      : duel.log;
    let resolved: DuelState = {
      ...duel,
      playerLp: duel.playerLp - payment.lifeCost,
      playerDeck: duel.playerDeck.slice(payment.millCount),
      playerField: duel.playerField.filter((zone) => !isMirrorForceDestructionTarget(zone.position)),
      playerSpellTrap: discardEquips(duel.playerSpellTrap, destroyedPlayer),
      cpuSpellTrap: discardEquips(
        duel.cpuSpellTrap.filter((_, index) => index !== mirrorForceIndex),
        returnedCpu,
      ),
      playerGraveyard: [...duel.playerGraveyard, ...milled, ...graveCards(destroyedPlayer)],
      cpuGraveyard: [...duel.cpuGraveyard, "vol7-mirror-force", ...graveCards(returnedCpu)],
      log: appendLog(costLog, `CPUが聖なるバリア －ミラーフォース－を発動。攻撃表示モンスター${destroyedOnPlayerField.length}体を破壊。`),
    };
    resolved = applyDeckSearchTriggers(resolved, destroyedPlayer, returnedCpu);
    setDuel(resolved);
  }

  function attackTarget(targetIndex: number) {
    if (!duel || selectedAttacker === null) return;
    resolvePlayerAttack(selectedAttacker, targetIndex);
    setSelectedAttacker(null);
  }

  function attackDirectly() {
    if (!duel || selectedAttacker === null) return;
    const attacker = duel.playerField[selectedAttacker];
    if (!attacker || !canMonsterAttackDirectly(attacker.id)) return;
    resolvePlayerAttack(selectedAttacker, null);
    setSelectedAttacker(null);
  }

  function advancePhase() {
    if (!duel || duel.turn !== "player" || duel.result || duel.pendingSevenTools || duel.pendingFlipTarget || duel.pendingMultiTarget || duel.pendingDeckReorder || duel.pendingDeckSearch || duel.pendingBlastJuggler || duel.pendingFakeTrap || duel.pendingRobbinGoblin || duel.pendingJustDesserts || duel.pendingBattleStatTrap || pendingTribute || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null || pendingCannonSoldier !== null || pendingCatapultTurtle !== null || pendingBarrelDragon !== null || pendingGaleDogra !== null || pendingCyberStein !== null || pendingAileSwordsman !== null || pendingYadoKaru !== null || pendingGracefulCharity !== null || pendingCardInspection !== null || pendingHandDisruption !== null || pendingFinalDestiny !== null || pendingSharePain !== null || pendingTemporaryStat !== null || pendingSpellbindingCircle !== null || pendingPainfulChoice !== null || pendingDarknessApproaches !== null || pendingTailor !== null || pendingMatangoTransfer !== null || pendingStopAttack !== null) return;
    setSelectedAttacker(null);
    setSelectedEquip(null);
    if (duel.phase === "standby") {
      setDuel({ ...duel, phase: "main1", log: appendLog(duel.log, "スタンバイフェイズ終了。メインフェイズ1へ。") });
      return;
    }
    if (duel.phase === "main1") {
      const nextPhase: Phase = duel.turnNumber === 1 ? "main2" : "battle";
      setDuel({
        ...duel,
        phase: nextPhase,
        log: appendLog(
          duel.log,
          duel.turnNumber === 1 ? "先攻第1ターンのバトルフェイズをスキップ。" : "バトルフェイズへ。",
        ),
      });
      return;
    }
    if (duel.phase === "battle") {
      if (duel.playerExtraBattles > 0) {
        setDuel({
          ...duel,
          playerExtraBattles: duel.playerExtraBattles - 1,
          playerField: duel.playerField.map((zone) => ({ ...zone, attacked: false })),
          log: appendLog(duel.log, "ウェザー・レポートの効果で、2回目のバトルフェイズを開始。"),
        });
        return;
      }
      setDuel({ ...duel, phase: "main2", log: appendLog(duel.log, "メインフェイズ2へ。") });
      return;
    }
    endTurn();
  }

  function endTurn() {
    if (!duel || duel.turn !== "player" || duel.result || duel.pendingSevenTools || duel.pendingFlipTarget || duel.pendingMultiTarget || duel.pendingDeckReorder || duel.pendingDeckSearch || duel.pendingBlastJuggler || duel.pendingFakeTrap || duel.pendingRobbinGoblin || duel.pendingJustDesserts || duel.pendingBattleStatTrap || pendingTribute || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null || pendingCannonSoldier !== null || pendingCatapultTurtle !== null || pendingBarrelDragon !== null || pendingGaleDogra !== null || pendingCyberStein !== null || pendingAileSwordsman !== null || pendingYadoKaru !== null || pendingGracefulCharity !== null || pendingCardInspection !== null || pendingSharePain !== null || pendingTemporaryStat !== null || pendingSpellbindingCircle !== null || pendingPainfulChoice !== null || pendingDarknessApproaches !== null || pendingTailor !== null || pendingMatangoTransfer !== null || pendingStopAttack !== null) return;
    setSelectedAttacker(null);
    setSelectedEquip(null);
    let playerEnd = duel;
    if (playerEnd.cpuSwordsTurns.length > 0) {
      const swords = advanceSwordsTurns(playerEnd.cpuSwordsTurns);
      playerEnd = {
        ...playerEnd,
        cpuSwordsTurns: swords.remaining,
        cpuSpellTrap: swords.expired > 0
          ? removeCardCopies(playerEnd.cpuSpellTrap, "vol2-swords-revealing-light", swords.expired)
          : playerEnd.cpuSpellTrap,
        cpuGraveyard: swords.expired > 0
          ? [...playerEnd.cpuGraveyard, ...Array(swords.expired).fill("vol2-swords-revealing-light")]
          : playerEnd.cpuGraveyard,
        log: swords.expired > 0
          ? appendLog(playerEnd.log, "CPUの光の護封剣の効果が終了しました。")
          : playerEnd.log,
      };
    }
    playerEnd = resolveIronScorpionEndPhase(playerEnd);
    playerEnd = returnWormBeastAtEndPhase(playerEnd, "player");
    playerEnd = returnChangedMonsters(playerEnd);
    playerEnd = cleanupSpellbindingCircles(playerEnd);
    playerEnd = cleanupSnatchStealControl(playerEnd);
    const matangoIndex = nextPlayerMatangoTransferIndex(playerEnd);
    if (matangoIndex !== null) {
      setDuel(playerEnd);
      setPendingMatangoTransfer(matangoIndex);
      return;
    }
    completePlayerEndTurn(playerEnd);
  }

  function respondToMatangoTransfer(activate: boolean) {
    if (!duel || pendingMatangoTransfer === null) return;
    const target = duel.playerField[pendingMatangoTransfer];
    if (!target || target.id !== "vol7-matango") return;
    let resumed: DuelState = {
      ...duel,
      playerField: duel.playerField.map((zone, index) => index === pendingMatangoTransfer
        ? { ...zone, matangoOfferedTurn: duel.turnNumber }
        : zone),
      log: appendLog(duel.log, activate ? "マタンゴの効果を発動。500LPを払ってCPUへコントロールを移した。" : "マタンゴのコントロールを移さなかった。"),
    };
    if (activate && canTransferMatango(duel.playerLp, duel.cpuField.length, FIELD_LIMIT)) {
      const transferred = { ...target, matangoOfferedTurn: duel.turnNumber, attacked: true, positionChanged: true };
      resumed = {
        ...resumed,
        playerLp: resumed.playerLp - 500,
        playerField: resumed.playerField.filter((_, index) => index !== pendingMatangoTransfer),
        cpuField: [...resumed.cpuField, transferred],
      };
    }
    setPendingMatangoTransfer(null);
    const nextIndex = nextPlayerMatangoTransferIndex(resumed);
    if (nextIndex !== null) {
      setDuel(resumed);
      setPendingMatangoTransfer(nextIndex);
      return;
    }
    completePlayerEndTurn(resumed);
  }

  function completePlayerEndTurn(playerEnd: DuelState) {
    const clearedPlayerEnd = clearSwappedStats(playerEnd);
    const cpuStart: DuelState = {
      ...clearedPlayerEnd,
      turn: "cpu",
      turnNumber: clearedPlayerEnd.turnNumber + 1,
      phase: "main1",
      log: appendLog(clearedPlayerEnd.log, "ターン終了。CPUのターン。"),
    };
    const finalState = runCpuTurn(cpuStart);
    beginCpuPlayback(cpuStart, finalState, "ターン終了。CPUのターン。");
  }

  function beginCpuPlayback(_startState: DuelState, finalState: DuelState, marker: string) {
    const markerIndex = finalState.log.lastIndexOf(marker);
    const messages = finalState.log
      .slice(markerIndex >= 0 ? markerIndex + 1 : Math.max(0, finalState.log.length - 6))
      .filter((message) => message !== "あなたのターン。1枚ドロー。" && !isPendingActionMessage(message));
    // CPUの処理結果と行動文が食い違わないよう、盤面を先に確定してから履歴を見せる。
    setDuel(finalState);
    setCpuPlayback({
      finalState,
      messages: messages.length ? messages : ["CPUは行動せずターンを終了。"],
      index: 0,
    });
  }

  function respondToSevenTools(activate: boolean) {
    if (!duel?.pendingSevenTools) return;
    const pending = duel.pendingSevenTools;
    const summonedMonster = duel.playerField[pending.monsterIndex];
    if (!summonedMonster || summonedMonster.id !== pending.monsterId) return;
    let resolved: DuelState;
    if (activate) {
      resolved = {
        ...duel,
        pendingSevenTools: null,
        playerLp: duel.playerLp - 1000,
        playerSpellTrap: duel.playerSpellTrap.filter((_, index) => index !== pending.sevenToolsIndex),
        cpuSpellTrap: duel.cpuSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...duel.playerGraveyard, "vol6-seven-tools"],
        cpuGraveyard: [...duel.cpuGraveyard, "vol1-trap-hole"],
        log: appendLog(duel.log, "盗賊の七つ道具を発動。1000LPを払い、CPUの落とし穴を無効にして破壊した。"),
      };
      resolved = applyDeckSearchTriggers(resolved, pending.playerTributes, pending.cpuTributes);
    } else {
      resolved = {
        ...duel,
        pendingSevenTools: null,
        playerField: duel.playerField.filter((_, index) => index !== pending.monsterIndex),
        cpuSpellTrap: duel.cpuSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...duel.playerGraveyard, ...graveCards([summonedMonster])],
        cpuGraveyard: [...duel.cpuGraveyard, "vol1-trap-hole"],
        log: appendLog(duel.log, `盗賊の七つ道具を発動せず、${cardById.get(pending.monsterId)?.name ?? "モンスター"}が落とし穴で破壊された。`),
      };
      resolved = applyDeckSearchTriggers(resolved, [...pending.playerTributes, summonedMonster], pending.cpuTributes);
    }
    setDuel(resolved);
  }

  function respondToMagicJammer(discardIndex: number | null) {
    if (!duel?.pendingMagicJammer) return;
    const pending = duel.pendingMagicJammer;
    const marker = "マジック・ジャマーの発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingMagicJammer: null,
      log: appendLog(duel.log, marker),
    };
    if (discardIndex !== null) {
      const discardedId = resumed.playerHand[discardIndex];
      if (!discardedId || resumed.playerSpellTrap[pending.trapIndex] !== "vol6-magic-jammer") return;
      resumed = {
        ...resumed,
        playerHand: resumed.playerHand.filter((_, index) => index !== discardIndex),
        cpuHand: removeCardCopies(resumed.cpuHand, pending.spellId, 1),
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...resumed.playerGraveyard, discardedId, "vol6-magic-jammer"],
        cpuGraveyard: [...resumed.cpuGraveyard, pending.spellId],
        log: appendLog(resumed.log, `${cardById.get(discardedId)?.name ?? "カード"}を捨ててマジック・ジャマーを発動。${cardById.get(pending.spellId)?.name ?? "魔法カード"}を無効にして破壊した。`),
      };
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "マジック・ジャマーを発動しませんでした。") };
    }
    const solemnIndex = resumed.playerSpellTrap.indexOf("vol6-solemn-judgment");
    let finalState: DuelState = discardIndex === null && solemnIndex >= 0
      ? {
          ...resumed,
          pendingSolemnJudgment: { kind: "spell", trapIndex: solemnIndex, cardId: pending.spellId },
          log: appendLog(resumed.log, "続けて神の宣告を発動しますか？"),
        }
      : playCpuNormalSpells(resumed, discardIndex === null);
    if (!finalState.result && !finalState.pendingAntiRaigeki && !finalState.pendingMagicJammer && !finalState.pendingSolemnJudgment) {
      finalState = continueCpuTurnAfterSpells(finalState);
    }
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToHornOfHeaven(tributeIndex: number | null) {
    if (!duel?.pendingHornOfHeaven) return;
    const pending = duel.pendingHornOfHeaven;
    const summoned = duel.cpuField[pending.monsterIndex];
    if (!summoned || summoned.id !== pending.monsterId) return;
    const marker = "昇天の角笛の発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingHornOfHeaven: null,
      log: appendLog(duel.log, marker),
    };
    if (tributeIndex !== null) {
      const tribute = resumed.playerField[tributeIndex];
      if (!tribute || resumed.playerSpellTrap[pending.trapIndex] !== "vol6-horn-heaven") return;
      const cpuOwnedTribute = tribute.controlReturn === "cpu";
      resumed = {
        ...resumed,
        playerField: resumed.playerField.filter((_, index) => index !== tributeIndex),
        cpuField: resumed.cpuField.filter((_, index) => index !== pending.monsterIndex),
        playerSpellTrap: removeCardCopies(discardEquips(resumed.playerSpellTrap, [tribute]), "vol6-horn-heaven", 1),
        cpuSpellTrap: discardEquips(resumed.cpuSpellTrap, [summoned]),
        playerGraveyard: [
          ...resumed.playerGraveyard,
          ...(cpuOwnedTribute ? tribute.equipped : graveCards([tribute])),
          "vol6-horn-heaven",
        ],
        cpuGraveyard: [
          ...resumed.cpuGraveyard,
          ...(cpuOwnedTribute ? [tribute.id] : []),
          ...graveCards([summoned]),
        ],
        log: appendLog(resumed.log, `${cardById.get(tribute.id)?.name ?? "モンスター"}を生け贄にして昇天の角笛を発動。${cardById.get(summoned.id)?.name ?? "モンスター"}の召喚を無効にして破壊した。`),
      };
      resumed = applyDeckSearchTriggers(resumed, cpuOwnedTribute ? [] : [tribute], cpuOwnedTribute ? [tribute] : []);
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "昇天の角笛を発動しませんでした。") };
      const solemnIndex = resumed.playerSpellTrap.indexOf("vol6-solemn-judgment");
      if (solemnIndex >= 0) {
        setDuel({
          ...resumed,
          pendingSolemnJudgment: {
            kind: "summon",
            trapIndex: solemnIndex,
            monsterIndex: pending.monsterIndex,
            cardId: pending.monsterId,
          },
        });
        return;
      }
      const trapIndex = resumed.playerSpellTrap.indexOf("vol1-trap-hole");
      const summonedCard = cardById.get(summoned.id);
      if ((summonedCard?.atk ?? 0) >= 1000 && trapIndex >= 0) {
        setDuel({
          ...resumed,
          pendingTrapResponse: {
            trapIndex,
            monsterIndex: pending.monsterIndex,
            monsterId: pending.monsterId,
          },
        });
        return;
      }
    }
    const finalState = finishCpuTurn(resumed);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToSolemnJudgment(activate: boolean) {
    if (!duel?.pendingSolemnJudgment) return;
    const pending = duel.pendingSolemnJudgment;
    const marker = "神の宣告の発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingSolemnJudgment: null,
      log: appendLog(duel.log, marker),
    };
    if (pending.kind === "trap" && pending.monsterIndex !== undefined) {
      const summoned = resumed.playerField[pending.monsterIndex];
      const cpuTrapIndex = resumed.cpuSpellTrap.indexOf(pending.cardId);
      if (!summoned || cpuTrapIndex < 0) return;
      if (activate) {
        const remainingLp = solemnJudgmentRemainingLp(resumed.playerLp, resumed.playerSpellTrap);
        if (remainingLp === null || resumed.playerSpellTrap[pending.trapIndex] !== "vol6-solemn-judgment") return;
        resumed = {
          ...resumed,
          playerLp: remainingLp,
          playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
          cpuSpellTrap: resumed.cpuSpellTrap.filter((_, index) => index !== cpuTrapIndex),
          playerGraveyard: [...resumed.playerGraveyard, "vol6-solemn-judgment"],
          cpuGraveyard: [...resumed.cpuGraveyard, pending.cardId],
          log: appendLog(resumed.log, "LPを半分払い、神の宣告でCPUの落とし穴を無効にして破壊した。"),
        };
        resumed = applyDeckSearchTriggers(resumed, pending.playerTributes ?? [], pending.cpuTributes ?? []);
      } else {
        resumed = {
          ...resumed,
          playerField: resumed.playerField.filter((_, index) => index !== pending.monsterIndex),
          cpuSpellTrap: resumed.cpuSpellTrap.filter((_, index) => index !== cpuTrapIndex),
          playerGraveyard: [...resumed.playerGraveyard, ...graveCards([summoned])],
          cpuGraveyard: [...resumed.cpuGraveyard, pending.cardId],
          log: appendLog(resumed.log, `${cardById.get(summoned.id)?.name ?? "モンスター"}が落とし穴で破壊された。`),
        };
        resumed = applyDeckSearchTriggers(resumed, [...(pending.playerTributes ?? []), summoned], pending.cpuTributes ?? []);
      }
      setDuel(resumed);
      return;
    }
    if (activate) {
      const remainingLp = solemnJudgmentRemainingLp(resumed.playerLp, resumed.playerSpellTrap);
      if (remainingLp === null || resumed.playerSpellTrap[pending.trapIndex] !== "vol6-solemn-judgment") return;
      resumed = {
        ...resumed,
        playerLp: remainingLp,
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...resumed.playerGraveyard, "vol6-solemn-judgment"],
        log: appendLog(resumed.log, `LPを半分払い、神の宣告を発動。${cardById.get(pending.cardId)?.name ?? "カード"}を無効にして破壊した。`),
      };
      if (pending.kind === "spell") {
        resumed = {
          ...resumed,
          cpuHand: removeCardCopies(resumed.cpuHand, pending.cardId, 1),
          cpuGraveyard: [...resumed.cpuGraveyard, pending.cardId],
        };
      } else if (pending.monsterIndex !== undefined) {
        const summoned = resumed.cpuField[pending.monsterIndex];
        if (!summoned || summoned.id !== pending.cardId) return;
        resumed = {
          ...resumed,
          cpuField: resumed.cpuField.filter((_, index) => index !== pending.monsterIndex),
          cpuSpellTrap: discardEquips(resumed.cpuSpellTrap, [summoned]),
          cpuGraveyard: [...resumed.cpuGraveyard, ...graveCards([summoned])],
        };
      }
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "神の宣告を発動しませんでした。") };
    }

    if (pending.kind === "spell") {
      let finalState = playCpuNormalSpells(resumed, !activate);
      if (!finalState.result && !finalState.pendingAntiRaigeki && !finalState.pendingMagicJammer && !finalState.pendingSolemnJudgment) {
        finalState = continueCpuTurnAfterSpells(finalState);
      }
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    if (!activate && pending.monsterIndex !== undefined) {
      const trapIndex = resumed.playerSpellTrap.indexOf("vol1-trap-hole");
      if ((cardById.get(pending.cardId)?.atk ?? 0) >= 1000 && trapIndex >= 0) {
        setDuel({
          ...resumed,
          pendingTrapResponse: { trapIndex, monsterIndex: pending.monsterIndex, monsterId: pending.cardId },
        });
        return;
      }
    }
    const finalState = finishCpuTurn(resumed);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToTrap(activate: boolean) {
    if (!duel?.pendingTrapResponse) return;
    const pending = duel.pendingTrapResponse;
    const monster = cardById.get(pending.monsterId);
    const marker = "罠カードの発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingTrapResponse: null,
      log: appendLog(duel.log, marker),
    };
    if (activate) {
      const trappedMonster = resumed.cpuField[pending.monsterIndex];
      resumed = {
        ...resumed,
        cpuField: resumed.cpuField.filter((_, index) => index !== pending.monsterIndex),
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        cpuGraveyard: [...resumed.cpuGraveyard, pending.monsterId],
        playerGraveyard: [...resumed.playerGraveyard, "vol1-trap-hole"],
        log: appendLog(resumed.log, `落とし穴を発動。${monster?.name ?? "モンスター"}を破壊。`),
      };
      resumed = applyDeckSearchTriggers(resumed, [], trappedMonster ? [trappedMonster] : []);
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "落とし穴を発動しませんでした。") };
    }
    const finalState = finishCpuTurn(resumed);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToJustDesserts(activate: boolean) {
    if (!duel?.pendingJustDesserts) return;
    const pending = duel.pendingJustDesserts;
    let resumed: DuelState = { ...duel, pendingJustDesserts: null };
    if (activate && resumed.playerSpellTrap[pending.trapIndex] === "bo5-just-desserts") {
      const damage = justDessertsDamage(resumed.cpuField.length);
      const cpuLp = Math.max(0, resumed.cpuLp - damage);
      resumed = {
        ...resumed,
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...resumed.playerGraveyard, "bo5-just-desserts"],
        cpuLp,
        result: cpuLp === 0 ? "win" : resumed.result,
        log: appendLog(resumed.log, `自業自得を発動。CPUのモンスター${resumed.cpuField.length}体につき500、合計${damage}ダメージ。`),
      };
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "自業自得を発動しませんでした。") };
    }
    setDuel(resumed.result ? resumed : finishCpuTurn(resumed, true));
  }

  function toggleTwoProngedPlayer(index: number) {
    if (!duel?.pendingTwoPronged || !duel.playerField[index]) return;
    const selected = duel.pendingTwoPronged.selectedPlayer;
    const nextSelected = selected.includes(index)
      ? selected.filter((value) => value !== index)
      : selected.length < 2 ? [...selected, index] : selected;
    setDuel({
      ...duel,
      pendingTwoPronged: { ...duel.pendingTwoPronged, selectedPlayer: nextSelected },
    });
  }

  function selectTwoProngedCpu(index: number) {
    if (!duel?.pendingTwoPronged || !duel.cpuField[index]) return;
    setDuel({
      ...duel,
      pendingTwoPronged: { ...duel.pendingTwoPronged, selectedCpu: index },
    });
  }

  function resolveTwoPronged(activate: boolean) {
    if (!duel?.pendingTwoPronged) return;
    const pending = duel.pendingTwoPronged;
    const marker = "はさみ撃ちの発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingTwoPronged: null,
      log: appendLog(duel.log, marker),
    };
    if (activate) {
      if (pending.selectedPlayer.length !== 2 || pending.selectedCpu === null) return;
      if (duel.playerSpellTrap[pending.trapIndex] !== "stb-two-pronged-attack") return;
      const playerIndexes = new Set(pending.selectedPlayer);
      const destroyedOnPlayerField = duel.playerField.filter((_, index) => playerIndexes.has(index));
      const destroyedCpuTarget = duel.cpuField[pending.selectedCpu];
      if (destroyedOnPlayerField.length !== 2 || !destroyedCpuTarget) return;
      const returnedCpu = destroyedOnPlayerField.filter((zone) => zone.controlReturn === "cpu");
      const destroyedPlayer = destroyedOnPlayerField.filter((zone) => zone.controlReturn !== "cpu");
      const remainingPlayerSpellTrap = duel.playerSpellTrap.filter((_, index) => index !== pending.trapIndex);
      resumed = {
        ...resumed,
        playerField: duel.playerField.filter((_, index) => !playerIndexes.has(index)),
        cpuField: duel.cpuField.filter((_, index) => index !== pending.selectedCpu),
        playerSpellTrap: discardEquips(remainingPlayerSpellTrap, destroyedPlayer),
        cpuSpellTrap: discardEquips(duel.cpuSpellTrap, [destroyedCpuTarget, ...returnedCpu]),
        playerGraveyard: [...duel.playerGraveyard, "stb-two-pronged-attack", ...graveCards(destroyedPlayer)],
        cpuGraveyard: [...duel.cpuGraveyard, ...graveCards([destroyedCpuTarget]), ...graveCards(returnedCpu)],
        log: appendLog(resumed.log, "はさみ撃ちを発動。自分のモンスター2体とCPUモンスター1体を同時に破壊。"),
      };
      resumed = applyDeckSearchTriggers(resumed, destroyedPlayer, [destroyedCpuTarget, ...returnedCpu]);
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "はさみ撃ちを発動しませんでした。") };
    }
    const finalState = finishCpuTurn(resumed, true);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToGuardian(activate: boolean) {
    if (!duel?.pendingGuardianResponse) return;
    const pending = duel.pendingGuardianResponse;
    const guardianName = cardById.get(pending.guardianId)?.name ?? "三魔神";
    const marker = "三魔神の効果確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingGuardianResponse: null,
      log: appendLog(
        appendLog(duel.log, marker),
        activate
          ? `${guardianName}の効果を発動。攻撃モンスターのATKを0にした。`
          : `${guardianName}の効果を発動しなかった。`,
      ),
    };
    const kuribohPrompt = prepareKuribohResponse(resumed, pending.attackerIndex, pending.defenderIndex, activate);
    if (kuribohPrompt) {
      beginCpuPlayback(resumed, kuribohPrompt, marker);
      return;
    }
    resumed = resolveBattle(resumed, "cpu", pending.attackerIndex, pending.defenderIndex, activate);
    const finalState = finishCpuTurn(resumed, true);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToKuriboh(activate: boolean) {
    if (!duel?.pendingKuribohResponse) return;
    const pending = duel.pendingKuribohResponse;
    const marker = "クリボーの効果確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingKuribohResponse: null,
      log: appendLog(duel.log, marker),
    };
    if (activate) {
      const handIndex = resumed.playerHand.indexOf("vol7-kuriboh");
      if (handIndex < 0) return;
      resumed = {
        ...resumed,
        playerHand: resumed.playerHand.filter((_, index) => index !== handIndex),
        playerGraveyard: [...resumed.playerGraveyard, "vol7-kuriboh"],
        log: appendLog(resumed.log, "クリボーを手札から捨て、この戦闘で受ける戦闘ダメージを0にした。"),
      };
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "クリボーの効果を使わなかった。") };
    }
    resumed = resolveBattle(
      resumed,
      "cpu",
      pending.attackerIndex,
      pending.defenderIndex,
      pending.guardianEffect,
      activate,
    );
    const finalState = finishCpuTurn(resumed, true);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToWaboku(activate: boolean) {
    if (!duel?.pendingWabokuResponse) return;
    const pending = duel.pendingWabokuResponse;
    const marker = "和睦の使者の効果確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingWabokuResponse: null,
      log: appendLog(duel.log, marker),
    };
    if (activate) {
      if (resumed.playerSpellTrap[pending.trapIndex] !== "ex-040") return;
      resumed = {
        ...resumed,
        playerWabokuTurn: resumed.turnNumber,
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...resumed.playerGraveyard, "ex-040"],
        log: appendLog(resumed.log, "和睦の使者を発動。このターン、戦闘ダメージを0にし、自分モンスターを戦闘では破壊されない状態にした。"),
      };
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "和睦の使者を発動しなかった。") };
      const kuribohPrompt = prepareKuribohOnlyResponse(resumed, pending.attackerIndex, pending.defenderIndex, pending.guardianEffect);
      if (kuribohPrompt) {
        beginCpuPlayback(resumed, kuribohPrompt, marker);
        return;
      }
    }
    resumed = resolveBattle(resumed, "cpu", pending.attackerIndex, pending.defenderIndex, pending.guardianEffect);
    const finalState = finishCpuTurn(resumed, true);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToRobbinGoblin(activate: boolean) {
    if (!duel?.pendingRobbinGoblin) return;
    const pending = duel.pendingRobbinGoblin;
    let resumed: DuelState = { ...duel, pendingRobbinGoblin: null };
    if (activate && resumed.playerSpellTrap[pending.trapIndex] === "vol7-robbin-goblin") {
      resumed = {
        ...resumed,
        playerActiveTraps: [...new Set([...resumed.playerActiveTraps, "vol7-robbin-goblin"])],
        log: appendLog(resumed.log, "追い剥ぎゴブリンを発動。CPUの手札をランダムに1枚捨てる。"),
      };
      resumed = discardRandomHandCard(resumed, "cpu", "追い剥ぎゴブリン");
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "追い剥ぎゴブリンを発動しなかった。") };
    }
    setDuel(resumed);
  }

  function respondToMirrorForce(activate: boolean) {
    if (!duel?.pendingMirrorForce) return;
    const pending = duel.pendingMirrorForce;
    const marker = "ミラーフォースの発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingMirrorForce: null,
      log: appendLog(duel.log, marker),
    };
    if (activate) {
      const destroyedCpu = resumed.cpuField.filter((zone) => isMirrorForceDestructionTarget(zone.position));
      resumed = {
        ...resumed,
        cpuField: resumed.cpuField.filter((zone) => !isMirrorForceDestructionTarget(zone.position)),
        cpuSpellTrap: discardEquips(resumed.cpuSpellTrap, destroyedCpu),
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        cpuGraveyard: [...resumed.cpuGraveyard, ...graveCards(destroyedCpu)],
        playerGraveyard: [...resumed.playerGraveyard, "vol7-mirror-force"],
        log: appendLog(resumed.log, `聖なるバリア －ミラーフォース－を発動。CPUの攻撃表示モンスター${destroyedCpu.length}体を破壊。`),
      };
      resumed = applyDeckSearchTriggers(resumed, [], destroyedCpu);
      const finalState = finishCpuTurn(resumed, true);
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    resumed = { ...resumed, log: appendLog(resumed.log, "ミラーフォースを発動しませんでした。") };
    const reverseTrapPrompt = prepareReverseTrap(resumed, pending.attackerIndex, pending.defenderIndex);
    if (reverseTrapPrompt) {
      beginCpuPlayback(resumed, reverseTrapPrompt, marker);
      return;
    }
    const statTrapPrompt = prepareBattleStatTrap(resumed, pending.attackerIndex, pending.defenderIndex);
    if (statTrapPrompt) {
      beginCpuPlayback(resumed, statTrapPrompt, marker);
      return;
    }
    const defender = pending.defenderIndex === null ? null : resumed.playerField[pending.defenderIndex];
    if (defender && !defender.faceDown && isGuardianMonster(defender.id) && !defender.guardianEffectUsed) {
      const finalState: DuelState = {
        ...resumed,
        pendingGuardianResponse: {
          attackerIndex: pending.attackerIndex,
          defenderIndex: pending.defenderIndex!,
          guardianId: defender.id,
        },
      };
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    const kuribohPrompt = prepareKuribohResponse(resumed, pending.attackerIndex, pending.defenderIndex);
    if (kuribohPrompt) {
      beginCpuPlayback(resumed, kuribohPrompt, marker);
      return;
    }
    resumed = resolveBattle(resumed, "cpu", pending.attackerIndex, pending.defenderIndex);
    const finalState = finishCpuTurn(resumed, true);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToBattleStatTrap(activate: boolean) {
    if (!duel?.pendingBattleStatTrap) return;
    const pending = duel.pendingBattleStatTrap;
    const trapName = cardById.get(pending.trapId)?.name ?? "罠カード";
    const marker = `${trapName}の発動確認が終了。`;
    let resumed: DuelState = {
      ...duel,
      pendingBattleStatTrap: null,
      log: appendLog(duel.log, marker),
    };
    if (activate && resumed.playerSpellTrap[pending.trapIndex] === pending.trapId) {
      resumed = {
        ...resumed,
        playerField: resumed.playerField.map((zone, index) => index === pending.defenderIndex
          ? pending.trapId === "bo3-reinforcements"
            ? { ...zone, battleAtkBonusTurn: resumed.turnNumber }
            : { ...zone, battleDefBonusTurn: resumed.turnNumber }
          : zone),
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...resumed.playerGraveyard, pending.trapId],
        log: appendLog(resumed.log, `${trapName}を発動。${pending.trapId === "bo3-reinforcements" ? "ATK" : "DEF"}をターン終了まで500アップ。`),
      };
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, `${trapName}を発動しませんでした。`) };
    }
    const defender = resumed.playerField[pending.defenderIndex];
    if (defender && !defender.faceDown && isGuardianMonster(defender.id) && !defender.guardianEffectUsed) {
      const finalState: DuelState = {
        ...resumed,
        pendingGuardianResponse: {
          attackerIndex: pending.attackerIndex,
          defenderIndex: pending.defenderIndex,
          guardianId: defender.id,
        },
      };
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    const kuribohPrompt = prepareKuribohResponse(resumed, pending.attackerIndex, pending.defenderIndex);
    if (kuribohPrompt) {
      beginCpuPlayback(resumed, kuribohPrompt, marker);
      return;
    }
    resumed = resolveBattle(resumed, "cpu", pending.attackerIndex, pending.defenderIndex);
    const finalState = finishCpuTurn(resumed, true);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToReverseTrap(activate: boolean) {
    if (!duel?.pendingReverseTrap) return;
    const pending = duel.pendingReverseTrap;
    const marker = "あまのじゃくの呪いの発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingReverseTrap: null,
      log: appendLog(duel.log, marker),
    };
    if (activate && resumed.playerSpellTrap[pending.trapIndex] === "bo3-reverse-trap") {
      resumed = {
        ...resumed,
        reverseTrapTurn: resumed.turnNumber,
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...resumed.playerGraveyard, "bo3-reverse-trap"],
        log: appendLog(resumed.log, "あまのじゃくの呪いを発動。このターンのATK・DEFのアップとダウンを反転。"),
      };
    } else {
      resumed = { ...resumed, reverseTrapDeclinedTurn: resumed.turnNumber, log: appendLog(resumed.log, "あまのじゃくの呪いを発動しませんでした。") };
    }
    const statTrapPrompt = prepareBattleStatTrap(resumed, pending.attackerIndex, pending.defenderIndex);
    if (statTrapPrompt) {
      beginCpuPlayback(resumed, statTrapPrompt, marker);
      return;
    }
    const defender = resumed.playerField[pending.defenderIndex];
    if (defender && !defender.faceDown && isGuardianMonster(defender.id) && !defender.guardianEffectUsed) {
      const finalState: DuelState = {
        ...resumed,
        pendingGuardianResponse: {
          attackerIndex: pending.attackerIndex,
          defenderIndex: pending.defenderIndex,
          guardianId: defender.id,
        },
      };
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    const kuribohPrompt = prepareKuribohResponse(resumed, pending.attackerIndex, pending.defenderIndex);
    if (kuribohPrompt) {
      beginCpuPlayback(resumed, kuribohPrompt, marker);
      return;
    }
    resumed = resolveBattle(resumed, "cpu", pending.attackerIndex, pending.defenderIndex);
    const finalState = finishCpuTurn(resumed, true);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToAntiRaigeki(activate: boolean) {
    if (!duel?.pendingAntiRaigeki) return;
    const pending = duel.pendingAntiRaigeki;
    const marker = "避雷針の発動確認が終了。";
    let resumed: DuelState = {
      ...duel,
      pendingAntiRaigeki: null,
      log: appendLog(duel.log, marker),
    };
    const destroyedCpu = activate ? [...resumed.cpuField] : [];
    const destroyedPlayer = activate ? [] : [...resumed.playerField];
    if (activate) {
      resumed = {
        ...resumed,
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        cpuSpellTrap: discardEquips(resumed.cpuSpellTrap, resumed.cpuField),
        playerGraveyard: [...resumed.playerGraveyard, "vol5-anti-raigeki"],
        cpuGraveyard: [...resumed.cpuGraveyard, ...graveCards(resumed.cpuField)],
        cpuField: [],
        log: appendLog(resumed.log, "避雷針を発動。サンダー・ボルトを無効にし、CPUのモンスターをすべて破壊。"),
      };
    } else {
      resumed = {
        ...resumed,
        playerSpellTrap: discardEquips(resumed.playerSpellTrap, resumed.playerField),
        playerGraveyard: [...resumed.playerGraveyard, ...graveCards(resumed.playerField)],
        playerField: [],
        log: appendLog(resumed.log, "避雷針を発動せず、サンダー・ボルトで自分のモンスターがすべて破壊された。"),
      };
    }
    resumed = applyDeckSearchTriggers(resumed, destroyedPlayer, destroyedCpu);
    const finalState = continueCpuTurnAfterSpells(resumed);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToSpellSpecificTrap(activate: boolean) {
    if (!duel?.pendingSpellSpecificTrap) return;
    const pending = duel.pendingSpellSpecificTrap;
    const trapName = cardById.get(pending.trapId)?.name ?? "罠カード";
    const marker = `${trapName}の発動確認が終了。`;
    let resumed: DuelState = {
      ...duel,
      pendingSpellSpecificTrap: null,
      log: appendLog(duel.log, marker),
    };
    if (activate) {
      resumed = {
        ...resumed,
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        playerGraveyard: [...resumed.playerGraveyard, pending.trapId],
        log: appendLog(resumed.log, `${trapName}を発動。${cardById.get(pending.spellId)?.name ?? "魔法カード"}に対応した。`),
      };
    }

    if (pending.trapId === "bo4-white-hole") {
      const destroyedPlayer = activate ? [] : [...resumed.playerField];
      const destroyedCpu = [...resumed.cpuField];
      resumed = {
        ...resumed,
        playerField: activate ? resumed.playerField : [],
        cpuField: [],
        playerSpellTrap: activate ? resumed.playerSpellTrap : discardEquips(resumed.playerSpellTrap, resumed.playerField),
        cpuSpellTrap: discardEquips(resumed.cpuSpellTrap, resumed.cpuField),
        playerGraveyard: [...resumed.playerGraveyard, ...graveCards(destroyedPlayer)],
        cpuGraveyard: [...resumed.cpuGraveyard, ...graveCards(destroyedCpu)],
        log: appendLog(resumed.log, activate
          ? "ホワイト・ホールにより自分のモンスターを守り、CPUのモンスターだけが破壊された。"
          : "ホワイト・ホールを発動せず、すべてのモンスターが破壊された。"),
      };
      resumed = applyDeckSearchTriggers(resumed, destroyedPlayer, destroyedCpu);
    } else if (pending.trapId === "bo4-call-grave") {
      if (activate) {
        resumed = { ...resumed, log: appendLog(resumed.log, "墓場からの呼び声により死者蘇生の効果を無効にした。") };
      } else {
        resumed = resolveCpuMonsterRebornEffect(resumed);
      }
    } else if (pending.trapId === "bo7-griffin-wing" && activate) {
      const destroyedCpuTraps = [...resumed.cpuSpellTrap];
      resumed = {
        ...resumed,
        cpuSpellTrap: [],
        cpuGraveyard: [...resumed.cpuGraveyard, ...destroyedCpuTraps],
        log: appendLog(resumed.log, `グリフォンの翼によりCPUの魔法・罠${destroyedCpuTraps.length}枚を破壊した。`),
      };
    }
    const finalState = continueCpuTurnAfterSpells(resumed);
    beginCpuPlayback(resumed, finalState, marker);
  }

  function respondToFakeTrap(activate: boolean) {
    if (!duel?.pendingFakeTrap) return;
    const pending = duel.pendingFakeTrap;
    const destroyIndex = activate ? pending.fakeTrapIndex : pending.targetIndex;
    const destroyId = activate ? "vol5-fake-trap" : pending.targetId;
    const targetName = cardById.get(pending.targetId)?.name ?? "罠カード";
    const monsterName = cardById.get(pending.monsterId)?.name ?? "カードを狩る死神";
    setDuel({
      ...duel,
      pendingFakeTrap: null,
      playerSpellTrap: duel.playerSpellTrap.filter((_, index) => index !== destroyIndex),
      playerGraveyard: [...duel.playerGraveyard, destroyId],
      log: appendLog(
        duel.log,
        activate
          ? `偽物のわなを発動。${targetName}の代わりに自身を破壊した。`
          : `${monsterName}の効果で${targetName}を破壊した。`,
      ),
    });
  }

  function toggleBlastJugglerTarget(side: Side, index: number) {
    if (!duel?.pendingBlastJuggler) return;
    const key = `${side}:${index}`;
    const valid = blastJugglerTargetChoices(duel, duel.pendingBlastJuggler.monsterIndex)
      .some((choice) => choice.side === side && choice.index === index);
    if (!valid) return;
    setDuel({
      ...duel,
      pendingBlastJuggler: {
        ...duel.pendingBlastJuggler,
        selected: toggleLimitedSelection(duel.pendingBlastJuggler.selected, key, 2),
      },
    });
  }

  function declineBlastJuggler() {
    if (!duel?.pendingBlastJuggler) return;
    const monsterIndex = duel.pendingBlastJuggler.monsterIndex;
    const declined: DuelState = {
      ...duel,
      playerField: duel.playerField.map((zone, index) =>
        index === monsterIndex ? { ...zone, blastPromptedTurn: duel.turnNumber } : zone,
      ),
      pendingBlastJuggler: null,
      log: appendLog(duel.log, "ミスター・ボンバーの効果を発動しなかった。"),
    };
    setDuel(openBlastJugglerPrompt(declined));
  }

  function confirmBlastJuggler() {
    if (!duel?.pendingBlastJuggler || duel.pendingBlastJuggler.selected.length === 0) return;
    const monsterIndex = duel.pendingBlastJuggler.monsterIndex;
    const bomber = duel.playerField[monsterIndex];
    if (bomber?.id !== "vol5-blast-juggler") return;
    const playerIndexes = new Set(duel.pendingBlastJuggler.selected
      .filter((key) => key.startsWith("player:"))
      .map((key) => Number(key.split(":")[1])));
    const cpuIndexes = new Set(duel.pendingBlastJuggler.selected
      .filter((key) => key.startsWith("cpu:"))
      .map((key) => Number(key.split(":")[1])));
    const destroyedPlayer = duel.playerField.filter((zone, index) =>
      index === monsterIndex || (playerIndexes.has(index) && canBlastJugglerTarget(zone.faceDown, effectiveAtk(zone, duel, "player"))),
    );
    const destroyedCpu = duel.cpuField.filter((zone, index) =>
      cpuIndexes.has(index) && canBlastJugglerTarget(zone.faceDown, effectiveAtk(zone, duel, "cpu")),
    );
    let resolved: DuelState = {
      ...duel,
      playerField: duel.playerField.filter((_, index) => index !== monsterIndex && !playerIndexes.has(index)),
      cpuField: duel.cpuField.filter((_, index) => !cpuIndexes.has(index)),
      playerSpellTrap: discardEquips(duel.playerSpellTrap, destroyedPlayer),
      cpuSpellTrap: discardEquips(duel.cpuSpellTrap, destroyedCpu),
      playerGraveyard: [...duel.playerGraveyard, ...graveCards(destroyedPlayer)],
      cpuGraveyard: [...duel.cpuGraveyard, ...graveCards(destroyedCpu)],
      pendingBlastJuggler: null,
      log: appendLog(duel.log, `ミスター・ボンバーの効果を発動。モンスター${destroyedPlayer.length + destroyedCpu.length - 1}体を破壊。`),
    };
    resolved = applyDeckSearchTriggers(resolved, destroyedPlayer, destroyedCpu);
    setDuel(openBlastJugglerPrompt(resolved));
  }

  function advanceCpuPlayback() {
    if (!cpuPlayback) return;
    setDuel(cpuPlayback.finalState);
    setCpuPlayback(null);
  }

  function chooseFlipTarget(targetIndex: number) {
    if (!duel?.pendingFlipTarget) return;
    let resolved = resolvePendingFlipTarget(duel, targetIndex);
    resolved = continuePendingFlipQueue(resolved);
    if (resolved.pendingFlipTarget) {
      setDuel(resolved);
      return;
    }
    if (duel.turn === "cpu") {
      const marker = "効果対象の選択が終了。";
      const resumed = { ...resolved, log: appendLog(resolved.log, marker) };
      const finalState = finishCpuTurn(resumed, true);
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    setDuel(resolved);
  }

  function toggleMultiTarget(key: string) {
    if (!duel?.pendingMultiTarget) return;
    const pending = duel.pendingMultiTarget;
    const limit = pending.effect === "destroy-dragon" ? 1 : 2;
    const selected = pending.selected.includes(key)
      ? pending.selected.filter((value) => value !== key)
      : pending.selected.length < limit ? [...pending.selected, key] : pending.selected;
    setDuel({ ...duel, pendingMultiTarget: { ...pending, selected } });
  }

  function confirmMultiTarget() {
    if (!duel?.pendingMultiTarget) return;
    const pending = duel.pendingMultiTarget;
    const valid = pending.effect === "destroy-two-set-spell-traps"
      ? pending.selected.length === 2
      : pending.effect === "destroy-dragon" ? pending.selected.length === 1 : pending.selected.length <= 2;
    if (!valid) return;
    const resolved = resolvePendingMultiTarget(duel);
    if (duel.turn === "cpu") {
      const marker = "複数対象の選択が終了。";
      const resumed = { ...resolved, log: appendLog(resolved.log, marker) };
      const finalState = finishCpuTurn(resumed, true);
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    setDuel(resolved);
  }

  function movePendingDeckCard(fromIndex: number, toIndex: number) {
    if (!duel?.pendingDeckReorder) return;
    setDuel({
      ...duel,
      pendingDeckReorder: {
        ...duel.pendingDeckReorder,
        cards: moveDeckCard(duel.pendingDeckReorder.cards, fromIndex, toIndex),
      },
    });
  }

  function confirmDeckOrder() {
    if (!duel?.pendingDeckReorder) return;
    const monsterName = cardById.get(duel.pendingDeckReorder.monsterId)?.name ?? "大王目玉";
    const resolved: DuelState = {
      ...duel,
      playerDeck: [...duel.pendingDeckReorder.cards, ...duel.playerDeck],
      pendingDeckReorder: null,
      log: appendLog(duel.log, `${monsterName}の効果でデッキの上を並べ替えた。`),
    };
    if (duel.turn === "cpu") {
      const marker = "デッキの並べ替えが終了。";
      const resumed = { ...resolved, log: appendLog(resolved.log, marker) };
      const finalState = finishCpuTurn(resumed, true);
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    setDuel(resolved);
  }

  function chooseDeckSearchCard(deckIndex: number) {
    if (!duel?.pendingDeckSearch) return;
    const sourceId = duel.pendingDeckSearch.monsterIds[0];
    const cardId = duel.playerDeck[deckIndex];
    const card = cardById.get(cardId);
    if (!cardId || !card || !canDeckSearchTarget(sourceId, card)) return;
    const nextPlayerDeck = duel.playerDeck.filter((_, index) => index !== deckIndex);
    const remainingTriggers = duel.pendingDeckSearch.monsterIds
      .slice(1)
      .filter((remainingSourceId) => nextPlayerDeck.some((id) => canDeckSearchTarget(remainingSourceId, cardById.get(id))));
    const sourceName = cardById.get(sourceId)?.name ?? "効果モンスター";
    const resolved: DuelState = {
      ...duel,
      playerDeck: nextPlayerDeck,
      playerHand: [...duel.playerHand, cardId],
      pendingDeckSearch: remainingTriggers.length > 0 ? { monsterIds: remainingTriggers } : null,
      log: appendLog(duel.log, `${sourceName}の効果で${card.name}をデッキから手札に加えた。`),
    };
    if (duel.turn === "cpu" && remainingTriggers.length === 0) {
      const marker = "デッキ検索が終了。";
      const resumed = { ...resolved, log: appendLog(resolved.log, marker) };
      const finalState = finishCpuTurn(resumed, true);
      beginCpuPlayback(resumed, finalState, marker);
      return;
    }
    setDuel(resolved);
  }

  if (!duel) {
    return (
      <section className="duel-lobby">
        <p className="section-label">SINGLE DUEL</p>
        <h2>CPUデュエル</h2>
        <div className="duel-rule-card">
          <strong>Magic Ruler対応 強化CPU · BUILD 137</strong>
          <p>Magic Rulerまでのカードを使う40枚デッキで、勝てる戦闘・効果カード・融合召喚を優先します。</p>
        </div>
        <dl>
          <div><dt>自分のデッキ</dt><dd>{savedDeck.length}枚</dd></div>
          <div><dt>融合デッキ</dt><dd>{savedFusionDeck.length}枚</dd></div>
          <div><dt>勝利報酬</dt><dd>CPUデッキから1枚</dd></div>
        </dl>
        <button className="duel-start" disabled={savedDeck.length < MIN_DECK_SIZE} onClick={startDuel}>
          {savedDeck.length >= MIN_DECK_SIZE ? "デュエル開始" : `あと${MIN_DECK_SIZE - savedDeck.length}枚必要`}
        </button>
        <button className="sound-toggle lobby-sound-toggle" onClick={toggleSound}>音声・BGM {soundEnabled ? "ON" : "OFF"}</button>
      </section>
    );
  }

  return (
    <section className={`duel-screen${activeFeedback ? ` action-${activeFeedback.kind}` : ""}`}>
      <div className="duel-hud">
        <div><span>CPU</span><strong>{Math.max(0, duel.cpuLp)}</strong><small>LP</small></div>
        <div className="turn-badge">TURN {duel.turnNumber}<b>{duel.turn === "player" ? "YOUR TURN" : "CPU TURN"}</b><button className="sound-toggle" onClick={toggleSound} aria-label={`音声とBGMを${soundEnabled ? "オフ" : "オン"}にする`}>{soundEnabled ? "BGM ON" : "BGM OFF"}</button></div>
        <div><span>PLAYER</span><strong>{Math.max(0, duel.playerLp)}</strong><small>LP</small></div>
      </div>
      {activeFeedback && (
        <div
          className={`duel-feedback-layer feedback-${activeFeedback.kind}`}
          key={`${activeFeedback.kind}-${feedbackKey}`}
          aria-live="assertive"
          style={{ "--duel-feedback-duration": `${activeFeedback.duration}ms` } as CSSProperties}
        >
          <div className="action-speed-lines" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
          <div className="action-emblem" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="action-cut-in">
            <b>{activeFeedback.title}</b>
            <strong>{activeFeedback.detail}</strong>
            <small>{activeFeedback.message}</small>
          </div>
          <div className="action-particles" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
        </div>
      )}
      <div className="phase-guide" aria-label="現在のフェイズ">
        {[
          ["DRAW", "ドロー"],
          ["STANDBY", "スタンバイ"],
          ["MAIN 1", "メイン1"],
          ["BATTLE", "バトル"],
          ["MAIN 2", "メイン2"],
          ["END", "エンド"],
        ].map(([english, japanese], index) => {
          const activeIndex = duel.phase === "standby" ? 1 : duel.phase === "main1" ? 2 : duel.phase === "battle" ? 3 : 4;
          return (
            <div className={index === activeIndex ? "active" : index < activeIndex ? "done" : ""} key={english}>
              <b>{english}</b><span>{japanese}</span>
            </div>
          );
        })}
      </div>
      <p className="phase-help">
        {duel.phase === "standby" && "スタンバイフェイズです。「邪悪な儀式」を発動するか、メイン1へ進んでください。"}
        {duel.phase === "main1" && "召喚・セット・魔法・罠・表示変更ができます。"}
        {duel.phase === "battle" && (duel.cpuSwordsTurns.length > 0
          ? "CPUの光の護封剣により、このターンは攻撃できません。"
          : "攻撃するモンスターを選び、攻撃対象を選んでください。")}
        {duel.phase === "main2" && "戦闘後に召喚・セット・魔法・罠を使用できます。"}
      </p>
      {duel.playerSwordsTurns.length > 0 && (
        <p className="effect-status">
          光の護封剣：CPUの攻撃をあと{Math.max(...duel.playerSwordsTurns)}ターン封じます
        </p>
      )}
      {duel.cpuSwordsTurns.length > 0 && (
        <p className="effect-status enemy-effect-status">
          CPUの光の護封剣：あと{Math.max(...duel.cpuSwordsTurns)}ターン攻撃できません
        </p>
      )}
      {duelChainEnergyCost(duel) > 0 && (
        <p className="effect-status">
          魔力の枷：手札からカードを出すたび{duelChainEnergyCost(duel)}LP（{duelChainEnergyCost(duel) / 500}枚分）
        </p>
      )}

      {cpuPlayback && (
        <div className="cpu-playback" aria-live="polite">
          <div>
            <p className="section-label">CPU ACTION RESULT</p>
            <h2>CPUの行動結果</h2>
            <p className="cpu-result-note">以下はすべて盤面へ反映済みです。</p>
            <ol className="cpu-result-list">
              {cpuPlayback.messages.map((message, index) => <li key={`${index}-${message}`}><b>{index + 1}</b><span>{message}</span></li>)}
            </ol>
            <button className="cpu-next" onClick={advanceCpuPlayback}>
              {cpuPlayback.finalState.pendingTrapResponse
                    ? "落とし穴の発動確認へ"
                    : cpuPlayback.finalState.pendingJustDesserts
                      ? "自業自得の発動確認へ"
                    : cpuPlayback.finalState.pendingTwoPronged
                      ? "はさみ撃ちの発動確認へ"
                    : cpuPlayback.finalState.pendingMagicJammer
                      ? "マジック・ジャマーの発動確認へ"
                    : cpuPlayback.finalState.pendingHornOfHeaven
                      ? "昇天の角笛の発動確認へ"
                    : cpuPlayback.finalState.pendingSolemnJudgment
                      ? "神の宣告の発動確認へ"
                    : cpuPlayback.finalState.pendingAntiRaigeki
                      ? "避雷針の発動確認へ"
                    : cpuPlayback.finalState.pendingMirrorForce
                      ? "ミラーフォースの発動確認へ"
                    : cpuPlayback.finalState.pendingBattleStatTrap
                      ? `${cardById.get(cpuPlayback.finalState.pendingBattleStatTrap.trapId)?.name}の発動確認へ`
                    : cpuPlayback.finalState.pendingReverseTrap
                      ? "あまのじゃくの呪いの発動確認へ"
                    : cpuPlayback.finalState.pendingGuardianResponse
                      ? "三魔神の効果確認へ"
                    : cpuPlayback.finalState.pendingKuribohResponse
                      ? "クリボーの効果確認へ"
                    : cpuPlayback.finalState.pendingWabokuResponse
                      ? "和睦の使者の発動確認へ"
                    : cpuPlayback.finalState.pendingFlipTarget
                      ? `${cardById.get(cpuPlayback.finalState.pendingFlipTarget.monsterId)?.name ?? "リバース効果"}の対象選択へ`
                    : cpuPlayback.finalState.pendingDeckReorder
                      ? "大王目玉の並べ替えへ"
                    : cpuPlayback.finalState.pendingDeckSearch
                      ? "デッキ検索へ"
                      : "確認して自分のターンへ"}
            </button>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingTrapResponse && (
        <div className="trap-response">
          <div>
            <p className="section-label">CHAIN RESPONSE</p>
            <h2>3. 落とし穴を発動しますか？</h2>
            <p>
              CPUが
              <strong>{cardById.get(duel.pendingTrapResponse.monsterId)?.name ?? "モンスター"}</strong>
              を召喚しました。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToTrap(true)}>発動する</button>
              <button onClick={() => respondToTrap(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingJustDesserts && (
        <div className="trap-response">
          <div>
            <p className="section-label">TRAP RESPONSE</p>
            <h2>自業自得を発動しますか？</h2>
            <p>CPUのモンスターは{duel.cpuField.length}体。発動すると{justDessertsDamage(duel.cpuField.length)}ダメージを与えます。</p>
            <div>
              <button className="activate-trap" onClick={() => respondToJustDesserts(true)}>発動する</button>
              <button onClick={() => respondToJustDesserts(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingMirrorForce && (
        <div className="trap-response mirror-force-response">
          <div>
            <p className="section-label">ATTACK RESPONSE</p>
            <h2>ミラーフォースを発動しますか？</h2>
            <p>
              CPUが攻撃を宣言しました。発動するとCPUの攻撃表示モンスターをすべて破壊します。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToMirrorForce(true)}>発動する</button>
              <button onClick={() => respondToMirrorForce(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingBattleStatTrap && (
        <div className="trap-response">
          <div>
            <p className="section-label">DAMAGE STEP</p>
            <h2>{cardById.get(duel.pendingBattleStatTrap.trapId)?.name}を発動しますか？</h2>
            <p>
              {cardById.get(duel.playerField[duel.pendingBattleStatTrap.defenderIndex]?.id)?.name}の
              {duel.pendingBattleStatTrap.trapId === "bo3-reinforcements" ? "ATK" : "DEF"}を、ターン終了まで500アップします。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToBattleStatTrap(true)}>発動する</button>
              <button onClick={() => respondToBattleStatTrap(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingReverseTrap && (
        <div className="trap-response">
          <div>
            <p className="section-label">DAMAGE STEP</p>
            <h2>あまのじゃくの呪いを発動しますか？</h2>
            <p>このターン中、装備・フィールド・モンスター効果などによるATK・DEFのアップとダウンを反転します。</p>
            <div>
              <button className="activate-trap" onClick={() => respondToReverseTrap(true)}>発動する</button>
              <button onClick={() => respondToReverseTrap(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingTwoPronged && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">TWO-PRONGED ATTACK</p>
            <h2>はさみ撃ちを発動しますか？</h2>
            <p>自分のモンスター2体とCPUモンスター1体を選択してください。裏側表示も選べます。</p>
            <h3>自分のモンスター（{duel.pendingTwoPronged.selectedPlayer.length}/2）</h3>
            <div className="spell-target-list">
              {duel.playerField.map((zone, index) => (
                <button
                  className={duel.pendingTwoPronged!.selectedPlayer.includes(index) ? "selected" : ""}
                  key={`two-pronged-player-${zone.id}-${index}`}
                  onClick={() => toggleTwoProngedPlayer(index)}
                >
                  <span>{duel.pendingTwoPronged!.selectedPlayer.includes(index) ? "選択中" : "自分フィールド"}</span>
                  <strong>{zone.faceDown ? "伏せモンスター" : cardById.get(zone.id)?.name}</strong>
                </button>
              ))}
            </div>
            <h3>CPUモンスター（1体）</h3>
            <div className="spell-target-list">
              {duel.cpuField.map((zone, index) => (
                <button
                  className={duel.pendingTwoPronged!.selectedCpu === index ? "selected" : ""}
                  key={`two-pronged-cpu-${zone.id}-${index}`}
                  onClick={() => selectTwoProngedCpu(index)}
                >
                  <span>{duel.pendingTwoPronged!.selectedCpu === index ? "選択中" : "CPUフィールド"}</span>
                  <strong>{zone.faceDown ? "伏せモンスター" : cardById.get(zone.id)?.name}</strong>
                </button>
              ))}
            </div>
            <button
              className="overlay-close"
              disabled={duel.pendingTwoPronged.selectedPlayer.length !== 2 || duel.pendingTwoPronged.selectedCpu === null}
              onClick={() => resolveTwoPronged(true)}
            >選んだ3体を破壊</button>
            <button onClick={() => resolveTwoPronged(false)}>発動しない</button>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingSevenTools && (
        <div className="trap-response">
          <div>
            <p className="section-label">COUNTER TRAP</p>
            <h2>盗賊の七つ道具を発動しますか？</h2>
            <p>CPUが落とし穴を発動しました。1000LPを払うと、発動を無効にして破壊できます。</p>
            <div>
              <button className="activate-trap" onClick={() => respondToSevenTools(true)}>1000LPを払い発動</button>
              <button onClick={() => respondToSevenTools(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingMagicJammer && (
        <div className="trap-response">
          <div>
            <p className="section-label">COUNTER TRAP</p>
            <h2>マジック・ジャマーを発動しますか？</h2>
            <p>
              CPUが<strong>{cardById.get(duel.pendingMagicJammer.spellId)?.name ?? "魔法カード"}</strong>を発動しました。
              捨てる手札を1枚選んでください。
            </p>
            <div className="target-list">
              {duel.playerHand.map((id, index) => (
                <button key={`${id}-${index}`} onClick={() => respondToMagicJammer(index)}>
                  <strong>{cardById.get(id)?.name ?? "カード"}</strong>
                  <small>このカードを捨てて無効にする</small>
                </button>
              ))}
            </div>
            <button onClick={() => respondToMagicJammer(null)}>発動しない</button>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingHornOfHeaven && (
        <div className="trap-response">
          <div>
            <p className="section-label">COUNTER TRAP</p>
            <h2>昇天の角笛を発動しますか？</h2>
            <p>
              CPUが<strong>{cardById.get(duel.pendingHornOfHeaven.monsterId)?.name ?? "モンスター"}</strong>を召喚しました。
              生け贄にする自分フィールドのモンスターを選んでください。
            </p>
            <div className="target-list">
              {duel.playerField.map((zone, index) => (
                <button key={`${zone.id}-${index}`} onClick={() => respondToHornOfHeaven(index)}>
                  <strong>{cardById.get(zone.id)?.name ?? "モンスター"}</strong>
                  <small>このモンスターを生け贄にする</small>
                </button>
              ))}
            </div>
            <button onClick={() => respondToHornOfHeaven(null)}>発動しない</button>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingSolemnJudgment && (
        <div className="trap-response">
          <div>
            <p className="section-label">COUNTER TRAP</p>
            <h2>神の宣告を発動しますか？</h2>
            <p>
              CPUが<strong>{cardById.get(duel.pendingSolemnJudgment.cardId)?.name ?? "カード"}</strong>を
              {duel.pendingSolemnJudgment.kind === "summon" ? "召喚" : "発動"}しました。
              LPは{solemnJudgmentRemainingLp(duel.playerLp, duel.playerSpellTrap)}になります。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToSolemnJudgment(true)}>LPを半分払い発動</button>
              <button onClick={() => respondToSolemnJudgment(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingAntiRaigeki && (
        <div className="trap-response">
          <div>
            <p className="section-label">CHAIN RESPONSE</p>
            <h2>避雷針を発動しますか？</h2>
            <p>CPUがサンダー・ボルトを発動しました。無効にしてCPUのモンスターをすべて破壊できます。</p>
            <div>
              <button className="activate-trap" onClick={() => respondToAntiRaigeki(true)}>発動する</button>
              <button onClick={() => respondToAntiRaigeki(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingSpellSpecificTrap && (
        <div className="trap-response">
          <div>
            <p className="section-label">CHAIN RESPONSE</p>
            <h2>{cardById.get(duel.pendingSpellSpecificTrap.trapId)?.name ?? "罠カード"}を発動しますか？</h2>
            <p>
              CPUが<strong>{cardById.get(duel.pendingSpellSpecificTrap.spellId)?.name ?? "魔法カード"}</strong>を発動しました。
              対応する罠カードをチェーンできます。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToSpellSpecificTrap(true)}>発動する</button>
              <button onClick={() => respondToSpellSpecificTrap(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {duel.pendingFakeTrap && (
        <div className="trap-response">
          <div>
            <p className="section-label">TRAP PROTECTION</p>
            <h2>偽物のわなを身代わりにしますか？</h2>
            <p>
              <strong>{cardById.get(duel.pendingFakeTrap.targetId)?.name ?? "罠カード"}</strong>
              が破壊されようとしています。偽物のわなを代わりに破壊して守れます。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToFakeTrap(true)}>身代わりにする</button>
              <button onClick={() => respondToFakeTrap(false)}>身代わりにしない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingGuardianResponse && (
        <div className="trap-response guardian-response">
          <div>
            <p className="section-label">GUARDIAN EFFECT</p>
            <h2>三魔神の効果を発動しますか？</h2>
            <p>
              <strong>{cardById.get(duel.pendingGuardianResponse.guardianId)?.name ?? "三魔神"}</strong>
              がCPUモンスターに攻撃されています。この戦闘だけ攻撃モンスターのATKを0にできます。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToGuardian(true)}>発動する</button>
              <button onClick={() => respondToGuardian(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingKuribohResponse && (
        <div className="trap-response kuriboh-response">
          <div>
            <p className="section-label">HAND EFFECT</p>
            <h2>クリボーの効果を使いますか？</h2>
            <p>
              手札のクリボーを捨てると、この戦闘で受ける戦闘ダメージを0にできます。モンスターの破壊は防ぎません。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToKuriboh(true)}>手札から捨てて使う</button>
              <button onClick={() => respondToKuriboh(false)}>使わない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingWabokuResponse && (
        <div className="trap-response waboku-response">
          <div>
            <p className="section-label">BATTLE TRAP</p>
            <h2>和睦の使者を発動しますか？</h2>
            <p>このターン、受ける戦闘ダメージを0にし、自分のモンスターを戦闘による破壊から守ります。</p>
            <div>
              <button className="activate-trap" onClick={() => respondToWaboku(true)}>発動する</button>
              <button onClick={() => respondToWaboku(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {!cpuPlayback && duel.pendingRobbinGoblin && (
        <div className="trap-response robbin-goblin-response">
          <div>
            <p className="section-label">BATTLE DAMAGE TRAP</p>
            <h2>追い剥ぎゴブリンを発動しますか？</h2>
            <p>戦闘ダメージを与えました。発動するとCPUの手札をランダムに1枚捨て、以後も戦闘ダメージのたびに適用します。</p>
            <div>
              <button className="activate-trap" onClick={() => respondToRobbinGoblin(true)}>発動する</button>
              <button onClick={() => respondToRobbinGoblin(false)}>発動しない</button>
            </div>
          </div>
        </div>
      )}
      {pendingMatangoTransfer !== null && (
        <div className="trap-response matango-response">
          <div>
            <p className="section-label">END PHASE EFFECT</p>
            <h2>マタンゴをCPUへ渡しますか？</h2>
            <p>
              500LPを払うと、このマタンゴのコントロールをCPUへ移します。次のCPUスタンバイフェイズにはCPUが300ダメージを受けます。
            </p>
            <div>
              <button className="activate-trap" onClick={() => respondToMatangoTransfer(true)}>500LP払って渡す</button>
              <button onClick={() => respondToMatangoTransfer(false)}>渡さない</button>
            </div>
          </div>
        </div>
      )}
      {duel.pendingBlastJuggler && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">BLAST JUGGLER</p>
            <h2>ミスター・ボンバーの効果</h2>
            <p>自身を生け贄にし、表側表示でATK1000以下のモンスターを2体まで破壊できます（選択中 {duel.pendingBlastJuggler.selected.length}/2）。</p>
            <div className="spell-target-list">
              {blastJugglerTargetChoices(duel, duel.pendingBlastJuggler.monsterIndex).map((choice) => {
                const key = `${choice.side}:${choice.index}`;
                const selected = duel.pendingBlastJuggler!.selected.includes(key);
                return (
                  <button className={selected ? "selected" : ""} key={key} onClick={() => toggleBlastJugglerTarget(choice.side, choice.index)}>
                    <span>{choice.side === "player" ? "自分フィールド" : "CPUフィールド"}{selected ? "・選択中" : ""}</span>
                    <strong>{choice.name}</strong>
                  </button>
                );
              })}
            </div>
            <button className="overlay-close" disabled={duel.pendingBlastJuggler.selected.length === 0} onClick={confirmBlastJuggler}>選んだモンスターを破壊</button>
            <button onClick={declineBlastJuggler}>発動しない</button>
          </div>
        </div>
      )}
      {pendingSpellbindingCircle !== null && (
        <div className="card-overlay">
          <article>
            <p className="section-label">CONTINUOUS TRAP</p>
            <h2>六芒星の呪縛の対象を選択</h2>
            <p>攻撃と表示形式の変更を封じる、CPUの表側表示モンスターを選んでください。</p>
            <div className="spell-target-list">
              {duel.cpuField.map((zone, index) => zone.faceDown || isEffectTargetProtected(duel, "cpu", zone) ? null : (
                <button key={`${zone.id}-${index}`} onClick={() => resolveSpellbindingCircle(index)}>
                  <strong>{cardById.get(zone.id)?.name}</strong>
                  <small>ATK {effectiveAtk(zone, duel, "cpu")} / DEF {effectiveDef(zone, duel, "cpu")}</small>
                </button>
              ))}
            </div>
            <button className="secondary" onClick={() => setPendingSpellbindingCircle(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingTemporaryStat && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">TEMPORARY STAT EFFECT</p>
            <h2>{cardById.get(pendingTemporaryStat.cardId)?.name}の対象を選択</h2>
            <p>{pendingTemporaryStat.cardId === "mr-rush-recklessly"
              ? "表側表示モンスター1体のATKを、このターン終了時まで700アップします。"
              : pendingTemporaryStat.cardId === "mr-reliable-guardian"
                ? "表側表示モンスター1体のDEFを、このターン終了時まで700アップします。"
                : "表側表示モンスター1体のDEFを、このターン終了時まで500ダウンします。"}</p>
            <div className="spell-target-list">
              {(["player", "cpu"] as const).flatMap((side) =>
                (side === "player" ? duel.playerField : duel.cpuField).map((zone, index) => zone.faceDown ? null : (
                  <button key={`${side}-${zone.id}-${index}`} onClick={() => resolveTemporaryStat(side, index)}>
                    <span>{side === "player" ? "自分フィールド" : "CPUフィールド"}・{zone.position === "attack" ? "攻撃表示" : "守備表示"}</span>
                    <strong>{cardById.get(zone.id)?.name ?? "モンスター"}</strong>
                    <small>ATK {effectiveAtk(zone, duel, side)} / DEF {effectiveDef(zone, duel, side)}</small>
                  </button>
                )),
              )}
            </div>
            <button className="overlay-close" onClick={() => setPendingTemporaryStat(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingReborn !== null && (
        <div className="card-overlay revive-overlay">
          <div className="graveyard-panel revive-panel">
            <p className="section-label">MONSTER REBORN</p>
            <h2>特殊召喚するモンスターを選択</h2>
            <div className="revive-list">
              {(["player", "cpu"] as const).flatMap((side) =>
                (side === "player" ? duel.playerGraveyard : duel.cpuGraveyard).map((id, index) => {
                  const card = cardById.get(id);
                  if (card?.cardType !== "monster") return null;
                  return (
                    <div key={`${side}-${id}-${index}`}>
                      <span>{side === "player" ? "自分" : "CPU"}の墓地</span>
                      <strong>{card.name}</strong>
                      <small>ATK {card.atk} / DEF {card.def}</small>
                      <div>
                        <button onClick={() => reviveMonster(side, index, "attack")}>攻撃表示</button>
                        <button onClick={() => reviveMonster(side, index, "defense")}>守備表示</button>
                      </div>
                    </div>
                  );
                }),
              )}
            </div>
            <button className="overlay-close" onClick={() => setPendingReborn(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingDeSpell !== null && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">{duel.playerHand[pendingDeSpell] === "stb-remove-trap" ? "REMOVE TRAP" : duel.playerHand[pendingDeSpell] === "mr-mystical-space-typhoon" ? "MYSTICAL SPACE TYPHOON" : "DE-SPELL"}</p>
            <h2>{duel.playerHand[pendingDeSpell] === "stb-remove-trap" ? "破壊する表側罠を選択" : duel.playerHand[pendingDeSpell] === "mr-mystical-space-typhoon" ? "破壊する魔法・罠を選択" : "確認するカードを選択"}</h2>
            <p>{duel.playerHand[pendingDeSpell] === "stb-remove-trap"
              ? "発動後もフィールドに残っている表側表示の罠だけを破壊できます。"
              : duel.playerHand[pendingDeSpell] === "mr-mystical-space-typhoon"
                ? "表側・セットを問わず、フィールドの魔法・罠カード1枚を破壊します。"
                : "魔法カードなら破壊し、罠カードなら確認後に元へ戻します。"}</p>
            <div className="spell-target-list">
              {(["player", "cpu"] as const).flatMap((side) =>
                (side === "player" ? duel.playerSpellTrap : duel.cpuSpellTrap).map((id, index) => {
                  const card = cardById.get(id);
                  if (!card) return null;
                  const removeTrapMode = duel.playerHand[pendingDeSpell] === "stb-remove-trap";
                  if (removeTrapMode && !isFaceUpTrapTarget(id)) return null;
                  const hidden = card.cardType === "trap" && !isFaceUpTrapTarget(id);
                  return (
                    <button key={`${side}-${id}-${index}`} onClick={() => resolveDeSpell(side, index)}>
                      <span>{side === "player" ? "自分" : "CPU"}のフィールド</span>
                      <strong>{hidden ? "伏せカード" : card.name}</strong>
                    </button>
                  );
                }),
              )}
              {(duel.playerHand[pendingDeSpell] === "vol2-de-spell" || duel.playerHand[pendingDeSpell] === "mr-mystical-space-typhoon") && (["player", "cpu"] as const).map((side) => {
                const id = side === "player" ? duel.playerFieldSpell : duel.cpuFieldSpell;
                if (!id) return null;
                return (
                  <button key={`${side}-field-spell`} onClick={() => resolveDeSpell(side, -1, true)}>
                    <span>{side === "player" ? "自分" : "CPU"}のフィールド魔法</span>
                    <strong>{cardById.get(id)?.name}</strong>
                  </button>
                );
              })}
            </div>
            <button className="overlay-close" onClick={() => setPendingDeSpell(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingEgotist !== null && (
        <div className="card-overlay revive-overlay">
          <div className="graveyard-panel revive-panel">
            <p className="section-label">ELEGANT EGOTIST</p>
            <h2>特殊召喚するハーピィを選択</h2>
            <div className="revive-list">
              {elegantEgotistChoices(duel, pendingEgotist).map((choice) => {
                const target = cardById.get(choice.cardId);
                return (
                  <div key={`${choice.source}-${choice.cardId}`}>
                    <span>{choice.source === "hand" ? "自分の手札" : "自分のデッキ"}</span>
                    <strong>{target?.name}</strong>
                    <small>ATK {target?.atk} / DEF {target?.def}</small>
                    <div>
                      <button onClick={() => summonHarpie(choice.source, choice.cardId, "attack")}>攻撃表示</button>
                      <button onClick={() => summonHarpie(choice.source, choice.cardId, "defense")}>守備表示</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="overlay-close" onClick={() => setPendingEgotist(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingTributeToDoomed && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">TRIBUTE TO THE DOOMED</p>
            <h2>{pendingTributeToDoomed.discardIndex === null ? "捨てる手札を選ぶ" : "破壊するモンスターを選ぶ"}</h2>
            <p>{pendingTributeToDoomed.discardIndex === null ? "発動カード以外の手札を1枚捨てます。" : "自分またはCPUのフィールドから1体選んでください。"}</p>
            <div className="spell-target-list">
              {pendingTributeToDoomed.discardIndex === null
                ? duel.playerHand.map((id, index) => index === pendingTributeToDoomed.spellIndex ? null : (
                    <button key={`${id}-${index}`} onClick={() => setPendingTributeToDoomed({ ...pendingTributeToDoomed, discardIndex: index })}>
                      <span>手札コスト</span><strong>{cardById.get(id)?.name ?? "カード"}</strong>
                    </button>
                  ))
                : (["player", "cpu"] as const).flatMap((side) =>
                    (side === "player" ? duel.playerField : duel.cpuField).map((zone, index) => isEffectTargetProtected(duel, side, zone) ? null : (
                      <button key={`${side}-${zone.id}-${index}`} onClick={() => resolveTributeToDoomed(side, index)}>
                        <span>{side === "player" ? "自分フィールド" : "CPUフィールド"}</span>
                        <strong>{zone.faceDown ? "裏側モンスター" : cardById.get(zone.id)?.name ?? "モンスター"}</strong>
                      </button>
                    )),
                  )}
            </div>
            <button className="overlay-close" onClick={() => setPendingTributeToDoomed(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingSoulRelease && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">SOUL RELEASE</p>
            <h2>除外するカードを選ぶ</h2>
            <p>自分・CPUの墓地から合計5枚まで選べます（選択中 {pendingSoulRelease.selected.length}/5）。</p>
            <div className="spell-target-list">
              {(["player", "cpu"] as const).flatMap((side) =>
                (side === "player" ? duel.playerGraveyard : duel.cpuGraveyard).map((id, index) => {
                  const key = `${side}:${index}`;
                  const selected = pendingSoulRelease.selected.includes(key);
                  return (
                    <button className={selected ? "selected" : ""} key={key} onClick={() => toggleSoulReleaseCard(side, index)}>
                      <span>{side === "player" ? "自分の墓地" : "CPUの墓地"}{selected ? "・選択中" : ""}</span>
                      <strong>{cardById.get(id)?.name ?? "カード"}</strong>
                    </button>
                  );
                }),
              )}
            </div>
            <button className="overlay-close" disabled={pendingSoulRelease.selected.length === 0} onClick={confirmSoulRelease}>選んだカードを除外</button>
            <button onClick={() => setPendingSoulRelease(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingCheerfulCoffin && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">CHEERFUL COFFIN</p>
            <h2>墓地へ送るモンスターを選ぶ</h2>
            <p>手札のモンスターを3枚まで選べます（選択中 {pendingCheerfulCoffin.selected.length}/3）。</p>
            <div className="spell-target-list">
              {duel.playerHand.map((id, index) => {
                const card = cardById.get(id);
                if (index === pendingCheerfulCoffin.spellIndex || card?.cardType !== "monster") return null;
                const selected = pendingCheerfulCoffin.selected.includes(String(index));
                return (
                  <button className={selected ? "selected" : ""} key={`${id}-${index}`} onClick={() => toggleCheerfulCoffinCard(index)}>
                    <span>{selected ? "選択中" : `★${card.level}`}</span>
                    <strong>{card.name}</strong>
                  </button>
                );
              })}
            </div>
            <button className="overlay-close" disabled={pendingCheerfulCoffin.selected.length === 0} onClick={confirmCheerfulCoffin}>選んだモンスターを墓地へ送る</button>
            <button onClick={() => setPendingCheerfulCoffin(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingChangeOfHeart !== null && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">CHANGE OF HEART</p>
            <h2>コントロールするモンスターを選ぶ</h2>
            <p>選んだCPUモンスターは、このターン終了時まで自分のフィールドで使用できます。</p>
            <div className="spell-target-list">
              {duel.cpuField.map((zone, index) => isEffectTargetProtected(duel, "cpu", zone) ? null : (
                <button key={`${zone.id}-${index}`} onClick={() => resolveChangeOfHeart(index)}>
                  <span>CPUフィールド</span>
                  <strong>{zone.faceDown ? "裏側モンスター" : cardById.get(zone.id)?.name ?? "モンスター"}</strong>
                </button>
              ))}
            </div>
            <button className="overlay-close" onClick={() => setPendingChangeOfHeart(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {pendingStopAttack !== null && (
        <div className="card-overlay spell-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">STOP ATTACK</p>
            <h2>守備表示にするモンスターを選ぶ</h2>
            <p>CPUの表側攻撃表示モンスター1体を表側守備表示に変更します。</p>
            <div className="spell-target-list">
              {duel.cpuField.map((zone, index) => canStopAttackTarget(zone.position, zone.faceDown) && !isEffectTargetProtected(duel, "cpu", zone) ? (
                <button key={`${zone.id}-${index}`} onClick={() => resolveStopAttack(index)}>
                  <span>表側攻撃表示</span>
                  <strong>{cardById.get(zone.id)?.name ?? "モンスター"}</strong>
                </button>
              ) : null)}
            </div>
            <button className="overlay-close" onClick={() => setPendingStopAttack(null)}>キャンセル</button>
          </div>
        </div>
      )}
      {duel.pendingFlipTarget && (
        <div className="card-overlay flip-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>{flipTargetHeading(duel.pendingFlipTarget.effect)}</h2>
            <p>{cardById.get(duel.pendingFlipTarget.monsterId)?.name}の効果対象を選んでください。</p>
            <div className="spell-target-list">
              {flipTargetChoices(duel, duel.pendingFlipTarget).map((choice) => (
                <button key={`${choice.id}-${choice.index}`} onClick={() => chooseFlipTarget(choice.index)}>
                  <span>{choice.zone}</span>
                  <strong>{choice.name}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {duel.pendingMultiTarget && (
        <div className="card-overlay flip-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>{duel.pendingMultiTarget.effect === "destroy-dragon" ? "破壊するドラゴン族を選ぶ" : duel.pendingMultiTarget.effect === "return-two-monsters" ? "手札に戻すモンスターを2体まで選ぶ" : "破壊するセットカードを2枚選ぶ"}</h2>
            <p>{cardById.get(duel.pendingMultiTarget.monsterId)?.name}の効果対象を選択してください。</p>
            <div className="spell-target-list">
              {multiTargetChoices(duel, duel.pendingMultiTarget).map((choice) => (
                <button
                  className={duel.pendingMultiTarget!.selected.includes(choice.key) ? "selected" : ""}
                  key={choice.key}
                  onClick={() => toggleMultiTarget(choice.key)}
                >
                  <span>{choice.zone}</span>
                  <strong>{choice.name}</strong>
                </button>
              ))}
            </div>
            <button
              className="primary"
              disabled={(duel.pendingMultiTarget.effect === "destroy-two-set-spell-traps" && duel.pendingMultiTarget.selected.length !== 2)
                || (duel.pendingMultiTarget.effect === "destroy-dragon" && duel.pendingMultiTarget.selected.length !== 1)}
              onClick={confirmMultiTarget}
            >
              {duel.pendingMultiTarget.effect === "return-two-monsters" && duel.pendingMultiTarget.selected.length === 0 ? "戻さず終了" : `選択した${duel.pendingMultiTarget.selected.length}件で決定`}
            </button>
          </div>
        </div>
      )}
      {duel.pendingDeckReorder && (
        <div className="card-overlay deck-reorder-overlay">
          <div className="graveyard-panel deck-reorder-panel">
            <p className="section-label">BIG EYE · FLIP EFFECT</p>
            <h2>デッキ上の順番を決める</h2>
            <p>一番上にしたいカードを1番へ移動してください。</p>
            <div className="deck-reorder-list">
              {duel.pendingDeckReorder.cards.map((id, index) => (
                <div key={`${id}-${index}`}>
                  <b>{index + 1}</b>
                  <span><strong>{cardById.get(id)?.name ?? "カード"}</strong><small>{cardById.get(id)?.kind}</small></span>
                  <button disabled={index === 0} onClick={() => movePendingDeckCard(index, index - 1)}>↑</button>
                  <button disabled={index === duel.pendingDeckReorder!.cards.length - 1} onClick={() => movePendingDeckCard(index, index + 1)}>↓</button>
                </div>
              ))}
            </div>
            <button className="overlay-close" onClick={confirmDeckOrder}>この順番でデッキに戻す</button>
          </div>
        </div>
      )}
      {duel.pendingDeckSearch && (
        <div className="card-overlay deck-search-overlay">
          <article>
            <p className="section-label">MONSTER EFFECT</p>
            <h2>{cardById.get(duel.pendingDeckSearch.monsterIds[0])?.name}のデッキ検索</h2>
            <p>手札に加えるモンスターを選んでください。</p>
            <div className="target-list">
              {duel.playerDeck.map((id, index) => {
                const card = cardById.get(id);
                if (!canDeckSearchTarget(duel.pendingDeckSearch!.monsterIds[0], card)) return null;
                return (
                  <button key={`${id}-${index}`} onClick={() => chooseDeckSearchCard(index)}>
                    <strong>{card?.name}</strong>
                    <small>ATK {card?.atk} / DEF {card?.def}</small>
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      )}

      <div className="duel-board">
        <div className="hand-summary">
          <span>CPU HAND</span><b>{duel.cpuHand.length}</b><span>DECK</span><b>{duel.cpuDeck.length}</b>
          <button className="grave-button" onClick={() => setGraveyardView("cpu")}>CPU墓地 {duel.cpuGraveyard.length}</button>
        </div>
        <div className="spell-trap-row cpu-spell-trap-row">
          {Array.from({ length: FIELD_LIMIT }, (_, index) => (
            <div className={duel.cpuSpellTrap[index] ? "set-card" : "empty-zone"} key={index}>
              {duel.cpuSpellTrap[index]
                ? cardById.get(duel.cpuSpellTrap[index])?.cardType === "trap"
                  ? "SET"
                  : cardById.get(duel.cpuSpellTrap[index])?.name
                : "MAGIC / TRAP"}
            </div>
          ))}
        </div>
        <div className={`field-spell-zone ${duel.cpuFieldSpell ? "active" : ""}`}>
          <span>CPU FIELD</span><strong>{duel.cpuFieldSpell ? cardById.get(duel.cpuFieldSpell)?.name : "—"}</strong>
        </div>
        <FieldRow
          zones={duel.cpuField}
          owner="cpu"
          state={duel}
          selectedTarget={selectedAttacker !== null}
          onTarget={attackTarget}
          equipTarget={selectedEquip !== null && isOpponentEquip(duel.playerHand[selectedEquip])}
          onEquip={(index) => equipSpell(index, "cpu")}
          equipId={selectedEquip === null ? null : duel.playerHand[selectedEquip]}
          onInspect={setDetailCardId}
        />
        {selectedAttacker !== null
          && duel.cpuField.length > 0
          && canMonsterAttackDirectly(duel.playerField[selectedAttacker]?.id ?? "") && (
            <button className="direct-attack-choice" onClick={attackDirectly}>
              モンスターを無視して直接攻撃
            </button>
          )}
        <div className="phase-line"><span>BATTLE FIELD</span></div>
        <FieldRow
          zones={duel.playerField}
          owner="player"
          state={duel}
          onAttack={chooseAttacker}
          canAttack={duel.phase === "battle" && duel.turnNumber > 1 && duel.cpuSwordsTurns.length === 0}
          equipTarget={selectedEquip !== null}
          onEquip={equipSpell}
          equipId={selectedEquip === null ? null : duel.playerHand[selectedEquip]}
          tributeTarget={pendingTribute !== null}
          selectedTributes={pendingTribute?.selected ?? []}
          onTribute={toggleTribute}
          canChangePosition={(index) => {
            const zone = duel.playerField[index];
            return Boolean(
              isPlayerMainPhase
              && !pendingTribute
              && zone
              && !zone.attacked
              && !zone.positionChanged
              && zone.summonedTurn !== duel.turnNumber
              && !isSpellbindingCircleLocked(duel, zone)
              && !isDragonCaptureJarLocked(cardById.get(zone.id)?.kind, zone.faceDown, isDragonCaptureJarActive(duel))
            );
          }}
          onPositionChange={changePosition}
          onInspect={setDetailCardId}
        />
        {isPlayerMainPhase && duel.playerField.some((zone) => zone.id === "vol6-cannon-soldier" && !zone.faceDown) && (
          <button
            className="effect-action-button"
            onClick={() => openCannonSoldierPicker(duel.playerField.findIndex((zone) => zone.id === "vol6-cannon-soldier" && !zone.faceDown))}
          >
            キャノン・ソルジャーの効果を使う
          </button>
        )}
        {isPlayerMainPhase && duel.playerField.some((zone) => zone.id === "vol7-catapult-turtle" && !zone.faceDown && zone.catapultUsedTurn !== duel.turnNumber) && (
          <button
            className="effect-action-button"
            onClick={() => openCatapultTurtlePicker(duel.playerField.findIndex((zone) => zone.id === "vol7-catapult-turtle" && !zone.faceDown && zone.catapultUsedTurn !== duel.turnNumber))}
          >
            カタパルト・タートルの効果を使う
          </button>
        )}
        {isPlayerMainPhase && duel.cpuField.length > 0 && duel.playerField.some((zone) => zone.id === "vol7-barrel-dragon" && !zone.faceDown && zone.barrelUsedTurn !== duel.turnNumber) && (
          <button
            className="effect-action-button"
            onClick={() => openBarrelDragonPicker(duel.playerField.findIndex((zone) => zone.id === "vol7-barrel-dragon" && !zone.faceDown && zone.barrelUsedTurn !== duel.turnNumber))}
          >
            リボルバー・ドラゴンの効果を使う
          </button>
        )}
        {isPlayerMainPhase && canPayMonsterEffect(duel.playerLp, 1000) && duel.playerGraveyard.includes("vol1-polymerization") && duel.playerField.some((zone) => zone.id === "bo6-monster-eye" && !zone.faceDown) && (
          <button className="effect-action-button" onClick={activateMonsterEye}>モンスター・アイの効果を使う（1000LP）</button>
        )}
        {isPlayerMainPhase && canPayMonsterEffect(duel.playerLp, 3000) && duel.playerFusionDeck.length > 0 && duel.playerField.some((zone) => zone.id === "bo6-gale-dogra" && !zone.faceDown) && (
          <button className="effect-action-button" onClick={() => setPendingGaleDogra(duel.playerField.findIndex((zone) => zone.id === "bo6-gale-dogra" && !zone.faceDown))}>ゲール・ドグラの効果を使う（3000LP）</button>
        )}
        {isPlayerMainPhase && canPayMonsterEffect(duel.playerLp, 5000) && duel.playerFusionDeck.length > 0 && duel.playerField.length < FIELD_LIMIT && duel.playerField.some((zone) => zone.id === "bo6-cyber-stein" && !zone.faceDown) && (
          <button className="effect-action-button" onClick={() => setPendingCyberStein({ sourceIndex: duel.playerField.findIndex((zone) => zone.id === "bo6-cyber-stein" && !zone.faceDown), fusionId: null })}>デビル・フランケンの効果を使う（5000LP）</button>
        )}
        {isPlayerMainPhase && duel.playerField.some((zone) => zone.id === "bo7-aile-swordsman" && !zone.faceDown) && (
          <button className="effect-action-button" onClick={() => setPendingAileSwordsman(duel.playerField.findIndex((zone) => zone.id === "bo7-aile-swordsman" && !zone.faceDown))}>アイルの小剣士の効果を使う</button>
        )}
        {isPlayerMainPhase
          && duel.playerSpellTrap.includes("bo3-ultimate-offering")
          && canUseUltimateOffering(duel.playerLp, duel.normalSummoned, duel.playerField.length, hasUltimateOfferingSummonCandidate(duel), FIELD_LIMIT) && (
            <button className="effect-action-button" onClick={activateUltimateOffering}>血の代償を発動して追加召喚（500LP）</button>
          )}
        {isPlayerMainPhase && !areTrapEffectsNegated(duel) && duel.playerSpellTrap.map((id, index) => id === "mr-snake-fang" ? (
          <button className="effect-action-button" key={`snake-fang-${index}`} onClick={() => beginSnakeFang(index)}>毒蛇の牙を発動する</button>
        ) : null)}
        {isPlayerMainPhase && !areTrapEffectsNegated(duel) && !hasSpellbindingCircleTarget(duel, "player") && duel.cpuField.some((zone) => !zone.faceDown && !isEffectTargetProtected(duel, "cpu", zone)) && duel.playerSpellTrap.map((id, index) => id === "mr-spellbinding-circle" ? (
          <button className="effect-action-button" key={`spellbinding-circle-${index}`} onClick={() => beginSpellbindingCircle(index)}>六芒星の呪縛を発動する</button>
        ) : null)}
        <div className="spell-trap-row">
          {Array.from({ length: FIELD_LIMIT }, (_, index) => (
            <div className={duel.playerSpellTrap[index] ? "set-card" : "empty-zone"} key={index}>
              {duel.playerSpellTrap[index]
                ? duel.playerSpellTrap[index] === "vol1-trap-hole"
                  ? "SET"
                  : cardById.get(duel.playerSpellTrap[index])?.name
                : "MAGIC / TRAP"}
            </div>
          ))}
        </div>
        <div className={`field-spell-zone player-field-spell ${duel.playerFieldSpell ? "active" : ""}`}>
          <span>PLAYER FIELD</span><strong>{duel.playerFieldSpell ? cardById.get(duel.playerFieldSpell)?.name : "—"}</strong>
        </div>
        <div className="hand-summary">
          <span>YOUR HAND</span><b>{duel.playerHand.length}</b><span>DECK</span><b>{duel.playerDeck.length}</b>
          <button className="grave-button" onClick={() => setGraveyardView("player")}>自分の墓地 {duel.playerGraveyard.length}</button>
        </div>
      </div>

      {pendingTribute && (
        <div className="tribute-picker">
          <strong>生け贄にするモンスターを選択</strong>
          <span>{pendingTribute.selected.length} / {pendingTribute.required}体</span>
          <button
            disabled={pendingTribute.selected.length !== pendingTribute.required}
            onClick={() => performSummon(pendingTribute.handIndex, pendingTribute.position, pendingTribute.selected)}
          >
            選択したモンスターを生け贄にする
          </button>
          <button onClick={() => setPendingTribute(null)}>キャンセル</button>
        </div>
      )}
      {pendingCannonSoldier !== null && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>キャノン・ソルジャー</h2>
            <p>生け贄にする自分フィールドのモンスターを選んでください。</p>
            <div className="target-list cannon-target-list">
              {duel.playerField.map((zone, index) => (
                <button key={`${zone.id}-${index}`} onClick={() => activateCannonSoldier(index)}>
                  <strong>{cardById.get(zone.id)?.name}</strong>
                  <small>{index === pendingCannonSoldier ? "キャノン・ソルジャー自身も選択できます" : "CPUに500ダメージ"}</small>
                </button>
              ))}
            </div>
            <button className="overlay-close" onClick={() => setPendingCannonSoldier(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingCatapultTurtle !== null && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>カタパルト・タートル</h2>
            <p>生け贄にするモンスターを選んでください。元々のATKの半分をCPUに与えます（1ターンに1度）。</p>
            <div className="target-list cannon-target-list">
              {duel.playerField.map((zone, index) => {
                const card = cardById.get(zone.id);
                return (
                  <button key={`${zone.id}-${index}`} onClick={() => activateCatapultTurtle(index)}>
                    <strong>{card?.name}</strong>
                    <small>CPUに{catapultTurtleDamage(card?.atk)}ダメージ</small>
                  </button>
                );
              })}
            </div>
            <button className="overlay-close" onClick={() => setPendingCatapultTurtle(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingBarrelDragon !== null && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>リボルバー・ドラゴン</h2>
            <p>破壊する相手モンスターを選んでください。コインを3回投げ、表が2回以上なら破壊します。</p>
            <div className="target-list cannon-target-list">
              {duel.cpuField.map((zone, index) => isEffectTargetProtected(duel, "cpu", zone) ? null : (
                <button key={`${zone.id}-${index}`} onClick={() => activateBarrelDragon(index)}>
                  <strong>{zone.faceDown ? "裏側モンスター" : cardById.get(zone.id)?.name}</strong>
                  <small>{zone.faceDown ? "表示形式：裏側" : `ATK ${effectiveAtk(zone, duel, "cpu")} ／ DEF ${effectiveDef(zone, duel, "cpu")}`}</small>
                </button>
              ))}
            </div>
            <button className="overlay-close" onClick={() => setPendingBarrelDragon(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingGaleDogra !== null && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>ゲール・ドグラ</h2>
            <p>3000LPを払い、墓地へ送る融合モンスターを選んでください。</p>
            <div className="target-list cannon-target-list">
              {duel.playerFusionDeck.map((id, index) => (
                <button key={`${id}-${index}`} onClick={() => activateGaleDogra(index)}>
                  <strong>{cardById.get(id)?.name}</strong><small>融合デッキから墓地へ送る</small>
                </button>
              ))}
            </div>
            <button className="overlay-close" onClick={() => setPendingGaleDogra(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingCyberStein && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>デビル・フランケン</h2>
            {!pendingCyberStein.fusionId ? (
              <>
                <p>5000LPを払い、特殊召喚する融合モンスターを選んでください。</p>
                <div className="target-list cannon-target-list">
                  {[...new Set(duel.playerFusionDeck)].map((id) => (
                    <button key={id} onClick={() => chooseCyberSteinFusion(id)}>
                      <strong>{cardById.get(id)?.name}</strong><small>ATK {cardById.get(id)?.atk} ／ DEF {cardById.get(id)?.def}</small>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>{cardById.get(pendingCyberStein.fusionId)?.name}の表示形式を選んでください。</p>
                <div className="target-list cannon-target-list">
                  <button onClick={() => activateCyberStein("attack")}>攻撃表示で特殊召喚</button>
                  <button onClick={() => activateCyberStein("defense")}>守備表示で特殊召喚</button>
                </div>
              </>
            )}
            <button className="overlay-close" onClick={() => setPendingCyberStein(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingAileSwordsman !== null && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>アイルの小剣士</h2>
            <p>生け贄にする自分フィールドのモンスターを選んでください。ターン終了までATKが700アップします。</p>
            <div className="target-list cannon-target-list">
              {duel.playerField.map((zone, index) => (
                <button key={`${zone.id}-${index}`} onClick={() => activateAileSwordsman(index)}>
                  <strong>{cardById.get(zone.id)?.name}</strong>
                  <small>{index === pendingAileSwordsman ? "自身も選択できます" : `ATK ${effectiveAtk(zone, duel, "player")}`}</small>
                </button>
              ))}
            </div>
            <button className="overlay-close" onClick={() => setPendingAileSwordsman(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingYadoKaru && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">MONSTER EFFECT</p>
            <h2>ヤドカリュー</h2>
            <p>デッキの一番下へ戻す手札を好きな枚数選んでください。</p>
            <div className="target-list cannon-target-list">
              {duel.playerHand.map((id, index) => (
                <button className={pendingYadoKaru.selected.includes(index) ? "selected" : ""} key={`${id}-${index}`} onClick={() => toggleYadoKaruCard(index)}>
                  <strong>{cardById.get(id)?.name}</strong>
                  <small>{pendingYadoKaru.selected.includes(index) ? "選択中" : "タップして選択"}</small>
                </button>
              ))}
            </div>
            <button onClick={resolveYadoKaru}>{pendingYadoKaru.selected.length > 0 ? `選択した${pendingYadoKaru.selected.length}枚を戻す` : "戻さずに終了"}</button>
          </article>
        </div>
      )}
      {pendingGracefulCharity !== null && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">SPELL EFFECT</p>
            <h2>天使の施し</h2>
            <p>墓地へ捨てる手札を2枚選んでください。</p>
            <div className="target-list cannon-target-list">
              {duel.playerHand.map((id, index) => (
                <button className={pendingGracefulCharity.includes(index) ? "selected" : ""} key={`${id}-${index}`} onClick={() => toggleGracefulCharityCard(index)}>
                  <strong>{cardById.get(id)?.name}</strong>
                  <small>{pendingGracefulCharity.includes(index) ? "選択中" : "タップして選択"}</small>
                </button>
              ))}
            </div>
            <button disabled={pendingGracefulCharity.length !== 2} onClick={resolveGracefulCharity}>選択した2枚を捨てる</button>
          </article>
        </div>
      )}
      {pendingCardInspection && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">CARD INSPECTION</p>
            <h2>{pendingCardInspection.kind === "spy" ? "未熟な密偵" : "古代の遠眼鏡"}</h2>
            <p>{pendingCardInspection.kind === "spy" ? "確認する相手の手札を1枚選んでください。" : "相手デッキの上から5枚です。順番は変更されません。"}</p>
            <div className="target-list cannon-target-list">
              {(pendingCardInspection.kind === "spy" ? duel.cpuHand : duel.cpuDeck.slice(0, 5)).map((id, index) => (
                <button key={`${id}-${index}`} onClick={() => pendingCardInspection.kind === "spy" && setPendingCardInspection({ ...pendingCardInspection, selected: index })}>
                  <strong>{pendingCardInspection.kind === "telescope" || pendingCardInspection.selected === index ? cardById.get(id)?.name : `相手の手札 ${index + 1}`}</strong>
                  <small>{pendingCardInspection.kind === "telescope" ? `${index + 1}枚目` : pendingCardInspection.selected === index ? "確認したカード" : "タップして確認"}</small>
                </button>
              ))}
            </div>
            <button disabled={pendingCardInspection.kind === "spy" && pendingCardInspection.selected === null} onClick={() => setPendingCardInspection(null)}>確認を終える</button>
          </article>
        </div>
      )}
      {pendingHandDisruption && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">SPELL EFFECT</p>
            <h2>{pendingHandDisruption.kind === "confiscation" ? "押収" : "強引な番兵"}</h2>
            <p>CPUの手札を確認し、効果を適用するカードを1枚選んでください。</p>
            <div className="target-list cannon-target-list">
              {duel.cpuHand.map((id, index) => (
                <button key={`${id}-${index}`} onClick={() => resolveHandDisruptionSpell(index)}>
                  <strong>{cardById.get(id)?.name}</strong>
                  <small>{pendingHandDisruption.kind === "confiscation" ? "墓地へ捨てる" : "デッキへ戻す"}</small>
                </button>
              ))}
            </div>
            <button className="overlay-close" onClick={() => setPendingHandDisruption(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingFinalDestiny && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">SPELL EFFECT</p>
            <h2>最終戦争</h2>
            <p>墓地へ捨てる手札を5枚選んでください。</p>
            <div className="target-list cannon-target-list">
              {duel.playerHand.map((id, index) => index === pendingFinalDestiny.spellIndex ? null : (
                <button className={pendingFinalDestiny.selected.includes(index) ? "selected" : ""} key={`${id}-${index}`} onClick={() => toggleFinalDestinyCard(index)}>
                  <strong>{cardById.get(id)?.name}</strong>
                  <small>{pendingFinalDestiny.selected.includes(index) ? "選択中" : "タップして選択"}</small>
                </button>
              ))}
            </div>
            <button disabled={pendingFinalDestiny.selected.length !== 5} onClick={resolveFinalDestiny}>5枚捨てて発動</button>
            <button className="overlay-close" onClick={() => setPendingFinalDestiny(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingPainfulChoice && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">SPELL EFFECT</p>
            <h2>苦渋の選択</h2>
            <p>デッキから公開するカードを5枚選んでください（選択中 {pendingPainfulChoice.selected.length}/5）。CPUが1枚を選びます。</p>
            <div className="target-list cannon-target-list">
              {duel.playerDeck.map((id, index) => (
                <button className={pendingPainfulChoice.selected.includes(index) ? "selected" : ""} key={`${id}-${index}`} onClick={() => togglePainfulChoiceCard(index)}>
                  <strong>{cardById.get(id)?.name}</strong>
                  <small>{pendingPainfulChoice.selected.includes(index) ? "公開候補に選択中" : "タップして選択"}</small>
                </button>
              ))}
            </div>
            <button disabled={pendingPainfulChoice.selected.length !== 5} onClick={confirmPainfulChoice}>この5枚を公開する</button>
            <button className="overlay-close" onClick={() => setPendingPainfulChoice(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingTailor && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">QUICK-PLAY SPELL</p>
            <h2>移り気な仕立屋</h2>
            {pendingTailor.equipId === null ? (
              <>
                <p>移し替える装備魔法を選んでください。</p>
                <div className="target-list cannon-target-list">
                  {(["player", "cpu"] as const).flatMap((side) => (side === "player" ? duel.playerField : duel.cpuField).flatMap((zone, index) =>
                    zone.equipped.filter((id) => cardById.get(id)?.kind === "装備魔法").map((equipId) => (
                      <button key={`${side}-${index}-${equipId}`} onClick={() => selectTailorEquip(side, index, equipId)}>
                        <strong>{cardById.get(equipId)?.name}</strong>
                        <small>{cardById.get(zone.id)?.name}に装備中</small>
                      </button>
                    )),
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>{cardById.get(pendingTailor.equipId)?.name}の新しい装備先を選んでください。</p>
                <div className="target-list cannon-target-list">
                  {(["player", "cpu"] as const).flatMap((side) => (side === "player" ? duel.playerField : duel.cpuField).map((zone, index) => {
                    const target = cardById.get(zone.id);
                    const sameSource = side === pendingTailor.sourceSide && index === pendingTailor.sourceIndex;
                    const crossingIntoFullZone = side !== pendingTailor.sourceSide && (side === "player" ? duel.playerSpellTrap : duel.cpuSpellTrap).length >= FIELD_LIMIT;
                    if (sameSource || crossingIntoFullZone || zone.faceDown || !target || !canEquip(pendingTailor.equipId!, target)) return null;
                    return (
                      <button key={`${side}-${zone.id}-${index}`} onClick={() => resolveTailor(side, index)}>
                        <strong>{target.name}</strong><small>{side === "player" ? "自分フィールド" : "CPUフィールド"}</small>
                      </button>
                    );
                  }))}
                </div>
              </>
            )}
            <button className="overlay-close" onClick={() => setPendingTailor(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingDarknessApproaches && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">SPELL EFFECT</p>
            <h2>闇の訪れ</h2>
            {pendingDarknessApproaches.discardIndexes.length < 2 ? (
              <>
                <p>墓地へ捨てる手札を2枚選んでください（選択中 {pendingDarknessApproaches.discardIndexes.length}/2）。</p>
                <div className="target-list cannon-target-list">
                  {duel.playerHand.map((id, index) => index === pendingDarknessApproaches.spellIndex ? null : (
                    <button className={pendingDarknessApproaches.discardIndexes.includes(index) ? "selected" : ""} key={`${id}-${index}`} onClick={() => toggleDarknessDiscard(index)}>
                      <strong>{cardById.get(id)?.name}</strong>
                      <small>{pendingDarknessApproaches.discardIndexes.includes(index) ? "捨てるカードに選択中" : "タップして選択"}</small>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>表示形式を変えずに裏側表示にする、表側モンスター1体を選んでください。</p>
                <div className="target-list cannon-target-list">
                  {(["player", "cpu"] as const).flatMap((side) => (side === "player" ? duel.playerField : duel.cpuField).map((zone, index) => zone.faceDown ? null : (
                    <button key={`${side}-${zone.id}-${index}`} onClick={() => resolveDarknessApproaches(side, index)}>
                      <strong>{cardById.get(zone.id)?.name}</strong>
                      <small>{side === "player" ? "自分" : "CPU"}・{zone.position === "attack" ? "攻撃表示" : "守備表示"}</small>
                    </button>
                  ))) }
                </div>
              </>
            )}
            <button className="overlay-close" onClick={() => setPendingDarknessApproaches(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingSharePain && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">SPELL EFFECT</p>
            <h2>痛み分け</h2>
            <p>生け贄にする自分フィールドのモンスターを選んでください。CPUも攻撃力が最も低いモンスター1体を生け贄にします。</p>
            <div className="target-list cannon-target-list">
              {duel.playerField.map((zone, index) => (
                <button key={`${zone.id}-${index}`} onClick={() => resolveSharePain(index)}>
                  <strong>{cardById.get(zone.id)?.name}</strong>
                  <small>ATK {effectiveAtk(zone, duel, "player")}</small>
                </button>
              ))}
            </div>
            <button className="overlay-close" onClick={() => setPendingSharePain(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingLastWill !== null && (
        <div className="card-overlay cannon-soldier-overlay">
          <article className="cannon-soldier-panel">
            <p className="section-label">SPECIAL SUMMON</p>
            <h2>遺言状</h2>
            <p>デッキからATK1500以下のモンスター1体を選び、表示形式を指定して特殊召喚します。</p>
            <div className="target-list cannon-target-list">
              {lastWillTargets(duel.playerDeck).map(({ id, index }) => {
                const monster = cardById.get(id);
                return (
                  <div className="last-will-target" key={`last-will-${id}-${index}`}>
                    <strong>{monster?.name}</strong>
                    <small>★{monster?.level}　ATK {monster?.atk} / DEF {monster?.def}　{monster?.kind}</small>
                    <div className="overlay-actions">
                      <button onClick={() => summonWithLastWill(index, "attack")}>攻撃表示</button>
                      <button onClick={() => summonWithLastWill(index, "defense")}>守備表示</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="overlay-close" onClick={() => setPendingLastWill(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingFusion && (
        <div className="card-overlay">
          <article>
            <p className="section-label">FUSION SUMMON</p>
            <h2>{pendingFusion.fusionId ? cardById.get(pendingFusion.fusionId)?.name : "融合先を選択"}</h2>
            {!pendingFusion.fusionId ? (
              <>
                <p>融合デッキから、現在の手札・フィールドで召喚できるモンスターを選んでください。</p>
                <div className="target-list">
                  {fusionChoices(
                    duel.playerFusionDeck,
                    [...duel.playerHand.filter((_, index) => index !== pendingFusion.spellIndex), ...duel.playerField.map((zone) => zone.id)],
                  ).map((fusionId) => (
                    <button key={fusionId} onClick={() => chooseFusionMonster(fusionId)}>
                      <strong>{cardById.get(fusionId)?.name}</strong>
                      <small>{fusionRecipe(fusionId)?.map((id) => cardById.get(id)?.name).join(" ＋ ")}</small>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>素材を表示順に選択します。手札と自分フィールドのどちらから使うか選べます。</p>
                <div className="selected-summary">
                  {fusionRecipe(pendingFusion.fusionId)?.map((id, index) => (
                    <span key={`${id}-${index}`} className={pendingFusion.selected[index] ? "selected" : ""}>
                      {index + 1}. {cardById.get(id)?.name} {pendingFusion.selected[index] ? `（${pendingFusion.selected[index].source === "hand" ? "手札" : "フィールド"}）` : ""}
                    </span>
                  ))}
                </div>
                {pendingFusion.selected.length < (fusionRecipe(pendingFusion.fusionId)?.length ?? 0) && (
                  <div className="target-list">
                    {duel.playerHand.map((id, index) => canSelectFusionMaterial(fusionRecipe(pendingFusion.fusionId!) ?? [], pendingFusion.selected.map((choice) => choice.id), id) && index !== pendingFusion.spellIndex ? (
                      <button key={`fusion-hand-${index}`} onClick={() => chooseFusionMaterial("hand", index)}>
                        <strong>{cardById.get(id)?.name}</strong><small>手札から素材にする</small>
                      </button>
                    ) : null)}
                    {duel.playerField.map((zone, index) => canSelectFusionMaterial(fusionRecipe(pendingFusion.fusionId!) ?? [], pendingFusion.selected.map((choice) => choice.id), zone.id) ? (
                      <button key={`fusion-field-${index}`} onClick={() => chooseFusionMaterial("field", index)}>
                        <strong>{cardById.get(zone.id)?.name}</strong><small>フィールドから素材にする</small>
                      </button>
                    ) : null)}
                  </div>
                )}
                {pendingFusion.selected.length === (fusionRecipe(pendingFusion.fusionId)?.length ?? -1) && (
                  <div className="overlay-actions">
                    <button onClick={() => resolveFusion("attack")}>攻撃表示で融合召喚</button>
                    <button onClick={() => resolveFusion("defense")}>守備表示で融合召喚</button>
                  </div>
                )}
                <button onClick={() => setPendingFusion({ ...pendingFusion, fusionId: null, selected: [] })}>融合先を選び直す</button>
              </>
            )}
            <button onClick={() => setPendingFusion(null)}>キャンセル</button>
          </article>
        </div>
      )}
      {pendingDragonFlute && (
        <div className="card-overlay">
          <article>
            <p className="section-label">SPECIAL SUMMON</p>
            <h2>ドラゴンを呼ぶ笛</h2>
            <p>手札から特殊召喚するドラゴン族を最大2体選んでください。CPUも手札にいれば最大2体を特殊召喚します。</p>
            <div className="target-list">
              {duel.playerHand.map((id, index) => index !== pendingDragonFlute.spellIndex && cardById.get(id)?.kind === "ドラゴン族" ? (
                <button
                  key={`flute-${index}`}
                  className={pendingDragonFlute.selected.includes(index) ? "selected" : ""}
                  onClick={() => toggleDragonFluteCard(index)}
                >
                  <strong>{cardById.get(id)?.name}</strong>
                  <small>★{cardById.get(id)?.level}　ATK {cardById.get(id)?.atk} / DEF {cardById.get(id)?.def}</small>
                </button>
              ) : null)}
            </div>
            <div className="overlay-actions">
              <button disabled={pendingDragonFlute.selected.length === 0} onClick={() => resolveDragonFlute("attack")}>攻撃表示で特殊召喚</button>
              <button disabled={pendingDragonFlute.selected.length === 0} onClick={() => resolveDragonFlute("defense")}>守備表示で特殊召喚</button>
            </div>
            <button onClick={() => setPendingDragonFlute(null)}>キャンセル</button>
          </article>
        </div>
      )}

      <div className="duel-controls">
        <div className="duel-hand">
          {duel.playerHand.map((id, index) => {
            const card = cardById.get(id);
            if (!card) return null;
            const tributes = tributeCount(card);
            const canSummon = card.cardType === "monster"
              && canNormalSummonMonster(card.id, card.fusion)
              && isPlayerMainPhase
              && canPayDuelChainEnergy(duel, "player")
              && !duel.normalSummoned
              && !pendingTribute
              && duel.playerField.length >= tributes
              && duel.playerField.length - tributes < FIELD_LIMIT;
            return (
              <article className={`hand-card hand-${card.cardType}`} key={`${id}-${index}`}>
                <strong>{card.name}</strong>
                <span>{card.kind}{card.effect ? "／効果" : card.fusion ? "／融合" : card.cardType === "monster" ? "／通常" : ""}</span>
                <button className="card-detail-button" onClick={() => setDetailCardId(card.id)}>詳細</button>
                {card.cardType === "monster" ? (
                  <>
                    <small>★{card.level}　ATK {card.atk} / DEF {card.def}</small>
                    {(card.id === "vol5-larvae-moth" || card.id === "vol6-great-moth") ? (
                      <>
                        <small>{mothTargetIndex(duel, card.id) >= 0
                          ? "進化条件を満たしています"
                          : `進化の繭を装備して${card.id === "vol6-great-moth" ? "4" : "2"}回目の自分ターンを待ちます`}</small>
                        <div>
                          <button disabled={!isPlayerMainPhase || mothTargetIndex(duel, card.id) < 0} onClick={() => summonMoth(index, "attack")}>特殊召喚（攻）</button>
                          <button disabled={!isPlayerMainPhase || mothTargetIndex(duel, card.id) < 0} onClick={() => summonMoth(index, "defense")}>特殊召喚（守）</button>
                        </div>
                      </>
                    ) : (
                      <div><button disabled={!canSummon} onClick={() => summon(index, "attack")}>召喚</button><button disabled={!canSummon} onClick={() => summon(index, "defense")}>セット</button></div>
                    )}
                    {card.id === "vol4-cocoon-evolution" && (
                      <button
                        disabled={
                          !isPlayerMainPhase
                          || !canPayDuelChainEnergy(duel, "player")
                          || duel.playerSpellTrap.length >= FIELD_LIMIT
                          || !duel.playerField.some((zone) => !zone.faceDown && zone.id === "vol4-petit-moth")
                        }
                        onClick={() => {
                          setSelectedEquip(index);
                          setSelectedAttacker(null);
                        }}
                      >
                        {selectedEquip === index ? "プチモスを選択中" : "プチモスに装備"}
                      </button>
                    )}
                    {card.id === "vol7-thunder-dragon" && (
                      <button
                        disabled={!isPlayerMainPhase || !duel.playerDeck.includes("vol7-thunder-dragon")}
                        onClick={() => activateThunderDragon(index)}
                      >
                        捨てて同名カードをサーチ
                      </button>
                    )}
                  </>
                ) : card.cardType === "spell" ? (
                  <>
                    <small>{spellDescription(card.id)}</small>
                    <button
                      disabled={
                        !isSpellImplemented(card.id)
                        || (!isPlayerMainPhase && !(card.id === "mr-curse-fiend" && duel.phase === "standby"))
                        || !canPayDuelChainEnergy(duel, "player")
                        || pendingTribute !== null
                        || pendingReborn !== null
                        || pendingDeSpell !== null
                        || pendingEgotist !== null
                        || pendingTributeToDoomed !== null
                        || pendingSoulRelease !== null
                        || pendingCheerfulCoffin !== null
                        || pendingFusion !== null
                        || pendingLastWill !== null
                        || pendingDragonFlute !== null
                        || pendingChangeOfHeart !== null
                        || pendingStopAttack !== null
                        || (card.id === "vol2-swords-revealing-light" && duel.playerSpellTrap.length >= FIELD_LIMIT)
                        || (card.id === "vol1-fissure" && lowestFaceUpAttackIndex(duel.cpuField, duel, "cpu") === null)
                        || (card.id === "vol2-monster-reborn" && (
                          duel.playerField.length >= FIELD_LIMIT
                          || isMonsterRebornBlocked(duel.playerSpellTrap, duel.cpuSpellTrap)
                          || ![...duel.playerGraveyard, ...duel.cpuGraveyard]
                            .some((id) => cardById.get(id)?.cardType === "monster")
                        ))
                        || (card.id === "vol2-de-spell" && duel.playerSpellTrap.length + duel.cpuSpellTrap.length === 0 && !duel.playerFieldSpell && !duel.cpuFieldSpell)
                        || (card.id === "vol3-pot-of-greed" && duel.playerDeck.length < 2)
                        || (card.id === "vol3-stop-defense" && !duel.cpuField.some((zone) => zone.position === "defense"))
                        || (card.id === "vol7-stop-attack" && !duel.cpuField.some((zone) => canStopAttackTarget(zone.position, zone.faceDown) && !isEffectTargetProtected(duel, "cpu", zone)))
                        || (card.id === "vol3-gravedigger-ghoul" && !duel.cpuGraveyard.some((id) => cardById.get(id)?.cardType === "monster"))
                        || (card.id === "vol4-elegant-egotist" && !canActivateElegantEgotist(duel, index))
                        || (card.id === "vol5-tribute-doomed" && !canActivateTributeToDoomed(duel.playerHand.length, duel.playerField.length + duel.cpuField.length))
                        || (card.id === "vol5-soul-release" && duel.playerGraveyard.length + duel.cpuGraveyard.length === 0)
                        || (card.id === "vol5-cheerful-coffin" && !canActivateCheerfulCoffin(duel.playerHand.flatMap((id, handIndex) => handIndex === index ? [] : [cardById.get(id)?.cardType ?? ""])))
                        || (card.id === "vol5-change-heart" && (!canActivateChangeOfHeart(duel.playerField.length, duel.cpuField.length, FIELD_LIMIT) || !duel.cpuField.some((zone) => !isEffectTargetProtected(duel, "cpu", zone))))
                        || (card.id === "mr-painful-choice" && duel.playerDeck.length < 5)
                        || (card.id === "mr-darkness-approaches" && (duel.playerHand.length < 3 || ![...duel.playerField, ...duel.cpuField].some((zone) => !zone.faceDown)))
                        || (card.id === "mr-tailor-fickle" && ![...duel.playerField, ...duel.cpuField].some((zone) => zone.equipped.some((id) => cardById.get(id)?.kind === "装備魔法")))
                        || (card.id === "ex-039" && (
                          duel.playerMonsterSentToGraveTurn !== duel.turnNumber
                          || duel.playerField.length >= FIELD_LIMIT
                          || lastWillTargets(duel.playerDeck).length === 0
                        ))
                        || ((card.id === "stb-polymerization" || card.id === "vol6-polymerization") && (
                          duel.playerField.length >= FIELD_LIMIT
                          || fusionChoices(
                            duel.playerFusionDeck,
                            [...duel.playerHand.filter((_, handIndex) => handIndex !== index), ...duel.playerField.map((zone) => zone.id)],
                          ).length === 0
                        ))
                        || (card.id === "ex-085" && (
                          duel.playerField.length >= FIELD_LIMIT
                          || !duel.playerField.some((zone) => zone.id === "ex-084" && !zone.faceDown)
                          || !duel.playerHand.some((id, handIndex) => handIndex !== index && cardById.get(id)?.kind === "ドラゴン族")
                        ))
                        || (Boolean(EQUIP_RULES[card.id]) && !canActivateEquip(duel, card.id))
                      }
                      onClick={() => useSpell(index)}
                    >
                      {selectedEquip === index ? "装備先を選択中" : "発動"}
                    </button>
                  </>
                ) : (
                  <>
                    <small>{trapDescription(card.id)}</small>
                    <button disabled={!isTrapImplemented(card.id) || !isPlayerMainPhase || !canPayDuelChainEnergy(duel, "player") || pendingTribute !== null || duel.playerSpellTrap.length >= FIELD_LIMIT} onClick={() => setTrap(index)}>セット</button>
                  </>
                )}
              </article>
            );
          })}
        </div>
        <div className="phase-actions">
          <button className="end-turn" disabled={duel.turn !== "player" || Boolean(duel.pendingBlastJuggler) || Boolean(duel.pendingFakeTrap) || pendingTribute !== null || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null || pendingTemporaryStat !== null || pendingSpellbindingCircle !== null || pendingPainfulChoice !== null || pendingDarknessApproaches !== null || pendingTailor !== null || Boolean(duel.result)} onClick={advancePhase}>
            {duel.phase === "standby"
              ? "メイン1へ"
              : duel.phase === "main1"
              ? duel.turnNumber === 1 ? "メイン2へ" : "バトルへ"
              : duel.phase === "battle" ? "メイン2へ" : "ターン終了"}
          </button>
          {(duel.phase === "main1" || duel.phase === "battle") && (
            <button className="skip-turn" disabled={Boolean(duel.pendingBlastJuggler) || Boolean(duel.pendingFakeTrap) || pendingTribute !== null || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null || pendingTemporaryStat !== null || pendingSpellbindingCircle !== null || pendingPainfulChoice !== null || pendingDarknessApproaches !== null || pendingTailor !== null || Boolean(duel.result)} onClick={endTurn}>ターン終了</button>
          )}
        </div>
      </div>

      <div className="duel-log" aria-live="polite">
        {duel.log.slice(-5).map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}
      </div>

      {graveyardView && (
        <div className="card-overlay">
          <div className="graveyard-panel">
            <p className="section-label">{graveyardView === "player" ? "YOUR GRAVEYARD" : "CPU GRAVEYARD"}</p>
            <h2>墓地</h2>
            <div className="graveyard-list">
              {(graveyardView === "player" ? duel.playerGraveyard : duel.cpuGraveyard).map((id, index) => {
                const card = cardById.get(id);
                return card ? (
                  <button key={`${id}-${index}`} onClick={() => setDetailCardId(id)}>
                    <span>{card.name}</span><small>{card.kind}</small>
                  </button>
                ) : null;
              })}
              {(graveyardView === "player" ? duel.playerGraveyard : duel.cpuGraveyard).length === 0 && <p>墓地にカードはありません。</p>}
            </div>
            <button className="overlay-close" onClick={() => setGraveyardView(null)}>閉じる</button>
          </div>
        </div>
      )}

      {detailCardId && (
        <CardDetail cardId={detailCardId} onClose={() => setDetailCardId(null)} />
      )}

      {duel.result && (
        <div className="duel-result">
          <p className="section-label">DUEL RESULT</p>
          <h2>{duel.result === "win" ? "VICTORY" : duel.result === "draw" ? "DRAW" : "DEFEAT"}</h2>
          {duel.result === "win" && (
            <p>
              勝利報酬：<strong>{rewardName ?? "カード抽選中…"}</strong>
              {rewardName && rewardDiscarded && <><br /><small>所持上限5枚のため自動破棄</small></>}
            </p>
          )}
          <button onClick={() => setDuel(null)}>デュエルメニューへ</button>
        </div>
      )}
    </section>
  );
}

function CardDetail({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const card = cardById.get(cardId);
  if (!card) return null;
  return (
    <div className="card-overlay card-detail-overlay">
      <article className={`card-detail detail-${card.cardType}`}>
        <p className="section-label">CARD DETAIL</p>
        <h2>{card.name}</h2>
        <strong>{card.kind}{card.effect ? "／効果" : card.fusion ? "／融合" : card.cardType === "monster" ? "／通常" : ""}</strong>
        {card.cardType === "monster" ? (
          <>
            <p>属性：{card.attribute}　レベル：{card.level}</p>
            <p className="detail-stats">ATK {card.atk} / DEF {card.def}</p>
            {monsterDescription(card.id) && <p>{monsterDescription(card.id)}</p>}
          </>
        ) : (
          <p>{card.cardType === "spell" ? spellDescription(card.id) : trapDescription(card.id)}</p>
        )}
        <small>レアリティ：{card.rarity}</small>
        <button className="overlay-close" onClick={onClose}>閉じる</button>
      </article>
    </div>
  );
}

function FieldRow({
  zones,
  owner,
  state,
  selectedTarget = false,
  onTarget,
  onAttack,
  canAttack = false,
  equipTarget = false,
  onEquip,
  equipId,
  tributeTarget = false,
  selectedTributes = [],
  onTribute,
  canChangePosition,
  onPositionChange,
  onInspect,
}: {
  zones: ZoneCard[];
  owner: Side;
  state: DuelState;
  selectedTarget?: boolean;
  onTarget?: (index: number) => void;
  onAttack?: (index: number) => void;
  canAttack?: boolean;
  equipTarget?: boolean;
  onEquip?: (index: number) => void;
  equipId?: string | null;
  tributeTarget?: boolean;
  selectedTributes?: number[];
  onTribute?: (index: number) => void;
  canChangePosition?: (index: number) => boolean;
  onPositionChange?: (index: number) => void;
  onInspect?: (cardId: string) => void;
}) {
  return (
    <div className={`monster-zones zones-${owner}`}>
      {Array.from({ length: FIELD_LIMIT }, (_, index) => {
        const zone = zones[index];
        if (!zone) return <div className="empty-zone" key={index}>MONSTER</div>;
        const card = cardById.get(zone.id);
        if (!card) return null;
        const hidden = owner === "cpu" && zone.faceDown;
        const attackLocked = !canDeclareAttackOnTurn(zone.attackLockedTurn, state.turnNumber);
        const cannotPayAttackCost = owner === "player" && duelAttackPayment(state, "player", zone.id) === null;
        const paralyzed = paralyzingPotionPreventsAttack(zone.equipped);
        const spellbound = isSpellbindingCircleLocked(state, zone);
        const scorpionTurns = zone.ironScorpionDestroyTurn === undefined
          ? null
          : Math.max(0, Math.ceil((zone.ironScorpionDestroyTurn - state.turnNumber) / 2));
        const swordsmanTurns = zone.foreignSwordsmanDestroyTurn === undefined
          ? null
          : Math.max(0, zone.foreignSwordsmanDestroyTurn - state.turnNumber);
        const validEquipTarget = equipTarget && !zone.faceDown && Boolean(equipId && canEquip(equipId, card));
        const showPositionChange = owner === "player" && canChangePosition?.(index);
        return (
          <div className="field-slot" key={`${zone.id}-${index}`}>
            <button
              className={`field-card ${zone.position} field-card-${owner} ${selectedTarget || validEquipTarget || tributeTarget ? "targetable" : ""} ${selectedTributes.includes(index) ? "tribute-selected" : ""}`}
              disabled={tributeTarget ? false : equipTarget ? !validEquipTarget : selectedTarget ? !onTarget : owner === "cpu" || !canAttack || zone.position !== "attack" || zone.attacked || attackLocked || paralyzed || spellbound || cannotPayAttackCost}
              onClick={() => tributeTarget ? onTribute?.(index) : equipTarget ? onEquip?.(index) : selectedTarget ? onTarget?.(index) : onAttack?.(index)}
            >
              <strong>{hidden ? "伏せモンスター" : card.name}</strong>
              <span>{zone.position === "attack" ? `ATK ${effectiveAtk(zone, state, owner)}` : hidden ? "DEF ???" : `DEF ${effectiveDef(zone, state, owner)}`}</span>
              <small className={`position-badge position-${zone.position}`}>{zone.position === "attack" ? "攻撃表示・縦" : "守備表示・横"}</small>
              {!hidden && zone.equipped.length > 0 && <small>装備 ×{zone.equipped.length}</small>}
              {!hidden && card.effect && <small className="field-effect-badge">効果モンスター</small>}
              {!hidden && attackLocked && <small className="field-effect-badge">でんきトカゲ・攻撃不可</small>}
              {!hidden && paralyzed && <small className="field-effect-badge">しびれ薬・攻撃不可</small>}
              {!hidden && spellbound && <small className="field-effect-badge">六芒星の呪縛・攻撃／表示変更不可</small>}
              {!hidden && zone.id === "vol7-dark-elf" && <small className="field-effect-badge">攻撃時1000LP</small>}
              {!hidden && scorpionTurns !== null && <small className="field-effect-badge">鉄のサソリ・あと{scorpionTurns}自ターン</small>}
              {!hidden && swordsmanTurns !== null && <small className="field-effect-badge">異国の剣士・あと{swordsmanTurns}ターン</small>}
              {!hidden && zone.permanentControl && <small className="field-effect-badge">王座の侵略者・コントロール交換中</small>}
              {!hidden && zone.snatchStealControl && <small className="field-effect-badge">強奪・コントロール変更中</small>}
              {!hidden && zone.controlReturn === "cpu" && !zone.permanentControl && <small className="field-effect-badge">心変わり・ターン終了時に戻る</small>}
              {tributeTarget && <small>{selectedTributes.includes(index) ? "生け贄に選択済" : "タップして選択"}</small>}
              {owner === "player" && zone.position === "attack" && <small>{spellbound ? "六芒星の呪縛で攻撃不可" : paralyzed ? "しびれ薬で攻撃不可" : attackLocked ? "次のターンまで攻撃不可" : cannotPayAttackCost ? "LP不足で攻撃不可" : zone.attacked ? "攻撃済" : canAttack ? "攻撃" : "BATTLEで攻撃"}</small>}
            </button>
            {showPositionChange && (
              <button className="position-change" onClick={() => onPositionChange?.(index)}>
                {zone.position === "defense" ? "攻撃表示へ" : "守備表示へ"}
              </button>
            )}
            {!hidden && <button className="field-detail-button" onClick={() => onInspect?.(card.id)}>詳細</button>}
          </div>
        );
      })}
    </div>
  );
}

function runCpuTurn(initial: DuelState): DuelState {
  let state = { ...initial, log: appendLog(initial.log, "CPUが1枚ドロー。") };
  if (state.cpuDeck.length === 0) return { ...state, result: "win" };
  state = {
    ...state,
    cpuHand: [...state.cpuHand, state.cpuDeck[0]],
    cpuDeck: state.cpuDeck.slice(1),
  };
  state = applySnatchStealStandby(state, "cpu");
  state = applyMatangoStandby(state, "cpu");
  state = applyGermInfectionStandby(state, "cpu");
  state = applyPatrolRoboStandby(state, "cpu");
  if (state.result) return state;
  state = useCpuCurseOfFiend(state);
  if (state.pendingFlipTarget || state.pendingMultiTarget || state.pendingDeckReorder || state.pendingDeckSearch) return state;
  state = playCpuNormalSpells(state);
  if (state.result || state.pendingAntiRaigeki || state.pendingSpellSpecificTrap || state.pendingMagicJammer || state.pendingSolemnJudgment || state.pendingFlipTarget) return state;
  return continueCpuTurnAfterSpells(state);
}

function continueCpuTurnAfterSpells(initial: DuelState): DuelState {
  let state = useCpuCannonSoldierForLethal(initial);
  if (state.result) return state;
  const candidates = state.cpuHand
    .map((id, index) => ({ card: cardById.get(id), index }))
    .filter((item): item is { card: Card; index: number } => item.card?.cardType === "monster")
    .sort((a, b) => (b.card.atk ?? 0) - (a.card.atk ?? 0));
  const summonChoice = canPayDuelChainEnergy(state, "cpu") ? candidates.find(({ card }) => {
    const tributes = tributeCount(card);
    return state.cpuField.length >= tributes && state.cpuField.length - tributes < FIELD_LIMIT;
  }) : undefined;
  if (summonChoice) {
    const tributes = tributeCount(summonChoice.card);
    const tributeIndexes = lowestAttackIndexes(state.cpuField, tributes);
    const tributedZones = state.cpuField.filter((_, index) => tributeIndexes.includes(index));
    const nextField = state.cpuField.filter((_, index) => !tributeIndexes.includes(index));
    const defensive = (summonChoice.card.def ?? 0) > (summonChoice.card.atk ?? 0)
      || isDragonCaptureJarLocked(summonChoice.card.kind, false, isDragonCaptureJarActive(state));
    nextField.push({
      id: summonChoice.card.id,
      position: defensive ? "defense" : "attack",
      faceDown: defensive,
      attacked: true,
      equipped: [],
      summonedTurn: state.turnNumber,
      positionChanged: false,
    });
    const paidState = applyChainEnergyPayment(state, "cpu");
    state = {
      ...paidState,
      cpuHand: state.cpuHand.filter((_, index) => index !== summonChoice.index),
      cpuField: nextField,
      cpuSpellTrap: discardEquips(state.cpuSpellTrap, tributedZones),
      cpuGraveyard: [...state.cpuGraveyard, ...graveCards(tributedZones)],
      log: appendLog(
        paidState.log,
        defensive
          ? "CPUがモンスターをセット。"
          : `CPUが${summonChoice.card.name}を召喚。`,
      ),
    };
    if (!defensive) state = applyMysteriousPuppeteerGain(state);
    state = applyDeckSearchTriggers(state, [], tributedZones);
    const hornIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("vol6-horn-heaven");
    if (!defensive && canActivateHornOfHeaven(state.playerField.length, state.playerSpellTrap) && hornIndex >= 0) {
      return {
        ...state,
        pendingHornOfHeaven: {
          trapIndex: hornIndex,
          monsterIndex: state.cpuField.length - 1,
          monsterId: summonChoice.card.id,
        },
        log: appendLog(state.log, `CPUが${summonChoice.card.name}を召喚。昇天の角笛を発動しますか？`),
      };
    }
    const solemnIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("vol6-solemn-judgment");
    if (!defensive && solemnIndex >= 0) {
      return {
        ...state,
        pendingSolemnJudgment: {
          kind: "summon",
          trapIndex: solemnIndex,
          monsterIndex: state.cpuField.length - 1,
          cardId: summonChoice.card.id,
        },
        log: appendLog(state.log, `CPUが${summonChoice.card.name}を召喚。神の宣告を発動しますか？`),
      };
    }
    const trapIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("vol1-trap-hole");
    if (!defensive && (summonChoice.card.atk ?? 0) >= 1000 && trapIndex >= 0) {
      return {
        ...state,
        pendingTrapResponse: {
          trapIndex,
          monsterIndex: state.cpuField.length - 1,
          monsterId: summonChoice.card.id,
        },
        log: state.log,
      };
    }
  }
  return finishCpuTurn(state);
}

type BlastJugglerChoice = { side: Side; index: number; id: string; name: string };

function blastJugglerTargetChoices(state: DuelState, monsterIndex: number): BlastJugglerChoice[] {
  return (["player", "cpu"] as const).flatMap((side) =>
    (side === "player" ? state.playerField : state.cpuField).flatMap((zone, index) => {
      if (side === "player" && index === monsterIndex) return [];
      if (!canBlastJugglerTarget(zone.faceDown, effectiveAtk(zone, state, side))) return [];
      return [{ side, index, id: zone.id, name: cardById.get(zone.id)?.name ?? "モンスター" }];
    }),
  );
}

function openBlastJugglerPrompt(state: DuelState): DuelState {
  const monsterIndex = state.playerField.findIndex((zone, index) =>
    zone.id === "vol5-blast-juggler"
    && !zone.faceDown
    && zone.summonedTurn < state.turnNumber
    && zone.blastPromptedTurn !== state.turnNumber
    && blastJugglerTargetChoices(state, index).length > 0,
  );
  return monsterIndex < 0
    ? { ...state, pendingBlastJuggler: null }
    : { ...state, pendingBlastJuggler: { monsterIndex, selected: [] } };
}

function applyControlChangeLifeTrigger(state: DuelState, monsterId: string, originalOwner: Side, newController: Side): DuelState {
  const effect = controlChangeLifeEffect(monsterId);
  if (!effect) return state;
  let playerLp = state.playerLp;
  let cpuLp = state.cpuLp;
  if (effect.newControllerDamage > 0) {
    if (newController === "player") playerLp = Math.max(0, playerLp - effect.newControllerDamage);
    else cpuLp = Math.max(0, cpuLp - effect.newControllerDamage);
  }
  if (effect.originalOwnerGain > 0) {
    if (originalOwner === "player") playerLp += effect.originalOwnerGain;
    else cpuLp += effect.originalOwnerGain;
  }
  const cardName = cardById.get(monsterId)?.name ?? "モンスター";
  const detail = effect.newControllerDamage > 0
    ? `${newController === "player" ? "あなた" : "CPU"}に${effect.newControllerDamage}ダメージ。`
    : `${originalOwner === "player" ? "あなた" : "CPU"}が${effect.originalOwnerGain}LP回復。`;
  return {
    ...state,
    playerLp,
    cpuLp,
    result: playerLp === 0 ? "lose" : cpuLp === 0 ? "win" : state.result,
    log: appendLog(state.log, `${cardName}のコントロール移動時効果が発動。${detail}`),
  };
}

function hasSpellbindingCircleTarget(state: DuelState, owner: Side) {
  return [...state.playerField, ...state.cpuField].some((zone) => zone.spellbindingCircleOwner === owner);
}

function isSpellbindingCircleLocked(state: DuelState, zone: ZoneCard) {
  const owner = zone.spellbindingCircleOwner;
  if (!owner) return false;
  const spellTrap = owner === "player" ? state.playerSpellTrap : state.cpuSpellTrap;
  const activeTraps = owner === "player" ? state.playerActiveTraps : state.cpuActiveTraps;
  return spellTrap.includes("mr-spellbinding-circle") && activeTraps.includes("mr-spellbinding-circle") && !areTrapEffectsNegated(state);
}

function cleanupSpellbindingCircles(state: DuelState): DuelState {
  let next = state;
  (["player", "cpu"] as const).forEach((owner) => {
    const spellTrapKey = owner === "player" ? "playerSpellTrap" : "cpuSpellTrap";
    const activeTrapKey = owner === "player" ? "playerActiveTraps" : "cpuActiveTraps";
    const graveyardKey = owner === "player" ? "playerGraveyard" : "cpuGraveyard";
    const hasTarget = hasSpellbindingCircleTarget(next, owner);
    const isActive = next[activeTrapKey].includes("mr-spellbinding-circle");
    const remainsOnField = next[spellTrapKey].includes("mr-spellbinding-circle");
    if (hasTarget && isActive && remainsOnField) return;
    if (!hasTarget && !isActive) return;
    const sendOrphanToGrave = !hasTarget && isActive && remainsOnField;
    next = {
      ...next,
      playerField: next.playerField.map((zone) => zone.spellbindingCircleOwner === owner ? { ...zone, spellbindingCircleOwner: undefined } : zone),
      cpuField: next.cpuField.map((zone) => zone.spellbindingCircleOwner === owner ? { ...zone, spellbindingCircleOwner: undefined } : zone),
      [spellTrapKey]: sendOrphanToGrave ? removeCardCopies(next[spellTrapKey], "mr-spellbinding-circle", 1) : next[spellTrapKey],
      [activeTrapKey]: isActive ? removeCardCopies(next[activeTrapKey], "mr-spellbinding-circle", 1) : next[activeTrapKey],
      [graveyardKey]: sendOrphanToGrave ? [...next[graveyardKey], "mr-spellbinding-circle"] : next[graveyardKey],
      log: sendOrphanToGrave ? appendLog(next.log, "対象がいなくなったため六芒星の呪縛を墓地へ送った。") : next.log,
    };
  });
  return next;
}

function cleanupSnatchStealControl(state: DuelState): DuelState {
  let remainingActiveCopies = state.playerSpellTrap.filter((id) => id === "mr-snatch-steal").length;
  const returning: ZoneCard[] = [];
  const staying: ZoneCard[] = [];

  state.playerField.forEach((zone) => {
    if (!zone.snatchStealControl) {
      staying.push(zone);
      return;
    }
    if (zone.equipped.includes("mr-snatch-steal") && remainingActiveCopies > 0) {
      remainingActiveCopies -= 1;
      staying.push(zone);
      return;
    }
    returning.push({
      ...zone,
      equipped: zone.equipped.filter((id) => id !== "mr-snatch-steal"),
      snatchStealControl: undefined,
      snatchReturnSide: undefined,
      attacked: true,
      positionChanged: true,
    });
  });

  if (returning.length === 0) return state;
  let next: DuelState = { ...state, playerField: staying };
  returning.forEach((zone) => {
    const originalOwner = zone.controlReturn ?? "cpu";
    const cleaned = originalOwner === "cpu" && !zone.permanentControl
      ? { ...zone, controlReturn: undefined }
      : zone;
    if (next.cpuField.length < FIELD_LIMIT) {
      next = {
        ...next,
        cpuField: [...next.cpuField, cleaned],
        log: appendLog(next.log, `「強奪」がフィールドを離れたため、${cardById.get(zone.id)?.name ?? "モンスター"}をCPUへ戻した。`),
      };
      next = applyControlChangeLifeTrigger(next, zone.id, originalOwner, "cpu");
    } else {
      const graveyardKey = originalOwner === "player" ? "playerGraveyard" : "cpuGraveyard";
      next = {
        ...next,
        [graveyardKey]: [...next[graveyardKey], zone.id, ...zone.equipped],
        log: appendLog(next.log, `CPUのモンスターゾーンが空いていないため、${cardById.get(zone.id)?.name ?? "モンスター"}を墓地へ送った。`),
      };
    }
  });
  return next;
}

function applySnatchStealStandby(state: DuelState, side: Side): DuelState {
  const activeCount = side === "cpu"
    ? Math.min(
        state.playerSpellTrap.filter((id) => id === "mr-snatch-steal").length,
        state.playerField.filter((zone) => zone.snatchStealControl && zone.equipped.includes("mr-snatch-steal")).length,
      )
    : Math.min(
        state.cpuSpellTrap.filter((id) => id === "mr-snatch-steal").length,
        state.cpuField.filter((zone) => zone.snatchStealControl && zone.equipped.includes("mr-snatch-steal")).length,
      );
  const gain = snatchStealStandbyGain(activeCount);
  if (gain === 0) return state;
  const lifeKey = side === "player" ? "playerLp" : "cpuLp";
  return {
    ...state,
    [lifeKey]: state[lifeKey] + gain,
    log: appendLog(state.log, `「強奪」の効果で${side === "player" ? "プレイヤー" : "CPU"}が${gain}LP回復。`),
  };
}

function switchAllMonsterPositions(field: ZoneCard[], currentTurn: number): ZoneCard[] {
  return field.map((zone) => ({
    ...zone,
    position: curseOfFiendPosition(zone.position),
    faceDown: false,
    faceUpTurn: zone.faceDown ? currentTurn : zone.faceUpTurn,
    positionChanged: true,
  }));
}

function curseOfFiendPositionScore(state: DuelState) {
  const sideGain = (field: ZoneCard[], side: Side) => field.reduce((total, zone) => {
    const current = zone.position === "attack" ? effectiveAtk(zone, state, side) : effectiveDef(zone, state, side);
    const switched = zone.position === "attack" ? effectiveDef(zone, state, side) : effectiveAtk(zone, state, side);
    return total + switched - current;
  }, 0);
  return sideGain(state.cpuField, "cpu") - sideGain(state.playerField, "player");
}

function useCpuCurseOfFiend(state: DuelState): DuelState {
  if (!state.cpuHand.includes("mr-curse-fiend") || curseOfFiendPositionScore(state) <= 0 || !canPayDuelChainEnergy(state, "cpu")) return state;
  const revealed: PendingFlipQueueItem[] = [
    ...state.playerField.filter((zone) => zone.position === "defense" && zone.faceDown).map((zone) => ({ owner: "player" as Side, monsterId: zone.id })),
    ...state.cpuField.filter((zone) => zone.position === "defense" && zone.faceDown).map((zone) => ({ owner: "cpu" as Side, monsterId: zone.id })),
  ];
  const paidState = removeCpuHandCard(state, "mr-curse-fiend");
  let next: DuelState = {
    ...paidState,
    playerField: switchAllMonsterPositions(state.playerField, state.turnNumber),
    cpuField: switchAllMonsterPositions(state.cpuField, state.turnNumber),
    cpuGraveyard: [...state.cpuGraveyard, "mr-curse-fiend"],
    log: appendLog(paidState.log, "CPUがスタンバイフェイズに邪悪な儀式を発動。全モンスターの表示形式を入れ替えた。"),
  };
  next = resolveFlipItems(next, revealed);
  return next;
}

function returnChangedMonsters(state: DuelState): DuelState {
  const returning = state.playerField.filter((zone) => zone.controlReturn === "cpu" && !zone.permanentControl && !zone.snatchStealControl);
  if (returning.length === 0) return state;
  return {
    ...state,
    playerField: state.playerField.filter((zone) => zone.controlReturn !== "cpu" || zone.permanentControl || zone.snatchStealControl),
    cpuField: [...state.cpuField, ...returning.map(({ controlReturn: _controlReturn, permanentControl: _permanentControl, ...zone }) => zone)],
    log: appendLog(state.log, `心変わりの効果が終了。${returning.length}体をCPUフィールドへ戻した。`),
  };
}

function nextPlayerMatangoTransferIndex(state: DuelState) {
  if (!canTransferMatango(state.playerLp, state.cpuField.length, FIELD_LIMIT)) return null;
  const index = state.playerField.findIndex((zone) => zone.id === "vol7-matango"
    && !zone.faceDown
    && zone.matangoOfferedTurn !== state.turnNumber);
  return index >= 0 ? index : null;
}

function returnWormBeastAtEndPhase(state: DuelState, side: Side): DuelState {
  const fieldKey = side === "player" ? "playerField" : "cpuField";
  const handKey = side === "player" ? "playerHand" : "cpuHand";
  const graveyardKey = side === "player" ? "playerGraveyard" : "cpuGraveyard";
  const returning = state[fieldKey].filter((zone) => wormBeastReturns(zone.id, zone.faceDown, zone.summonedTurn, state.turnNumber));
  if (returning.length === 0) return state;
  return {
    ...state,
    [fieldKey]: state[fieldKey].filter((zone) => !wormBeastReturns(zone.id, zone.faceDown, zone.summonedTurn, state.turnNumber)),
    [handKey]: [...state[handKey], ...returning.map((zone) => zone.id)],
    [graveyardKey]: [...state[graveyardKey], ...returning.flatMap((zone) => zone.equipped)],
    log: appendLog(state.log, `邪悪なるワーム・ビースト${returning.length}体がエンドフェイズに手札へ戻った。`),
  };
}

function applyMatangoStandby(state: DuelState, side: Side): DuelState {
  const field = side === "player" ? state.playerField : state.cpuField;
  const damage = matangoStandbyDamage(field.filter((zone) => !zone.faceDown).map((zone) => zone.id));
  if (damage === 0) return state;
  const lifeKey = side === "player" ? "playerLp" : "cpuLp";
  const lifePoints = Math.max(0, state[lifeKey] - damage);
  return {
    ...state,
    [lifeKey]: lifePoints,
    result: lifePoints === 0 ? side === "player" ? "lose" : "win" : state.result,
    log: appendLog(state.log, `${side === "player" ? "プレイヤー" : "CPU"}のスタンバイフェイズ。マタンゴの効果で${damage}ダメージ。`),
  };
}

function applyGermInfectionStandby(state: DuelState, side: Side): DuelState {
  const fieldKey = side === "player" ? "playerField" : "cpuField";
  const affected = state[fieldKey].filter((zone) => zone.equipped.includes("vol7-germ-infection") || zone.equipped.includes("bo7-doping")).length;
  if (affected === 0) return state;
  return {
    ...state,
    [fieldKey]: state[fieldKey].map((zone) => zone.equipped.includes("vol7-germ-infection") || zone.equipped.includes("bo7-doping")
      ? { ...zone, germStandbys: (zone.germStandbys ?? 0) + 1 }
      : zone),
    log: appendLog(state.log, `${side === "player" ? "プレイヤー" : "CPU"}の装備カードの継続効果を${affected}体に適用。`),
  };
}

function applyPatrolRoboStandby(state: DuelState, side: Side): DuelState {
  const ownField = side === "player" ? state.playerField : state.cpuField;
  const opponentField = side === "player" ? state.cpuField : state.playerField;
  const opponentSpellTrap = side === "player" ? state.cpuSpellTrap : state.playerSpellTrap;
  const activeTraps = side === "player" ? state.cpuActiveTraps : state.playerActiveTraps;
  const faceUpIds = new Set([...activeTraps, ...opponentField.flatMap((zone) => zone.equipped)]);
  const setCard = opponentSpellTrap.find((id) => !faceUpIds.has(id));
  if (!setCard || !patrolRoboCanInspect(ownField.filter((zone) => !zone.faceDown).map((zone) => zone.id), opponentSpellTrap.length)) return state;
  const cardName = cardById.get(setCard)?.name ?? "カード";
  return {
    ...state,
    log: appendLog(
      state.log,
      side === "player"
        ? `パトロール・ロボの効果で、CPUのセットカード「${cardName}」を確認。`
        : "CPUのパトロール・ロボが、あなたのセットカード1枚を確認。",
    ),
  };
}

function transferCpuMatangos(initial: DuelState): DuelState {
  let state = initial;
  while (canTransferMatango(state.cpuLp, state.playerField.length, FIELD_LIMIT)) {
    const index = state.cpuField.findIndex((zone) => zone.id === "vol7-matango" && !zone.faceDown);
    if (index < 0) break;
    const target = state.cpuField[index];
    state = {
      ...state,
      cpuLp: state.cpuLp - 500,
      cpuField: state.cpuField.filter((_, fieldIndex) => fieldIndex !== index),
      playerField: [...state.playerField, { ...target, attacked: true, positionChanged: true }],
      log: appendLog(state.log, "CPUがマタンゴの効果で500LPを払い、プレイヤーへコントロールを移した。"),
    };
  }
  return state;
}

function clearSwappedStats(state: DuelState): DuelState {
  const clear = ({ statsSwappedTurn: _statsSwappedTurn, ...zone }: ZoneCard): ZoneCard => zone;
  return {
    ...state,
    playerField: state.playerField.map(clear),
    cpuField: state.cpuField.map(clear),
  };
}

function applyMysteriousPuppeteerGain(state: DuelState): DuelState {
  const playerGain = mysteriousPuppeteerLifeGain(
    state.playerField.filter((zone) => !zone.faceDown).map((zone) => zone.id),
  );
  const cpuGain = mysteriousPuppeteerLifeGain(
    state.cpuField.filter((zone) => !zone.faceDown).map((zone) => zone.id),
  );
  if (playerGain + cpuGain === 0) return state;
  return {
    ...state,
    playerLp: state.playerLp + playerGain,
    cpuLp: state.cpuLp + cpuGain,
    log: appendLog(
      state.log,
      `謎の傀儡師の効果が発動。${playerGain ? `あなたは${playerGain}LP回復。` : ""}${cpuGain ? `CPUは${cpuGain}LP回復。` : ""}`,
    ),
  };
}

function resolveIronScorpionEndPhase(state: DuelState): DuelState {
  const isDue = (zone: ZoneCard) => isIronScorpionDestructionDue(zone.ironScorpionDestroyTurn, state.turnNumber)
    || zone.foreignSwordsmanDestroyTurn === state.turnNumber;
  const destroyedOnPlayerField = state.playerField.filter(isDue);
  const destroyedCpu = state.cpuField.filter(isDue);
  if (destroyedOnPlayerField.length + destroyedCpu.length === 0) return state;
  const returnedCpu = destroyedOnPlayerField.filter((zone) => zone.controlReturn === "cpu");
  const destroyedPlayer = destroyedOnPlayerField.filter((zone) => zone.controlReturn !== "cpu");
  let next: DuelState = {
    ...state,
    playerField: state.playerField.filter((zone) => !isDue(zone)),
    cpuField: state.cpuField.filter((zone) => !isDue(zone)),
    playerSpellTrap: discardEquips(state.playerSpellTrap, destroyedPlayer),
    cpuSpellTrap: discardEquips(state.cpuSpellTrap, [...destroyedCpu, ...returnedCpu]),
    playerGraveyard: [...state.playerGraveyard, ...graveCards(destroyedPlayer)],
    cpuGraveyard: [...state.cpuGraveyard, ...graveCards(destroyedCpu), ...graveCards(returnedCpu)],
    log: appendLog(state.log, `遅延破壊効果でモンスター${destroyedOnPlayerField.length + destroyedCpu.length}体を破壊。`),
  };
  next = applyDeckSearchTriggers(next, destroyedPlayer, [...destroyedCpu, ...returnedCpu]);
  return next;
}

function finishCpuTurn(initial: DuelState, resumeBattle = false): DuelState {
  let state: DuelState = { ...initial, pendingTrapResponse: null };
  if (!resumeBattle) {
    state = useCpuBarrelDragon(state);
    if (state.result || state.pendingDeckSearch) return state;
    state = setCpuTrapAndEquips(state);
    state = {
      ...state,
      cpuField: state.cpuField.map((zone) => ({ ...zone, attacked: false })),
    };
    const justDessertsIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("bo5-just-desserts");
    if (justDessertsIndex >= 0 && state.cpuField.length > 0) {
      return {
        ...state,
        pendingJustDesserts: { trapIndex: justDessertsIndex },
        log: appendLog(state.log, `CPUのバトル前。自業自得で${justDessertsDamage(state.cpuField.length)}ダメージを与えられます。`),
      };
    }
    if (canActivateTwoProngedAttack(state.playerField.length, state.cpuField.length, state.playerSpellTrap)) {
      return {
        ...state,
        pendingTwoPronged: {
          trapIndex: state.playerSpellTrap.indexOf("stb-two-pronged-attack"),
          selectedPlayer: [],
          selectedCpu: null,
        },
        log: appendLog(state.log, "CPUのバトル前。はさみ撃ちを発動しますか？"),
      };
    }
  }
  state = { ...state, phase: "battle" };
  if (state.playerSwordsTurns.length > 0) {
    state = { ...state, log: appendLog(state.log, "光の護封剣によりCPUは攻撃できません。") };
  } else {
    for (let index = state.cpuField.length - 1; index >= 0 && state.phase === "battle" && !state.result && !state.pendingFlipTarget && !state.pendingMultiTarget && !state.pendingDeckReorder && !state.pendingDeckSearch && !state.pendingGuardianResponse && !state.pendingMirrorForce && !state.pendingReverseTrap && !state.pendingBattleStatTrap && !state.pendingKuribohResponse && !state.pendingWabokuResponse; index -= 1) {
      const attacker = state.cpuField[index];
      if (attacker.position !== "attack" || attacker.attacked || paralyzingPotionPreventsAttack(attacker.equipped) || isSpellbindingCircleLocked(state, attacker) || !canDeclareAttackOnTurn(attacker.attackLockedTurn, state.turnNumber)) continue;
      if (duelAttackPayment(state, "cpu", attacker.id) === null) continue;
      if (state.playerField.length === 0) {
        const mirrorForceIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("vol7-mirror-force");
        if (mirrorForceIndex >= 0) {
          state = {
            ...state,
            pendingMirrorForce: { trapIndex: mirrorForceIndex, attackerIndex: index, defenderIndex: null },
            log: appendLog(state.log, `CPUが${cardById.get(attacker.id)?.name ?? "モンスター"}で直接攻撃を宣言。ミラーフォースを発動しますか？`),
          };
          continue;
        }
        const kuribohPrompt = prepareKuribohResponse(state, index, null);
        state = kuribohPrompt ?? resolveBattle(state, "cpu", index, null);
        continue;
      }
      const targetIndex = bestCpuBattleTargetIndex(
        effectiveAtk(attacker, state, "cpu"),
        state.playerField.map((zone) => ({
          position: zone.position,
          faceDown: zone.faceDown,
          atk: effectiveAtk(zone, state, "player"),
          def: effectiveDef(zone, state, "player"),
        })),
      );
      if (targetIndex !== null) {
        const defender = state.playerField[targetIndex];
        const mirrorForceIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("vol7-mirror-force");
        if (mirrorForceIndex >= 0) {
          state = {
            ...state,
            pendingMirrorForce: { trapIndex: mirrorForceIndex, attackerIndex: index, defenderIndex: targetIndex },
            log: appendLog(state.log, `CPUが${cardById.get(attacker.id)?.name ?? "モンスター"}で攻撃を宣言。ミラーフォースを発動しますか？`),
          };
          continue;
        }
        const reverseTrapPrompt = prepareReverseTrap(state, index, targetIndex);
        if (reverseTrapPrompt) {
          state = reverseTrapPrompt;
          continue;
        }
        const statTrapPrompt = prepareBattleStatTrap(state, index, targetIndex);
        if (statTrapPrompt) {
          state = statTrapPrompt;
          continue;
        }
        if (!defender.faceDown && isGuardianMonster(defender.id) && !defender.guardianEffectUsed) {
          state = {
            ...state,
            pendingGuardianResponse: {
              attackerIndex: index,
              defenderIndex: targetIndex,
              guardianId: defender.id,
            },
          };
          continue;
        }
        const kuribohPrompt = prepareKuribohResponse(state, index, targetIndex);
        state = kuribohPrompt ?? resolveBattle(state, "cpu", index, targetIndex);
      }
    }
  }
  if (state.result || state.pendingFlipTarget || state.pendingMultiTarget || state.pendingDeckReorder || state.pendingDeckSearch || state.pendingGuardianResponse || state.pendingMirrorForce || state.pendingReverseTrap || state.pendingBattleStatTrap || state.pendingKuribohResponse || state.pendingWabokuResponse) return state;
  if (state.cpuExtraBattles > 0) {
    return finishCpuTurn({
      ...state,
      cpuExtraBattles: state.cpuExtraBattles - 1,
      cpuField: state.cpuField.map((zone) => ({ ...zone, attacked: false })),
      log: appendLog(state.log, "ウェザー・レポートの効果で、CPUが2回目のバトルフェイズを開始。"),
    }, true);
  }

  state = resolveIronScorpionEndPhase(state);
  state = returnWormBeastAtEndPhase(state, "cpu");
  state = transferCpuMatangos(state);
  state = cleanupSpellbindingCircles(state);
  state = cleanupSnatchStealControl(state);
  state = clearSwappedStats(state);

  const swords = advanceSwordsTurns(state.playerSwordsTurns);
  if (swords.expired > 0) {
    state = {
      ...state,
      playerSwordsTurns: swords.remaining,
      playerSpellTrap: removeCardCopies(state.playerSpellTrap, "vol2-swords-revealing-light", swords.expired),
      playerGraveyard: [
        ...state.playerGraveyard,
        ...Array(swords.expired).fill("vol2-swords-revealing-light"),
      ],
      log: appendLog(state.log, "光の護封剣の効果が終了しました。"),
    };
  } else if (state.playerSwordsTurns.length > 0) {
    state = { ...state, playerSwordsTurns: swords.remaining };
  }

  if (state.playerDeck.length === 0) {
    return { ...state, result: "lose", log: appendLog(state.log, "デッキからカードを引けず敗北。") };
  }
  let playerStart: DuelState = {
    ...state,
    playerHand: [...state.playerHand, state.playerDeck[0]],
    playerDeck: state.playerDeck.slice(1),
    playerField: state.playerField.map((zone) => ({ ...zone, attacked: false, positionChanged: false })),
    turn: "player",
    turnNumber: state.turnNumber + 1,
    phase: "standby",
    normalSummoned: false,
    log: appendLog(state.log, "あなたのターン。1枚ドロー。"),
  };
  playerStart = applySnatchStealStandby(playerStart, "player");
  playerStart = applyMatangoStandby(playerStart, "player");
  playerStart = applyGermInfectionStandby(playerStart, "player");
  playerStart = applyPatrolRoboStandby(playerStart, "player");
  if (playerStart.result) return playerStart;
  return openBlastJugglerPrompt(playerStart);
}

function cpuFieldSpellChoice(state: DuelState) {
  const fieldSpellIds = state.cpuHand.filter((id) => FIELD_SPELL_IDS.includes(id) && id !== state.cpuFieldSpell);
  const cpuKinds = [
    ...state.cpuField.filter((zone) => !zone.faceDown).map((zone) => cardById.get(zone.id)?.kind ?? ""),
    ...state.cpuHand
      .map((id) => cardById.get(id))
      .filter((card) => card?.cardType === "monster")
      .map((card) => card?.kind ?? ""),
  ];
  const opponentKinds = state.playerField
    .filter((zone) => !zone.faceDown)
    .map((zone) => cardById.get(zone.id)?.kind ?? "");
  return bestCpuFieldSpell(fieldSpellIds, cpuKinds, opponentKinds);
}

function playCpuFieldSpell(initial: DuelState): DuelState {
  if (!canPayDuelChainEnergy(initial, "cpu")) return initial;
  const fieldSpellId = cpuFieldSpellChoice(initial);
  if (!fieldSpellId) return initial;
  const oldFieldSpell = initial.cpuFieldSpell;
  const paidState = removeCpuHandCard(initial, fieldSpellId);
  return {
    ...paidState,
    cpuFieldSpell: fieldSpellId,
    cpuGraveyard: oldFieldSpell ? [...initial.cpuGraveyard, oldFieldSpell] : initial.cpuGraveyard,
    log: appendLog(paidState.log, `CPUが${cardById.get(fieldSpellId)?.name ?? "フィールド魔法"}を発動。`),
  };
}

function cpuFusionPlan(state: DuelState) {
  const spellId = state.cpuHand.includes("stb-polymerization")
    ? "stb-polymerization"
    : state.cpuHand.includes("vol6-polymerization") ? "vol6-polymerization" : null;
  if (!spellId) return null;
  const handWithoutSpell = removeCardCopies(state.cpuHand, spellId, 1);
  const materialIds = [...handWithoutSpell, ...state.cpuField.map((zone) => zone.id)];
  const viableFusionIds = fusionChoices(state.cpuFusionDeck, materialIds).filter((fusionId) => {
    const recipe = fusionRecipe(fusionId);
    if (!recipe) return false;
    const selectedMaterials = fusionMaterialSelection(recipe, materialIds);
    if (!selectedMaterials) return false;
    const remainingHand = [...handWithoutSpell];
    let fieldMaterials = 0;
    for (const materialId of selectedMaterials) {
      const handIndex = remainingHand.indexOf(materialId);
      if (handIndex >= 0) remainingHand.splice(handIndex, 1);
      else fieldMaterials += 1;
    }
    const fusionAttack = cardById.get(fusionId)?.atk ?? 0;
    const strongestMaterial = Math.max(...recipe.map((id) => cardById.get(id)?.atk ?? 0));
    return state.cpuField.length - fieldMaterials < FIELD_LIMIT && fusionAttack > strongestMaterial;
  });
  const attackById = Object.fromEntries(viableFusionIds.map((id) => [id, cardById.get(id)?.atk ?? 0]));
  const fusionId = bestFusionChoice(viableFusionIds, materialIds, attackById);
  return fusionId ? { spellId, fusionId } : null;
}

function playCpuFusion(initial: DuelState): DuelState {
  if (!canPayDuelChainEnergy(initial, "cpu")) return initial;
  const plan = cpuFusionPlan(initial);
  if (!plan) return initial;
  const recipe = fusionRecipe(plan.fusionId);
  if (!recipe) return initial;
  let cpuHand = removeCardCopies(initial.cpuHand, plan.spellId, 1);
  let cpuField = [...initial.cpuField];
  const selectedMaterials = fusionMaterialSelection(recipe, [...cpuHand, ...cpuField.map((zone) => zone.id)]);
  if (!selectedMaterials) return initial;
  const fieldMaterials: ZoneCard[] = [];
  const handMaterials: string[] = [];
  for (const materialId of selectedMaterials) {
    const handIndex = cpuHand.indexOf(materialId);
    if (handIndex >= 0) {
      cpuHand.splice(handIndex, 1);
      handMaterials.push(materialId);
      continue;
    }
    const fieldIndex = cpuField.findIndex((zone) => zone.id === materialId);
    if (fieldIndex < 0) return initial;
    fieldMaterials.push(cpuField[fieldIndex]);
    cpuField.splice(fieldIndex, 1);
  }
  const fusion = cardById.get(plan.fusionId);
  cpuField.push({
    id: plan.fusionId,
    position: "attack",
    faceDown: false,
    attacked: false,
    equipped: [],
    summonedTurn: initial.turnNumber,
    positionChanged: false,
  });
  const paidState = applyChainEnergyPayment(initial, "cpu");
  let next: DuelState = {
    ...paidState,
    cpuHand,
    cpuField,
    cpuFusionDeck: removeCardCopies(initial.cpuFusionDeck, plan.fusionId, 1),
    cpuSpellTrap: discardEquips(initial.cpuSpellTrap, fieldMaterials),
    cpuGraveyard: [...initial.cpuGraveyard, plan.spellId, ...handMaterials, ...graveCards(fieldMaterials)],
    log: appendLog(paidState.log, `CPUが「融合」を発動。${fusion?.name ?? "融合モンスター"}を融合召喚。`),
  };
  next = applyDeckSearchTriggers(next, [], fieldMaterials);
  return next;
}

function firstCpuPlayableSpell(state: DuelState): string | null {
  if (state.cpuHand.includes("mr-mystical-space-typhoon") && (state.playerSpellTrap.length > 0 || state.playerFieldSpell)) return "mr-mystical-space-typhoon";
  if (state.cpuHand.includes("stb-remove-trap") && firstFaceUpTrapIndex(state.playerSpellTrap) !== null) return "stb-remove-trap";
  if (state.cpuHand.includes("vol2-de-spell") && (firstSpellTargetIndex(state.playerSpellTrap.map(fieldCardType)) !== null || state.playerFieldSpell)) return "vol2-de-spell";
  if (state.cpuHand.includes("stb-raigeki") && state.playerField.length > 0) return "stb-raigeki";
  if (state.cpuHand.includes("vol1-dark-hole")
    && state.playerField.length > 0
    && fieldPower(state.playerField, state, "player") > fieldPower(state.cpuField, state, "cpu")) return "vol1-dark-hole";
  if (state.cpuHand.includes("bo7-heavy-storm") && shouldCpuUseHeavyStorm(
    state.cpuSpellTrap.length, state.playerSpellTrap.length, Boolean(state.cpuFieldSpell), Boolean(state.playerFieldSpell),
  )) return "bo7-heavy-storm";
  if (state.cpuHand.includes("vol1-fissure") && lowestFaceUpAttackIndex(state.playerField, state, "player") !== null) return "vol1-fissure";
  if (state.cpuHand.includes("vol2-swords-revealing-light")
    && shouldCpuActivateSwords(state.playerField.length, state.cpuSwordsTurns.length, state.cpuSpellTrap.length, FIELD_LIMIT)) return "vol2-swords-revealing-light";
  if (state.cpuHand.includes("vol2-monster-reborn")
    && state.cpuField.length < FIELD_LIMIT
    && !isMonsterRebornBlocked(state.playerSpellTrap, state.cpuSpellTrap)
    && [...state.cpuGraveyard, ...state.playerGraveyard].some((id) => cardById.get(id)?.cardType === "monster" && !cardById.get(id)?.fusion)) return "vol2-monster-reborn";
  if (state.cpuHand.includes("vol3-pot-of-greed") && state.cpuDeck.length >= 2) return "vol3-pot-of-greed";
  if (state.cpuHand.includes("mr-upstart-goblin") && state.cpuDeck.length >= 1) return "mr-upstart-goblin";
  if (state.cpuHand.includes("mr-confiscation") && state.cpuLp > 1000 && state.playerHand.length > 0) return "mr-confiscation";
  if (state.cpuHand.includes("mr-forceful-sentry") && state.playerHand.length > 0) return "mr-forceful-sentry";
  if (state.cpuHand.includes("vol3-stop-defense") && state.playerField.some((zone) => zone.position === "defense"
    && !isDragonCaptureJarLocked(cardById.get(zone.id)?.kind, zone.faceDown, isDragonCaptureJarActive(state)))) return "vol3-stop-defense";
  if (state.cpuHand.includes("vol3-gravedigger-ghoul") && state.playerGraveyard.some((id) => cardById.get(id)?.cardType === "monster")) return "vol3-gravedigger-ghoul";
  const raceDestructionSpell = state.cpuHand.find((id) => shouldCpuUseRaceDestructionSpell(
    id,
    state.cpuField.filter((zone) => !zone.faceDown).map((zone) => cardById.get(zone.id)?.kind ?? ""),
    state.playerField.filter((zone) => !zone.faceDown).map((zone) => cardById.get(zone.id)?.kind ?? ""),
  ));
  if (raceDestructionSpell) return raceDestructionSpell;
  const fieldSpellId = cpuFieldSpellChoice(state);
  if (fieldSpellId) return fieldSpellId;
  const fusionPlan = cpuFusionPlan(state);
  if (fusionPlan) return fusionPlan.spellId;
  return state.cpuHand.find((id) => simpleSpellEffect(id) && shouldCpuUseSimpleSpell(id, state.cpuLp, STARTING_LP)) ?? null;
}

function resolveCpuMonsterRebornEffect(state: DuelState): DuelState {
  if (state.cpuField.length >= FIELD_LIMIT || isMonsterRebornBlocked(state.playerSpellTrap, state.cpuSpellTrap)) return state;
  const revivalCandidates = [
    ...state.cpuGraveyard.map((id, index) => ({ id, index, side: "cpu" as const })),
    ...state.playerGraveyard.map((id, index) => ({ id, index, side: "player" as const })),
  ].filter(({ id }) => {
    const card = cardById.get(id);
    return card?.cardType === "monster" && !card.fusion;
  });
  const choiceIndex = strongestAttackIndex(revivalCandidates.map(({ id }) => cardById.get(id)?.atk ?? 0));
  const choice = choiceIndex === null ? null : revivalCandidates[choiceIndex];
  const graveyard = choice?.side === "cpu" ? state.cpuGraveyard : state.playerGraveyard;
  const taken = choice ? takeGraveyardCard(graveyard, choice.index) : null;
  const monster = taken ? cardById.get(taken.cardId) : null;
  if (!choice || !taken || monster?.cardType !== "monster") return state;
  const position: Position = (monster.def ?? 0) > (monster.atk ?? 0)
    || isDragonCaptureJarLocked(monster.kind, false, isDragonCaptureJarActive(state)) ? "defense" : "attack";
  return {
    ...state,
    cpuField: [...state.cpuField, {
      id: taken.cardId,
      position,
      faceDown: false,
      attacked: false,
      equipped: [],
      summonedTurn: state.turnNumber,
      positionChanged: false,
      revivedByMonsterReborn: true,
    }],
    cpuGraveyard: choice.side === "cpu" ? taken.remaining : state.cpuGraveyard,
    playerGraveyard: choice.side === "player" ? taken.remaining : state.playerGraveyard,
    log: appendLog(state.log, `死者蘇生の効果でCPUが${monster.name}を特殊召喚。`),
  };
}

function playCpuNormalSpells(initial: DuelState, skipMagicJammerPrompt = false): DuelState {
  let state = initial;
  if (!canPayDuelChainEnergy(state, "cpu")) return state;
  const magicJammerIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("vol6-magic-jammer");
  const pendingSpellId = firstCpuPlayableSpell(state);
  if (!skipMagicJammerPrompt && magicJammerIndex >= 0 && canActivateMagicJammer(state.playerHand.length, state.playerSpellTrap) && pendingSpellId) {
    return {
      ...state,
      pendingMagicJammer: { trapIndex: magicJammerIndex, spellId: pendingSpellId },
      log: appendLog(state.log, `CPUが${cardById.get(pendingSpellId)?.name ?? "魔法カード"}を発動。マジック・ジャマーを発動しますか？`),
    };
  }
  const solemnIndex = areTrapEffectsNegated(state) ? -1 : state.playerSpellTrap.indexOf("vol6-solemn-judgment");
  if (!skipMagicJammerPrompt && solemnIndex >= 0 && pendingSpellId) {
    return {
      ...state,
      pendingSolemnJudgment: { kind: "spell", trapIndex: solemnIndex, cardId: pendingSpellId },
      log: appendLog(state.log, `CPUが${cardById.get(pendingSpellId)?.name ?? "魔法カード"}を発動。神の宣告を発動しますか？`),
    };
  }

  if (state.cpuHand.includes("mr-mystical-space-typhoon") && (state.playerSpellTrap.length > 0 || state.playerFieldSpell) && canPayDuelChainEnergy(state, "cpu")) {
    if (state.playerSpellTrap.length > 0) {
      const targetIndex = state.playerSpellTrap.length - 1;
      const targetId = state.playerSpellTrap[targetIndex];
      const swordsIndex = targetId === "vol2-swords-revealing-light"
        ? state.playerSpellTrap.slice(0, targetIndex + 1).filter((id) => id === targetId).length - 1
        : -1;
      state = {
        ...removeCpuHandCard(state, "mr-mystical-space-typhoon"),
        playerField: removeEquippedCard(state.playerField, targetId),
        playerSpellTrap: state.playerSpellTrap.filter((_, index) => index !== targetIndex),
        playerActiveTraps: state.playerActiveTraps.filter((id) => id !== targetId),
        playerSwordsTurns: swordsIndex >= 0 ? state.playerSwordsTurns.filter((_, index) => index !== swordsIndex) : state.playerSwordsTurns,
        playerGraveyard: [...state.playerGraveyard, targetId],
        cpuGraveyard: [...state.cpuGraveyard, "mr-mystical-space-typhoon"],
        log: appendLog(state.log, `CPUがサイクロンを発動。${cardById.get(targetId)?.name ?? "魔法・罠カード"}を破壊。`),
      };
    } else if (state.playerFieldSpell) {
      const targetId = state.playerFieldSpell;
      state = {
        ...removeCpuHandCard(state, "mr-mystical-space-typhoon"),
        playerFieldSpell: null,
        playerGraveyard: [...state.playerGraveyard, targetId],
        cpuGraveyard: [...state.cpuGraveyard, "mr-mystical-space-typhoon"],
        log: appendLog(state.log, `CPUがサイクロンを発動。${cardById.get(targetId)?.name ?? "フィールド魔法"}を破壊。`),
      };
    }
  }
  const deSpellTarget = firstSpellTargetIndex(
    state.playerSpellTrap.map(fieldCardType),
  );
  const removeTrapTarget = firstFaceUpTrapIndex(state.playerSpellTrap);
  if (state.cpuHand.includes("stb-remove-trap") && removeTrapTarget !== null && canPayDuelChainEnergy(state, "cpu")) {
    const targetId = state.playerSpellTrap[removeTrapTarget];
    state = {
      ...removeCpuHandCard(state, "stb-remove-trap"),
      playerSpellTrap: state.playerSpellTrap.filter((_, index) => index !== removeTrapTarget),
      playerGraveyard: [...state.playerGraveyard, targetId],
      cpuGraveyard: [...state.cpuGraveyard, "stb-remove-trap"],
      log: appendLog(state.log, `CPUが罠はずしを発動。${cardById.get(targetId)?.name ?? "表側罠"}を破壊。`),
    };
  }
  if (state.cpuHand.includes("vol2-de-spell") && (deSpellTarget !== null || state.playerFieldSpell) && canPayDuelChainEnergy(state, "cpu")) {
    if (deSpellTarget === null && state.playerFieldSpell) {
      const targetId = state.playerFieldSpell;
      state = {
        ...removeCpuHandCard(state, "vol2-de-spell"),
        playerFieldSpell: null,
        playerGraveyard: [...state.playerGraveyard, targetId],
        cpuGraveyard: [...state.cpuGraveyard, "vol2-de-spell"],
        log: appendLog(state.log, `CPUが魔法除去を発動。${cardById.get(targetId)?.name ?? "フィールド魔法"}を破壊。`),
      };
    } else if (deSpellTarget !== null) {
    const targetId = state.playerSpellTrap[deSpellTarget];
    const target = cardById.get(targetId);
    const swordsIndex = targetId === "vol2-swords-revealing-light"
      ? state.playerSpellTrap.slice(0, deSpellTarget + 1).filter((id) => id === targetId).length - 1
      : -1;
    state = {
      ...removeCpuHandCard(state, "vol2-de-spell"),
      playerField: removeEquippedCard(state.playerField, targetId),
      playerSpellTrap: state.playerSpellTrap.filter((_, index) => index !== deSpellTarget),
      playerSwordsTurns: swordsIndex >= 0
        ? state.playerSwordsTurns.filter((_, index) => index !== swordsIndex)
        : state.playerSwordsTurns,
      playerGraveyard: [...state.playerGraveyard, targetId],
      cpuGraveyard: [...state.cpuGraveyard, "vol2-de-spell"],
      log: appendLog(state.log, `CPUが魔法除去を発動。${target?.name ?? "魔法カード"}を破壊。`),
    };
    }
  }

  if (state.cpuHand.includes("stb-raigeki") && state.playerField.length > 0 && canPayDuelChainEnergy(state, "cpu")) {
    const activated: DuelState = {
      ...removeCpuHandCard(state, "stb-raigeki"),
      cpuGraveyard: [...state.cpuGraveyard, "stb-raigeki"],
      log: appendLog(state.log, "CPUがサンダー・ボルトを発動。"),
    };
    if (canRespondWithAntiRaigeki(activated.playerSpellTrap, "stb-raigeki")) {
      return {
        ...activated,
        pendingAntiRaigeki: { trapIndex: activated.playerSpellTrap.indexOf("vol5-anti-raigeki") },
      };
    }
    const destroyedPlayer = activated.playerField;
    state = {
      ...activated,
      playerSpellTrap: discardEquips(activated.playerSpellTrap, activated.playerField),
      playerGraveyard: [...activated.playerGraveyard, ...graveCards(activated.playerField)],
      playerField: [],
      log: appendLog(activated.log, "サンダー・ボルトでプレイヤーのモンスターをすべて破壊。"),
    };
    state = applyDeckSearchTriggers(state, destroyedPlayer);
  }

  if (
    state.cpuHand.includes("vol1-dark-hole")
    && state.playerField.length > 0
    && canPayDuelChainEnergy(state, "cpu")
    && fieldPower(state.playerField, state, "player") > fieldPower(state.cpuField, state, "cpu")
  ) {
    const activated = {
      ...removeCpuHandCard(state, "vol1-dark-hole"),
      cpuGraveyard: [...state.cpuGraveyard, "vol1-dark-hole"],
      log: appendLog(state.log, "CPUがブラック・ホールを発動。"),
    };
    const whiteHoleId = spellSpecificTrapResponse(activated.playerSpellTrap, "vol1-dark-hole");
    const whiteHoleIndex = whiteHoleId ? activated.playerSpellTrap.indexOf(whiteHoleId) : -1;
    if (whiteHoleId === "bo4-white-hole" && whiteHoleIndex >= 0 && !areTrapEffectsNegated(activated)) return {
      ...activated,
      pendingSpellSpecificTrap: { trapIndex: whiteHoleIndex, trapId: "bo4-white-hole", spellId: "vol1-dark-hole" },
    };
    const destroyedPlayer = activated.playerField;
    const destroyedCpu = activated.cpuField;
    state = {
      ...activated,
      playerSpellTrap: discardEquips(activated.playerSpellTrap, activated.playerField),
      cpuSpellTrap: discardEquips(activated.cpuSpellTrap, activated.cpuField),
      playerGraveyard: [...activated.playerGraveyard, ...graveCards(activated.playerField)],
      cpuGraveyard: [...activated.cpuGraveyard, ...graveCards(activated.cpuField)],
      playerField: [],
      cpuField: [],
      log: appendLog(activated.log, "ブラック・ホールですべてのモンスターを破壊。"),
    };
    state = applyDeckSearchTriggers(state, destroyedPlayer, destroyedCpu);
  }

  if (state.cpuHand.includes("bo7-heavy-storm") && shouldCpuUseHeavyStorm(
    state.cpuSpellTrap.length, state.playerSpellTrap.length, Boolean(state.cpuFieldSpell), Boolean(state.playerFieldSpell),
  ) && canPayDuelChainEnergy(state, "cpu")) {
    const playerCards = [...state.playerSpellTrap, ...(state.playerFieldSpell ? [state.playerFieldSpell] : [])];
    const cpuCards = [...state.cpuSpellTrap, ...(state.cpuFieldSpell ? [state.cpuFieldSpell] : [])];
    state = {
      ...removeCpuHandCard(state, "bo7-heavy-storm"),
      playerField: state.playerField.map((zone) => ({ ...zone, equipped: [] })),
      cpuField: state.cpuField.map((zone) => ({ ...zone, equipped: [] })),
      playerSpellTrap: [],
      cpuSpellTrap: [],
      playerFieldSpell: null,
      cpuFieldSpell: null,
      playerSwordsTurns: [],
      cpuSwordsTurns: [],
      playerGraveyard: [...state.playerGraveyard, ...playerCards],
      cpuGraveyard: [...state.cpuGraveyard, "bo7-heavy-storm", ...cpuCards],
      log: appendLog(state.log, `CPUが大嵐を発動。フィールドの魔法・罠カード${playerCards.length + cpuCards.length}枚をすべて破壊。`),
    };
  }

  const raceDestructionSpell = state.cpuHand.find((id) => shouldCpuUseRaceDestructionSpell(
    id,
    state.cpuField.filter((zone) => !zone.faceDown).map((zone) => cardById.get(zone.id)?.kind ?? ""),
    state.playerField.filter((zone) => !zone.faceDown).map((zone) => cardById.get(zone.id)?.kind ?? ""),
  ));
  const destructionKind = raceDestructionSpell ? raceDestructionKind(raceDestructionSpell) : null;
  if (raceDestructionSpell && destructionKind && canPayDuelChainEnergy(state, "cpu")) {
    const matches = (zone: ZoneCard) => isRaceDestructionTarget(raceDestructionSpell, cardById.get(zone.id)?.kind ?? "", zone.faceDown);
    const destroyedPlayer = state.playerField.filter(matches);
    const destroyedCpu = state.cpuField.filter(matches);
    state = {
      ...removeCpuHandCard(state, raceDestructionSpell),
      playerField: state.playerField.filter((zone) => !matches(zone)),
      cpuField: state.cpuField.filter((zone) => !matches(zone)),
      playerSpellTrap: discardEquips(state.playerSpellTrap, destroyedPlayer),
      cpuSpellTrap: discardEquips(state.cpuSpellTrap, destroyedCpu),
      playerGraveyard: [...state.playerGraveyard, ...graveCards(destroyedPlayer)],
      cpuGraveyard: [...state.cpuGraveyard, raceDestructionSpell, ...graveCards(destroyedCpu)],
      log: appendLog(state.log, `CPUが${cardById.get(raceDestructionSpell)?.name ?? "種族破壊魔法"}を発動。表側表示の${destructionKind}をすべて破壊。`),
    };
    state = applyDeckSearchTriggers(state, destroyedPlayer, destroyedCpu);
  }

  const fissureTarget = lowestFaceUpAttackIndex(state.playerField, state, "player");
  if (state.cpuHand.includes("vol1-fissure") && fissureTarget !== null && canPayDuelChainEnergy(state, "cpu")) {
    const destroyed = state.playerField[fissureTarget];
    state = {
      ...removeCpuHandCard(state, "vol1-fissure"),
      playerField: state.playerField.filter((_, index) => index !== fissureTarget),
      playerSpellTrap: discardEquips(state.playerSpellTrap, [destroyed]),
      playerGraveyard: [...state.playerGraveyard, ...graveCards([destroyed])],
      cpuGraveyard: [...state.cpuGraveyard, "vol1-fissure"],
      log: appendLog(state.log, "CPUが地割れを発動。モンスター1体を破壊。"),
    };
    state = applyDeckSearchTriggers(state, [destroyed]);
  }

  if (
    state.cpuHand.includes("vol2-swords-revealing-light")
    && canPayDuelChainEnergy(state, "cpu")
    && shouldCpuActivateSwords(
      state.playerField.length,
      state.cpuSwordsTurns.length,
      state.cpuSpellTrap.length,
      FIELD_LIMIT,
    )
  ) {
    const faceDownZones = state.playerField.filter((zone) => zone.faceDown);
    state = {
      ...removeCpuHandCard(state, "vol2-swords-revealing-light"),
      playerField: state.playerField.map((zone) => ({ ...zone, faceDown: false, faceUpTurn: zone.faceDown ? state.turnNumber : zone.faceUpTurn })),
      cpuSpellTrap: [...state.cpuSpellTrap, "vol2-swords-revealing-light"],
      cpuSwordsTurns: [...state.cpuSwordsTurns, 3],
      log: appendLog(state.log, "CPUが光の護封剣を発動。3ターン攻撃を封じます。"),
    };
    state = resolveFlipSequence(state, "player", faceDownZones.map((zone) => zone.id));
    if (state.pendingFlipTarget) return state;
  }

  if (state.cpuHand.includes("vol2-monster-reborn") && state.cpuField.length < FIELD_LIMIT && !isMonsterRebornBlocked(state.playerSpellTrap, state.cpuSpellTrap) && canPayDuelChainEnergy(state, "cpu")) {
    const activated = {
      ...removeCpuHandCard(state, "vol2-monster-reborn"),
      cpuGraveyard: [...state.cpuGraveyard, "vol2-monster-reborn"],
      log: appendLog(state.log, "CPUが死者蘇生を発動。"),
    };
    const callGraveId = spellSpecificTrapResponse(activated.playerSpellTrap, "vol2-monster-reborn");
    const callGraveIndex = callGraveId ? activated.playerSpellTrap.indexOf(callGraveId) : -1;
    if (callGraveId === "bo4-call-grave" && callGraveIndex >= 0 && !areTrapEffectsNegated(activated)) return {
      ...activated,
      pendingSpellSpecificTrap: { trapIndex: callGraveIndex, trapId: "bo4-call-grave", spellId: "vol2-monster-reborn" },
    };
    state = resolveCpuMonsterRebornEffect(activated);
  }

  while (state.cpuHand.includes("vol3-pot-of-greed") && state.cpuDeck.length >= 2) {
    if (!canPayDuelChainEnergy(state, "cpu")) break;
    const paidState = removeCpuHandCard(state, "vol3-pot-of-greed");
    state = {
      ...paidState,
      cpuHand: [...paidState.cpuHand, ...state.cpuDeck.slice(0, 2)],
      cpuDeck: state.cpuDeck.slice(2),
      cpuGraveyard: [...state.cpuGraveyard, "vol3-pot-of-greed"],
      log: appendLog(paidState.log, "CPUが強欲な壺を発動。カードを2枚ドロー。"),
    };
  }

  while (state.cpuHand.includes("mr-upstart-goblin") && state.cpuDeck.length >= 1) {
    if (!canPayDuelChainEnergy(state, "cpu")) break;
    const paidState = removeCpuHandCard(state, "mr-upstart-goblin");
    const resolved = resolveUpstartGoblin(paidState.cpuHand, state.cpuDeck, state.playerLp);
    if (!resolved) break;
    state = {
      ...paidState,
      cpuHand: resolved.hand,
      cpuDeck: resolved.deck,
      playerLp: resolved.opponentLp,
      cpuGraveyard: [...state.cpuGraveyard, "mr-upstart-goblin"],
      log: appendLog(paidState.log, "CPUが成金ゴブリンを発動。1枚ドローし、プレイヤーは1000LP回復。"),
    };
  }
  if (state.cpuHand.includes("mr-confiscation") && state.cpuLp > 1000 + duelChainEnergyCost(state) && state.playerHand.length > 0) {
    const targetIndex = strongestHandCardIndex(state.playerHand);
    const result = resolveHandDisruption("discard", state.playerHand, state.playerDeck, targetIndex);
    if (result) {
      const paidState = removeCpuHandCard(state, "mr-confiscation");
      state = {
        ...paidState,
        cpuLp: paidState.cpuLp - 1000,
        playerHand: result.hand,
        playerGraveyard: [...state.playerGraveyard, result.affected],
        cpuGraveyard: [...state.cpuGraveyard, "mr-confiscation"],
        log: appendLog(paidState.log, `CPUが押収を発動。1000LPを払い、${cardById.get(result.affected)?.name ?? "カード"}を捨てた。`),
      };
      state = applyOpponentDiscardTriggers(state, "player", [result.affected]);
    }
  }
  if (state.cpuHand.includes("mr-forceful-sentry") && state.playerHand.length > 0 && canPayDuelChainEnergy(state, "cpu")) {
    const targetIndex = strongestHandCardIndex(state.playerHand);
    const result = resolveHandDisruption("return-deck", state.playerHand, state.playerDeck, targetIndex);
    if (result) {
      state = {
        ...removeCpuHandCard(state, "mr-forceful-sentry"),
        playerHand: result.hand,
        playerDeck: result.deck,
        cpuGraveyard: [...state.cpuGraveyard, "mr-forceful-sentry"],
        log: appendLog(state.log, `CPUが強引な番兵を発動。${cardById.get(result.affected)?.name ?? "カード"}をデッキに戻した。`),
      };
    }
  }

  if (state.cpuHand.includes("vol3-stop-defense") && canPayDuelChainEnergy(state, "cpu")) {
    const targetIndex = state.playerField.findIndex((zone) => zone.position === "defense"
      && !isDragonCaptureJarLocked(cardById.get(zone.id)?.kind, zone.faceDown, isDragonCaptureJarActive(state)));
    if (targetIndex >= 0) {
      const target = state.playerField[targetIndex];
      state = {
        ...removeCpuHandCard(state, "vol3-stop-defense"),
        playerField: state.playerField.map((zone, index) => index === targetIndex
          ? { ...zone, position: "attack", faceDown: false, faceUpTurn: zone.faceDown ? state.turnNumber : zone.faceUpTurn, positionChanged: true }
          : zone),
        cpuGraveyard: [...state.cpuGraveyard, "vol3-stop-defense"],
        log: appendLog(state.log, "CPUが『守備』封じを発動。守備モンスターを攻撃表示に変更。"),
      };
      if (target.faceDown) state = resolveFlipEffect(state, "player", target.id);
    }
  }

  if (state.cpuHand.includes("vol3-gravedigger-ghoul") && canPayDuelChainEnergy(state, "cpu")) {
    const targets = state.playerGraveyard
      .map((id, index) => ({ id, index }))
      .filter(({ id }) => cardById.get(id)?.cardType === "monster")
      .slice(0, 2)
      .map(({ index }) => index);
    if (targets.length > 0) {
      state = {
        ...removeCpuHandCard(state, "vol3-gravedigger-ghoul"),
        playerGraveyard: state.playerGraveyard.filter((_, index) => !targets.includes(index)),
        cpuGraveyard: [...state.cpuGraveyard, "vol3-gravedigger-ghoul"],
        log: appendLog(state.log, `CPUが墓掘りグールを発動。墓地のモンスター${targets.length}体を除外。`),
      };
    }
  }

  state = playCpuFieldSpell(state);
  state = playCpuFusion(state);

  for (const spellId of [...state.cpuHand]) {
    const effect = simpleSpellEffect(spellId);
    if (!effect || !shouldCpuUseSimpleSpell(spellId, state.cpuLp, STARTING_LP)) continue;
    if (!canPayDuelChainEnergy(state, "cpu")) break;
    const spell = cardById.get(spellId);
    const paidState = removeCpuHandCard(state, spellId);
    const resolution = resolveSimpleSpellLife(spellId, paidState.cpuLp, paidState.playerLp);
    if (!resolution) continue;
    state = {
      ...paidState,
      cpuLp: resolution.ownLp,
      playerLp: resolution.opponentLp,
      result: resolution.outcome === "own-win" ? "lose" : resolution.outcome === "own-lose" ? "win" : resolution.outcome,
      cpuGraveyard: [...state.cpuGraveyard, spellId],
      log: appendLog(
        paidState.log,
        effect.gain
          ? `CPUが${spell?.name ?? "回復魔法"}を発動。LPを${effect.gain}回復。`
          : `CPUが${spell?.name ?? "ダメージ魔法"}を発動。相手に${effect.damage}ダメージ${effect.selfDamage ? `、自分に${effect.selfDamage}ダメージ。` : "。"}`,
      ),
    };
    if (state.result) break;
  }
  return state;
}

function setCpuTrapAndEquips(initial: DuelState): DuelState {
  let state = initial;
  if (state.cpuSpellTrap.length >= FIELD_LIMIT) return state;

  if (state.cpuHand.includes("vol7-mirror-force") && canPayDuelChainEnergy(state, "cpu")) {
    state = {
      ...removeCpuHandCard(state, "vol7-mirror-force"),
      cpuSpellTrap: [...state.cpuSpellTrap, "vol7-mirror-force"],
      log: appendLog(state.log, "CPUが罠カードを1枚セット。"),
    };
  }

  if (state.cpuSpellTrap.length < FIELD_LIMIT && state.cpuHand.includes("vol7-robbin-goblin") && canPayDuelChainEnergy(state, "cpu")) {
    state = {
      ...removeCpuHandCard(state, "vol7-robbin-goblin"),
      cpuSpellTrap: [...state.cpuSpellTrap, "vol7-robbin-goblin"],
      log: appendLog(state.log, "CPUが永続罠カードを1枚セット。"),
    };
  }

  if (state.cpuSpellTrap.length < FIELD_LIMIT && state.cpuHand.includes("vol1-trap-hole") && canPayDuelChainEnergy(state, "cpu")) {
    state = {
      ...removeCpuHandCard(state, "vol1-trap-hole"),
      cpuSpellTrap: [...state.cpuSpellTrap, "vol1-trap-hole"],
      log: appendLog(state.log, "CPUが罠カードを1枚セット。"),
    };
  }

  while (state.cpuSpellTrap.length < FIELD_LIMIT && canPayDuelChainEnergy(state, "cpu")) {
    const choice = state.cpuHand
      .map((id) => cardById.get(id))
      .find((card) =>
        Boolean(card && EQUIP_RULES[card.id] && state.cpuField.some((zone) => {
          const monster = cardById.get(zone.id);
          return !zone.faceDown && Boolean(monster && canEquip(card.id, monster));
        })),
      );
    if (!choice) break;
    const targetIndex = state.cpuField.findIndex((zone) => {
      const monster = cardById.get(zone.id);
      return !zone.faceDown && Boolean(monster && canEquip(choice.id, monster));
    });
    const target = cardById.get(state.cpuField[targetIndex].id);
    state = {
      ...removeCpuHandCard(state, choice.id),
      cpuField: state.cpuField.map((zone, index) =>
        index === targetIndex ? { ...zone, equipped: [...zone.equipped, choice.id] } : zone,
      ),
      cpuSpellTrap: [...state.cpuSpellTrap, choice.id],
      log: appendLog(state.log, `CPUが${choice.name}を${target?.name ?? "モンスター"}に装備。`),
    };
  }
  return state;
}

function projectedCpuBattleDamage(state: DuelState, attackerIndex: number, defenderIndex: number | null, guardianEffect = false) {
  const attackerZone = state.cpuField[attackerIndex];
  if (!attackerZone) return 0;
  const attacker = cardById.get(attackerZone.id);
  const defenderZone = defenderIndex === null ? null : state.playerField[defenderIndex];
  const defender = defenderZone ? cardById.get(defenderZone.id) : null;
  const attackValue = guardianAdjustedAttack(
    effectiveAtk(attackerZone, state, "cpu") + battleAttackBonus(attackerZone.id, defender?.attribute),
    guardianEffect,
  );
  if (!defenderZone) return attackValue;
  const defenseValue = defenderZone.position === "attack"
    ? effectiveAtk(defenderZone, state, "player")
    : battleDefenseValue(defenderZone.id, effectiveDef(defenderZone, state, "player"), attacker?.attribute);
  return battleOutcome(attackValue, defenseValue, defenderZone.position).defenderDamage;
}

function prepareKuribohResponse(state: DuelState, attackerIndex: number, defenderIndex: number | null, guardianEffect = false): DuelState | null {
  const wabokuIndex = areTrapEffectsNegated(state) || state.playerWabokuTurn === state.turnNumber
    ? -1
    : state.playerSpellTrap.indexOf("ex-040");
  if (wabokuIndex >= 0) {
    return {
      ...state,
      pendingWabokuResponse: { trapIndex: wabokuIndex, attackerIndex, defenderIndex, guardianEffect },
      log: appendLog(state.log, "CPUが攻撃を宣言。和睦の使者を発動しますか？"),
    };
  }
  return prepareKuribohOnlyResponse(state, attackerIndex, defenderIndex, guardianEffect);
}

function prepareKuribohOnlyResponse(state: DuelState, attackerIndex: number, defenderIndex: number | null, guardianEffect = false): DuelState | null {
  const damage = projectedCpuBattleDamage(state, attackerIndex, defenderIndex, guardianEffect);
  if (!canUseKuriboh(state.playerHand, "cpu", damage)) return null;
  return {
    ...state,
    pendingKuribohResponse: { attackerIndex, defenderIndex, guardianEffect },
    log: appendLog(state.log, `CPUの攻撃で${damage}の戦闘ダメージを受けます。クリボーを使いますか？`),
  };
}

function prepareBattleStatTrap(state: DuelState, attackerIndex: number, defenderIndex: number | null): DuelState | null {
  if (defenderIndex === null) return null;
  const defender = state.playerField[defenderIndex];
  if (!defender || defender.faceDown) return null;
  const trapId = defender.position === "attack" ? "bo3-reinforcements" : "bo3-castle-walls";
  const trapIndex = state.playerSpellTrap.indexOf(trapId);
  if (trapIndex < 0) return null;
  return {
    ...state,
    pendingBattleStatTrap: { trapIndex, trapId, attackerIndex, defenderIndex },
    log: appendLog(state.log, `CPUが${cardById.get(defender.id)?.name ?? "モンスター"}を攻撃。${cardById.get(trapId)?.name}を発動しますか？`),
  };
}

function baseBattleStats(zone: ZoneCard, state: DuelState) {
  const card = cardById.get(zone.id);
  const original = hourglassOriginalStats(
    zone.id,
    card?.atk ?? 0,
    card?.def ?? 0,
    zone.faceUpTurn ?? zone.summonedTurn,
    state.turnNumber,
  );
  return swappedMonsterStats(original.atk, original.def, zone.statsSwappedTurn === state.turnNumber);
}

function prepareReverseTrap(state: DuelState, attackerIndex: number, defenderIndex: number | null): DuelState | null {
  if (defenderIndex === null || state.reverseTrapTurn === state.turnNumber || state.reverseTrapDeclinedTurn === state.turnNumber) return null;
  const trapIndex = state.playerSpellTrap.indexOf("bo3-reverse-trap");
  const attacker = state.cpuField[attackerIndex];
  const defender = state.playerField[defenderIndex];
  if (trapIndex < 0 || !attacker || !defender || defender.faceDown) return null;
  const attackerBase = baseBattleStats(attacker, state);
  const defenderBase = baseBattleStats(defender, state);
  const attackerChanged = effectiveAtk(attacker, state, "cpu") !== attackerBase.atk;
  const defenderChanged = defender.position === "attack"
    ? effectiveAtk(defender, state, "player") !== defenderBase.atk
    : effectiveDef(defender, state, "player") !== defenderBase.def;
  if (!attackerChanged && !defenderChanged) return null;
  return {
    ...state,
    pendingReverseTrap: { trapIndex, attackerIndex, defenderIndex },
    log: appendLog(state.log, "能力値が変化したモンスター同士の戦闘です。あまのじゃくの呪いを発動しますか？"),
  };
}

function duelAttackPayment(state: DuelState, side: Side, monsterId: string) {
  const ownLp = side === "player" ? state.playerLp : state.cpuLp;
  const ownDeck = side === "player" ? state.playerDeck : state.cpuDeck;
  const opponentSpellTraps = side === "player" ? state.cpuSpellTrap : state.playerSpellTrap;
  return attackDeclarationPayment(
    monsterId,
    ownLp,
    ownDeck.length,
    [...state.playerSpellTrap, ...state.cpuSpellTrap],
    opponentSpellTraps,
  );
}

function resolveBattle(state: DuelState, attackerSide: Side, attackerIndex: number, defenderIndex: number | null, guardianEffect = false, preventPlayerBattleDamage = false): DuelState {
  const attackerFieldKey = attackerSide === "player" ? "playerField" : "cpuField";
  const defenderFieldKey = attackerSide === "player" ? "cpuField" : "playerField";
  const attackerLpKey = attackerSide === "player" ? "playerLp" : "cpuLp";
  const defenderLpKey = attackerSide === "player" ? "cpuLp" : "playerLp";
  const attackerField = state[attackerFieldKey].map((zone) => ({ ...zone }));
  const defenderField = state[defenderFieldKey].map((zone) => ({ ...zone }));
  const attackerZone = attackerField[attackerIndex];
  const attacker = cardById.get(attackerZone.id);
  if (!attacker) return state;
  const payment = duelAttackPayment(state, attackerSide, attacker.id);
  if (!payment) return state;
  let attackerLpAfterCost = state[attackerLpKey] - payment.lifeCost;
  const attackerDeckKey = attackerSide === "player" ? "playerDeck" : "cpuDeck";
  const attackerGraveyardKey = attackerSide === "player" ? "playerGraveyard" : "cpuGraveyard";
  const milled = state[attackerDeckKey].slice(0, payment.millCount);
  let attackLog = payment.lifeCost > 0 || payment.millCount > 0
    ? appendLog(state.log, `攻撃宣言のコストとして${payment.lifeCost > 0 ? `${payment.lifeCost}LP` : ""}${payment.lifeCost > 0 && payment.millCount > 0 ? "と" : ""}${payment.millCount > 0 ? `デッキ上${payment.millCount}枚` : ""}を支払った。`)
    : state.log;
  state = {
    ...state,
    [attackerDeckKey]: state[attackerDeckKey].slice(payment.millCount),
    [attackerGraveyardKey]: [...state[attackerGraveyardKey], ...milled],
  };
  if (attacker.id === "bo7-giant-spider") {
    const matched = Math.random() < 0.5;
    const lifeAfterCoin = giantSpiderAttackLife(attacker.id, attackerLpAfterCost, matched);
    attackLog = appendLog(
      attackLog,
      matched
        ? "地雷蜘蛛のコイントスに成功。LPを失わず攻撃を続行。"
        : `地雷蜘蛛のコイントスに失敗。LPが${attackerLpAfterCost}から${lifeAfterCoin}になった。`,
    );
    attackerLpAfterCost = lifeAfterCoin;
  }
  attackerZone.attacked = true;

  if (defenderIndex === null || !defenderField[defenderIndex]) {
    const damage = effectiveAtk(attackerZone, state, attackerSide);
    const appliedDamage = attackerSide === "cpu" && (preventPlayerBattleDamage || state.playerWabokuTurn === state.turnNumber) ? 0 : damage;
    let next = { ...state, [attackerFieldKey]: attackerField, [attackerLpKey]: attackerLpAfterCost, [defenderLpKey]: state[defenderLpKey] - appliedDamage } as DuelState;
    next.log = appendLog(attackLog, `${attacker.name}の直接攻撃。${appliedDamage}ダメージ。`);
    if (appliedDamage > 0 && next[defenderLpKey] > 0) next = resolveBattleDamageEffect(next, attackerSide, attacker.id, appliedDamage);
    if (next[defenderLpKey] <= 0) next.result = attackerSide === "player" ? "win" : "lose";
    return next;
  }

  const defenderZone = defenderField[defenderIndex];
  const wasFaceDown = defenderZone.faceDown;
  defenderZone.faceDown = false;
  if (wasFaceDown) defenderZone.faceUpTurn = state.turnNumber;
  const defender = cardById.get(defenderZone.id);
  if (!defender) return state;
  const attackLockedTurn = electricLizardAttackLockTurn(defender.id, attacker.kind, state.turnNumber);
  if (attackLockedTurn !== null) attackerZone.attackLockedTurn = attackLockedTurn;
  const scorpionDestroyTurn = ironScorpionDestroyTurn(defender.id, attacker.kind, state.turnNumber);
  if (scorpionDestroyTurn !== null) {
    attackerZone.ironScorpionDestroyTurn = Math.min(attackerZone.ironScorpionDestroyTurn ?? scorpionDestroyTurn, scorpionDestroyTurn);
  }
  if (guardianEffect) defenderZone.guardianEffectUsed = true;
  const defenderSide: Side = attackerSide === "player" ? "cpu" : "player";
  const attackValue = guardianAdjustedAttack(
    effectiveAtk(attackerZone, state, attackerSide) + battleAttackBonus(attacker.id, defender.attribute),
    guardianEffect,
  );
  const defenseValue = defenderZone.position === "attack"
    ? effectiveAtk(defenderZone, state, defenderSide)
    : battleDefenseValue(defender.id, effectiveDef(defenderZone, state, defenderSide), attacker.attribute);
  const { attackerDestroyed, defenderDestroyed, attackerDamage, defenderDamage } =
    battleOutcome(attackValue, defenseValue, defenderZone.position);
  const wabokuProtectsPlayer = attackerSide === "cpu" && state.playerWabokuTurn === state.turnNumber;
  const appliedDefenderDamage = attackerSide === "cpu" && (preventPlayerBattleDamage || wabokuProtectsPlayer) ? 0 : defenderDamage;
  const spiderDestroyed = mechanicalSpiderDestroys(attacker.id, defender.attribute);
  const resolvedDefenderDestroyed = spiderDestroyed || (!wabokuProtectsPlayer && defenderDestroyed);
  const swordsmanTurn = foreignSwordsmanDestroyTurn(attacker.id, state.turnNumber);
  if (swordsmanTurn !== null && !resolvedDefenderDestroyed) {
    defenderZone.foreignSwordsmanDestroyTurn = Math.min(
      defenderZone.foreignSwordsmanDestroyTurn ?? swordsmanTurn,
      swordsmanTurn,
    );
  }
  const removal = battleRemovalOutcome(attacker.id, defender.id, attackerDestroyed, resolvedDefenderDestroyed);
  const dimensionalBanish = removal.banishBoth;
  const phantomReturn = phantomWallReturnsAttacker(defender.id, removal.removeAttacker);
  const unhappyMaidenDestroyed = endsBattlePhaseOnBattleDestruction(attacker.id, attackerDestroyed)
    || endsBattlePhaseOnBattleDestruction(defender.id, resolvedDefenderDestroyed);

  const nextAttackerField = removal.removeAttacker || phantomReturn ? attackerField.filter((_, index) => index !== attackerIndex) : attackerField;
  const nextDefenderField = removal.removeDefender ? defenderField.filter((_, index) => index !== defenderIndex) : defenderField;
  const attackerLpName = attackerSide === "player" ? "プレイヤー" : "CPU";
  const defenderLpName = attackerSide === "player" ? "CPU" : "プレイヤー";
  const destroyedWithSide = [
    ...(removal.graveAttacker ? [{ zone: attackerZone, side: attackerSide }] : []),
    ...(removal.graveDefender ? [{ zone: defenderZone, side: defenderSide }] : []),
  ];
  const banishedWithSide = dimensionalBanish
    ? [{ zone: attackerZone, side: attackerSide }, { zone: defenderZone, side: defenderSide }]
    : [];
  const destroyedPlayerZones = destroyedWithSide.filter(({ zone, side }) => (zone.controlReturn ?? side) === "player").map(({ zone }) => zone);
  const destroyedCpuZones = destroyedWithSide.filter(({ zone, side }) => (zone.controlReturn ?? side) === "cpu").map(({ zone }) => zone);
  const banishedPlayerZones = banishedWithSide.filter(({ zone, side }) => (zone.controlReturn ?? side) === "player").map(({ zone }) => zone);
  const banishedCpuZones = banishedWithSide.filter(({ zone, side }) => (zone.controlReturn ?? side) === "cpu").map(({ zone }) => zone);
  const cpuOwnedSnatchEquips = [...destroyedCpuZones, ...banishedCpuZones]
    .flatMap((zone) => zone.equipped.filter((id) => id === "mr-snatch-steal"));
  let next = {
    ...state,
    [attackerFieldKey]: nextAttackerField,
    [defenderFieldKey]: nextDefenderField,
    [attackerLpKey]: attackerLpAfterCost - attackerDamage,
    [defenderLpKey]: state[defenderLpKey] - appliedDefenderDamage,
    playerSpellTrap: discardEquips(state.playerSpellTrap, [...destroyedPlayerZones, ...banishedPlayerZones, ...destroyedCpuZones, ...banishedCpuZones]),
    cpuSpellTrap: discardEquips(state.cpuSpellTrap, [...destroyedCpuZones, ...banishedCpuZones]),
    playerGraveyard: [...state.playerGraveyard, ...graveCards(destroyedPlayerZones), ...equipGraveCards(banishedPlayerZones), ...cpuOwnedSnatchEquips],
    cpuGraveyard: [
      ...state.cpuGraveyard,
      ...graveCards(destroyedCpuZones).filter((id) => id !== "mr-snatch-steal"),
      ...equipGraveCards(banishedCpuZones).filter((id) => id !== "mr-snatch-steal"),
    ],
    log: appendLog(
      attackLog,
      `${attacker.name}が${defender.name}を攻撃。${
        dimensionalBanish
          ? `${attackerDamage ? `${attackerLpName}に${attackerDamage}ダメージ。` : appliedDefenderDamage ? `${defenderLpName}に${appliedDefenderDamage}ダメージ。` : ""}`
          : attackerDestroyed && resolvedDefenderDestroyed
          ? "両方を破壊。"
          : resolvedDefenderDestroyed
            ? `${defender.name}を破壊。${appliedDefenderDamage ? `${defenderLpName}に${appliedDefenderDamage}ダメージ。` : ""}`
            : attackerDestroyed
              ? `${attacker.name}を破壊。${attackerDamage ? `${attackerLpName}に${attackerDamage}ダメージ。` : ""}`
              : `モンスターは破壊されない。${attackerDamage ? `${attackerLpName}に${attackerDamage}ダメージ。` : ""}`
      }`,
    ),
  } as DuelState;
  if (dimensionalBanish) {
    next.log = appendLog(next.log, `異次元の戦士の効果が発動。${attacker.name}と${defender.name}をゲームから除外。`);
  }
  if (phantomReturn) {
    const attackerOwner = attackerZone.controlReturn ?? attackerSide;
    next = {
      ...next,
      playerHand: attackerOwner === "player" ? [...next.playerHand, attacker.id] : next.playerHand,
      cpuHand: attackerOwner === "cpu" ? [...next.cpuHand, attacker.id] : next.cpuHand,
      playerSpellTrap: attackerOwner === "player" ? discardEquips(next.playerSpellTrap, [attackerZone]) : next.playerSpellTrap,
      cpuSpellTrap: attackerOwner === "cpu" ? discardEquips(next.cpuSpellTrap, [attackerZone]) : next.cpuSpellTrap,
      playerGraveyard: attackerOwner === "player" ? [...next.playerGraveyard, ...equipGraveCards([attackerZone])] : next.playerGraveyard,
      cpuGraveyard: attackerOwner === "cpu" ? [...next.cpuGraveyard, ...equipGraveCards([attackerZone])] : next.cpuGraveyard,
      log: appendLog(next.log, `幻影の壁の効果が発動。${attacker.name}を持ち主の手札へ戻した。`),
    };
  }
  if (attackLockedTurn !== null) {
    next.log = appendLog(next.log, `でんきトカゲの効果が発動。${attacker.name}は次の自分ターンに攻撃できない。`);
  }
  if (scorpionDestroyTurn !== null) {
    next.log = appendLog(next.log, `鉄のサソリの効果が発動。${attacker.name}は攻撃側の3ターン目終了時に破壊される。`);
  }
  if (spiderDestroyed && !defenderDestroyed) {
    next.log = appendLog(next.log, `カラクリ蜘蛛の効果が発動。闇属性の${defender.name}を破壊。`);
  }
  if (swordsmanTurn !== null && !resolvedDefenderDestroyed) {
    next.log = appendLog(next.log, `異国の剣士の効果が発動。${defender.name}は5ターン後に破壊される。`);
  }
  if (unhappyMaidenDestroyed) {
    next = {
      ...next,
      phase: "main2",
      log: appendLog(next.log, "薄幸の美少女の効果が発動。バトルフェイズを終了。"),
    };
  }
  next = applyDeckSearchTriggers(next, destroyedPlayerZones, destroyedCpuZones);
  if (appliedDefenderDamage > 0 && next[defenderLpKey] > 0) {
    next = resolveBattleDamageEffect(next, attackerSide, attacker.id, appliedDefenderDamage);
  }
  if (wasFaceDown) next = resolveFlipEffect(next, attackerSide === "player" ? "cpu" : "player", defender.id);
  if (next.cpuLp <= 0) next.result = "win";
  if (next.playerLp <= 0) next.result = "lose";
  return next;
}

function resolveBattleDamageEffect(state: DuelState, attackerSide: Side, attackerId: string, damage: number): DuelState {
  if (damage <= 0) return state;
  const effect = battleDamageEffect(attackerId);
  const attackerName = cardById.get(attackerId)?.name ?? "モンスター";
  let next = state;
  if (effect === "discard-random") {
    next = discardRandomHandCard(next, attackerSide === "player" ? "cpu" : "player", attackerName);
  } else if (effect === "draw") {
    const deck = attackerSide === "player" ? next.playerDeck : next.cpuDeck;
    if (deck.length === 0) {
      return { ...next, result: attackerSide === "player" ? "lose" : "win", log: appendLog(next.log, `${attackerName}の効果でドローできず敗北。`) };
    }
    next = attackerSide === "player"
      ? { ...next, playerDeck: deck.slice(1), playerHand: [...next.playerHand, deck[0]], log: appendLog(next.log, `${attackerName}の効果でカードを1枚ドロー。`) }
      : { ...next, cpuDeck: deck.slice(1), cpuHand: [...next.cpuHand, deck[0]], log: appendLog(next.log, `${attackerName}の効果でCPUがカードを1枚ドロー。`) };
  } else if (effect === "opponent-draw-two") {
    const opponentSide: Side = attackerSide === "player" ? "cpu" : "player";
    const deck = opponentSide === "player" ? next.playerDeck : next.cpuDeck;
    if (deck.length < 2) {
      return {
        ...next,
        result: opponentSide === "player" ? "lose" : "win",
        log: appendLog(next.log, `${attackerName}の効果で2枚ドローできず${opponentSide === "player" ? "あなた" : "CPU"}の敗北。`),
      };
    }
    next = opponentSide === "player"
      ? { ...next, playerDeck: deck.slice(2), playerHand: [...next.playerHand, ...deck.slice(0, 2)], log: appendLog(next.log, `${attackerName}の効果であなたはカードを2枚ドロー。`) }
      : { ...next, cpuDeck: deck.slice(2), cpuHand: [...next.cpuHand, ...deck.slice(0, 2)], log: appendLog(next.log, `${attackerName}の効果でCPUはカードを2枚ドロー。`) };
  }
  if (attackerSide === "player" && !areTrapEffectsNegated(next) && robbinGoblinCanTrigger(next.playerSpellTrap, next.cpuHand.length)) {
    if (next.playerActiveTraps.includes("vol7-robbin-goblin")) return discardRandomHandCard(next, "cpu", "追い剥ぎゴブリン");
    return { ...next, pendingRobbinGoblin: { trapIndex: next.playerSpellTrap.indexOf("vol7-robbin-goblin") }, log: appendLog(next.log, "戦闘ダメージを与えた。追い剥ぎゴブリンを発動しますか？") };
  }
  if (attackerSide === "cpu" && !areTrapEffectsNegated(next) && robbinGoblinCanTrigger(next.cpuSpellTrap, next.playerHand.length)) {
    const activated = next.cpuActiveTraps.includes("vol7-robbin-goblin")
      ? next
      : { ...next, cpuActiveTraps: [...next.cpuActiveTraps, "vol7-robbin-goblin"], log: appendLog(next.log, "CPUが追い剥ぎゴブリンを発動。") };
    return discardRandomHandCard(activated, "player", "CPUの追い剥ぎゴブリン");
  }
  return next;
}

function areTrapEffectsNegated(state: DuelState): boolean {
  return royalDecreeNegatesTraps(state.playerActiveTraps, state.cpuActiveTraps);
}

function isEffectTargetProtected(state: DuelState, side: Side, zone: ZoneCard): boolean {
  const faceUpLordCount = [...state.playerField, ...state.cpuField]
    .filter((candidate) => candidate.id === "ex-084" && !candidate.faceDown).length;
  return dragonTargetProtected(cardById.get(zone.id)?.kind ?? "", zone.faceDown, faceUpLordCount);
}

function discardRandomHandCard(state: DuelState, side: Side, sourceName: string): DuelState {
  const hand = side === "player" ? state.playerHand : state.cpuHand;
  if (hand.length === 0) return state;
  const index = Math.floor(Math.random() * hand.length);
  const discardedId = hand[index];
  const discardedName = cardById.get(discardedId)?.name ?? "カード";
  let next = side === "player"
    ? { ...state, playerHand: hand.filter((_, handIndex) => handIndex !== index), playerGraveyard: [...state.playerGraveyard, discardedId], log: appendLog(state.log, `${sourceName}の効果で手札から${discardedName}を捨てた。`) }
    : { ...state, cpuHand: hand.filter((_, handIndex) => handIndex !== index), cpuGraveyard: [...state.cpuGraveyard, discardedId], log: appendLog(state.log, `${sourceName}の効果でCPUの手札から${discardedName}を捨てた。`) };
  if (areTrapEffectsNegated(next)) return next;
  const thornDamage = magicThornDamage(1, side === "cpu" ? next.playerActiveTraps : next.cpuActiveTraps);
  if (thornDamage === 0) return next;
  const lifeKey = side === "cpu" ? "cpuLp" : "playerLp";
  const result = Math.max(0, next[lifeKey] - thornDamage);
  next = {
    ...next,
    [lifeKey]: result,
    result: result === 0 ? (side === "cpu" ? "win" : "lose") : next.result,
    log: appendLog(next.log, `魔力の棘の効果で${side === "cpu" ? "CPU" : "プレイヤー"}に${thornDamage}ダメージ。`),
  };
  return next;
}

type FlipTargetChoice = {
  id: string;
  index: number;
  zone: string;
  name: string;
};

function flipTargetChoices(state: DuelState, pending: PendingFlipTarget): FlipTargetChoice[] {
  if (pending.effect === "destroy-monster" || pending.effect === "return-monster" || pending.effect === "swap-control") {
    const opponentSide: Side = pending.owner === "player" ? "cpu" : "player";
    const opponentField = opponentSide === "player" ? state.playerField : state.cpuField;
    return opponentField.flatMap((zone, index) => isEffectTargetProtected(state, opponentSide, zone) ? [] : [{
      id: zone.id,
      index,
      zone: `${pending.owner === "player" ? "CPU" : "自分"}モンスターゾーン ${index + 1}`,
      name: opponentSide === "cpu" && zone.faceDown ? "裏側モンスター" : cardById.get(zone.id)?.name ?? "モンスター",
    }]);
  }
  if (pending.effect === "destroy-spell" || pending.effect === "destroy-trap") {
    return state.cpuSpellTrap.map((id, index) => {
      const card = cardById.get(id);
      return {
        id,
        index,
        zone: `相手魔法・罠ゾーン ${index + 1}`,
        name: card?.cardType === "trap" ? "セットカード" : card?.name ?? "魔法・罠カード",
      };
    });
  }
  const targetType = pending.effect === "recover-spell" ? "spell" : "trap";
  return state.playerGraveyard.flatMap((id, index) => {
    const card = cardById.get(id);
    return card?.cardType === targetType
      ? [{ id, index, zone: "自分の墓地", name: card.name }]
      : [];
  });
}

function flipTargetHeading(effect: PendingFlipTarget["effect"]): string {
  if (effect === "destroy-monster") return "破壊するモンスターを選択";
  if (effect === "return-monster") return "手札に戻すモンスターを選択";
  if (effect === "swap-control") return "コントロールを交換するモンスターを選択";
  if (effect === "destroy-spell") return "確認する魔法・罠カードを選択";
  if (effect === "destroy-trap") return "確認する魔法・罠カードを選択";
  return effect === "recover-spell" ? "手札に戻す魔法カードを選択" : "手札に戻す罠カードを選択";
}

function resolvePendingFlipTarget(state: DuelState, targetIndex: number): DuelState {
  const pending = state.pendingFlipTarget;
  if (!pending) return state;
  const base = { ...state, pendingFlipTarget: null };
  const effectMonsterName = cardById.get(pending.monsterId)?.name ?? "モンスター";

  if (pending.effect === "swap-control") {
    const ownerField = pending.owner === "player" ? state.playerField : state.cpuField;
    const opponentField = pending.owner === "player" ? state.cpuField : state.playerField;
    const sourceIndex = ownerField.findIndex((zone) => zone.id === pending.monsterId && !zone.faceDown);
    const source = ownerField[sourceIndex];
    const target = opponentField[targetIndex];
    if (!source || !target || isEffectTargetProtected(state, pending.owner === "player" ? "cpu" : "player", target)) return base;
    const targetName = target.faceDown ? "裏側モンスター" : cardById.get(target.id)?.name ?? "モンスター";
    const movedSource: ZoneCard = { ...source, attacked: true, positionChanged: true, controlReturn: source.controlReturn ?? pending.owner, permanentControl: true };
    const opponentSide: Side = pending.owner === "player" ? "cpu" : "player";
    const movedTarget: ZoneCard = { ...target, attacked: true, positionChanged: true, controlReturn: target.controlReturn ?? opponentSide, permanentControl: true };
    let swapped: DuelState = pending.owner === "player"
      ? {
          ...base,
          playerField: [...ownerField.filter((_, index) => index !== sourceIndex), movedTarget],
          cpuField: [...opponentField.filter((_, index) => index !== targetIndex), movedSource],
          log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}とコントロールを交換した。`),
        }
      : {
          ...base,
          cpuField: [...ownerField.filter((_, index) => index !== sourceIndex), movedTarget],
          playerField: [...opponentField.filter((_, index) => index !== targetIndex), movedSource],
          log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}とコントロールを交換した。`),
        };
    if (!target.faceDown) swapped = applyControlChangeLifeTrigger(swapped, target.id, opponentSide, pending.owner);
    return swapped;
  }

  if (pending.effect === "destroy-monster" || pending.effect === "return-monster") {
    const opponentSide: Side = pending.owner === "player" ? "cpu" : "player";
    const opponentField = opponentSide === "player" ? state.playerField : state.cpuField;
    const opponentSpellTrap = opponentSide === "player" ? state.playerSpellTrap : state.cpuSpellTrap;
    const target = opponentField[targetIndex];
    if (!target || isEffectTargetProtected(state, opponentSide, target)) return base;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const remainingField = opponentField.filter((_, index) => index !== targetIndex);
    const remainingSpellTrap = discardEquips(opponentSpellTrap, [target]);
    if (pending.effect === "return-monster") {
      return opponentSide === "cpu"
        ? { ...base, cpuField: remainingField, cpuSpellTrap: remainingSpellTrap, cpuHand: [...state.cpuHand, target.id], cpuGraveyard: [...state.cpuGraveyard, ...target.equipped], log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}をCPUの手札に戻した。`) }
        : { ...base, playerField: remainingField, playerSpellTrap: remainingSpellTrap, playerHand: [...state.playerHand, target.id], playerGraveyard: [...state.playerGraveyard, ...target.equipped], log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}を自分の手札に戻した。`) };
    }
    const destroyedState: DuelState = opponentSide === "cpu"
      ? { ...base, cpuField: remainingField, cpuSpellTrap: remainingSpellTrap, cpuGraveyard: [...state.cpuGraveyard, ...graveCards([target])], log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}を破壊した。`) }
      : { ...base, playerField: remainingField, playerSpellTrap: remainingSpellTrap, playerGraveyard: [...state.playerGraveyard, ...graveCards([target])], log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}を破壊した。`) };
    return applyDeckSearchTriggers(destroyedState, opponentSide === "player" ? [target] : [], opponentSide === "cpu" ? [target] : []);
  }

  if (pending.effect === "destroy-spell" || pending.effect === "destroy-trap") {
    const targetId = state.cpuSpellTrap[targetIndex];
    const target = targetId ? cardById.get(targetId) : null;
    if (!targetId || !target) return base;
    const expectedType = pending.effect === "destroy-spell" ? "spell" : "trap";
    if (fieldCardType(targetId) !== expectedType) {
      return {
        ...base,
        log: appendLog(state.log, `${effectMonsterName}の効果でセットカードを確認。対象の種類ではないため破壊しなかった。`),
      };
    }
    return {
      ...base,
      cpuField: removeEquippedCard(state.cpuField, targetId),
      cpuSpellTrap: state.cpuSpellTrap.filter((_, index) => index !== targetIndex),
      cpuGraveyard: [...state.cpuGraveyard, targetId],
      log: appendLog(state.log, `${effectMonsterName}の効果で${target.name}を破壊した。`),
    };
  }

  const targetId = state.playerGraveyard[targetIndex];
  const target = targetId ? cardById.get(targetId) : null;
  const expectedType = pending.effect === "recover-spell" ? "spell" : "trap";
  if (!targetId || target?.cardType !== expectedType) return base;
  return {
    ...base,
    playerGraveyard: state.playerGraveyard.filter((_, index) => index !== targetIndex),
    playerHand: [...state.playerHand, targetId],
    log: appendLog(state.log, `${effectMonsterName}の効果で墓地の${target.name}を手札に戻した。`),
  };
}

type MultiTargetChoice = { key: string; zone: string; name: string };

function multiTargetChoices(state: DuelState, pending: PendingMultiTarget): MultiTargetChoice[] {
  if (pending.effect === "destroy-dragon" || pending.effect === "return-two-monsters") {
    return (["player", "cpu"] as const).flatMap((side) => {
      const field = side === "player" ? state.playerField : state.cpuField;
      return field.flatMap((zone, index) => {
        const card = cardById.get(zone.id);
        if (pending.effect === "destroy-dragon" && (zone.faceDown || card?.kind !== "ドラゴン族")) return [];
        if (isEffectTargetProtected(state, side, zone)) return [];
        return [{
          key: `${side}-monster-${index}`,
          zone: `${side === "player" ? "自分" : "CPU"}モンスターゾーン ${index + 1}`,
          name: side === "cpu" && zone.faceDown ? "裏側モンスター" : card?.name ?? "モンスター",
        }];
      });
    });
  }
  return (["player", "cpu"] as const).flatMap((side) => {
    const spellTrap = side === "player" ? state.playerSpellTrap : state.cpuSpellTrap;
    const active = new Set(side === "player" ? state.playerActiveTraps : state.cpuActiveTraps);
    const field = side === "player" ? state.playerField : state.cpuField;
    const equipped = new Set(field.flatMap((zone) => zone.equipped));
    return spellTrap.flatMap((id, index) => active.has(id) || equipped.has(id) ? [] : [{
      key: `${side}-spell-${index}`,
      zone: `${side === "player" ? "自分" : "CPU"}魔法・罠ゾーン ${index + 1}`,
      name: side === "player" ? cardById.get(id)?.name ?? "セットカード" : "セットカード",
    }]);
  });
}

function resolvePendingMultiTarget(state: DuelState): DuelState {
  const pending = state.pendingMultiTarget;
  if (!pending) return state;
  const selected = new Set(pending.selected);
  const base = { ...state, pendingMultiTarget: null };
  const playerMonsterIndexes = state.playerField.flatMap((_, index) => selected.has(`player-monster-${index}`) ? [index] : []);
  const cpuMonsterIndexes = state.cpuField.flatMap((_, index) => selected.has(`cpu-monster-${index}`) ? [index] : []);
  const playerZones = state.playerField.filter((_, index) => playerMonsterIndexes.includes(index));
  const cpuZones = state.cpuField.filter((_, index) => cpuMonsterIndexes.includes(index));

  if (pending.effect === "return-two-monsters") {
    return {
      ...base,
      playerField: state.playerField.filter((_, index) => !playerMonsterIndexes.includes(index)),
      cpuField: state.cpuField.filter((_, index) => !cpuMonsterIndexes.includes(index)),
      playerSpellTrap: discardEquips(state.playerSpellTrap, playerZones),
      cpuSpellTrap: discardEquips(state.cpuSpellTrap, cpuZones),
      playerHand: [...state.playerHand, ...playerZones.map((zone) => zone.id)],
      cpuHand: [...state.cpuHand, ...cpuZones.map((zone) => zone.id)],
      playerGraveyard: [...state.playerGraveyard, ...equipGraveCards(playerZones)],
      cpuGraveyard: [...state.cpuGraveyard, ...equipGraveCards(cpuZones)],
      log: appendLog(state.log, `ペンギン・ソルジャーの効果でモンスター${playerZones.length + cpuZones.length}体を手札に戻した。`),
    };
  }

  if (pending.effect === "destroy-dragon") {
    const resolved = {
      ...base,
      playerField: state.playerField.filter((_, index) => !playerMonsterIndexes.includes(index)),
      cpuField: state.cpuField.filter((_, index) => !cpuMonsterIndexes.includes(index)),
      playerSpellTrap: discardEquips(state.playerSpellTrap, playerZones),
      cpuSpellTrap: discardEquips(state.cpuSpellTrap, cpuZones),
      playerGraveyard: [...state.playerGraveyard, ...graveCards(playerZones)],
      cpuGraveyard: [...state.cpuGraveyard, ...graveCards(cpuZones)],
      log: appendLog(state.log, `竜殺者の効果でドラゴン族${playerZones.length + cpuZones.length}体を破壊した。`),
    } as DuelState;
    return applyDeckSearchTriggers(resolved, playerZones, cpuZones);
  }

  const playerSpellIndexes = state.playerSpellTrap.flatMap((_, index) => selected.has(`player-spell-${index}`) ? [index] : []);
  const cpuSpellIndexes = state.cpuSpellTrap.flatMap((_, index) => selected.has(`cpu-spell-${index}`) ? [index] : []);
  const playerDestroyed = state.playerSpellTrap.filter((_, index) => playerSpellIndexes.includes(index));
  const cpuDestroyed = state.cpuSpellTrap.filter((_, index) => cpuSpellIndexes.includes(index));
  return {
    ...base,
    playerSpellTrap: state.playerSpellTrap.filter((_, index) => !playerSpellIndexes.includes(index)),
    cpuSpellTrap: state.cpuSpellTrap.filter((_, index) => !cpuSpellIndexes.includes(index)),
    playerGraveyard: [...state.playerGraveyard, ...playerDestroyed],
    cpuGraveyard: [...state.cpuGraveyard, ...cpuDestroyed],
    log: appendLog(state.log, `ドッペルゲンガーの効果でセットされた魔法・罠カード${playerDestroyed.length + cpuDestroyed.length}枚を破壊した。`),
  };
}

function resolveFlipSequence(state: DuelState, owner: Side, monsterIds: string[]): DuelState {
  return resolveFlipItems(state, monsterIds.map((monsterId) => ({ owner, monsterId })));
}

function resolveFlipItems(state: DuelState, items: PendingFlipQueueItem[]): DuelState {
  let next = { ...state, pendingFlipQueue: [] };
  for (let index = 0; index < items.length; index += 1) {
    next = resolveFlipEffect(next, items[index].owner, items[index].monsterId);
    if (next.pendingFlipTarget) {
      return {
        ...next,
        pendingFlipQueue: items.slice(index + 1),
      };
    }
  }
  return next;
}

function continuePendingFlipQueue(state: DuelState): DuelState {
  let next = { ...state, pendingFlipQueue: [] };
  for (let index = 0; index < state.pendingFlipQueue.length; index += 1) {
    const item = state.pendingFlipQueue[index];
    next = resolveFlipEffect(next, item.owner, item.monsterId);
    if (next.pendingFlipTarget) {
      return { ...next, pendingFlipQueue: state.pendingFlipQueue.slice(index + 1) };
    }
  }
  return next;
}

function resolveFlipEffect(state: DuelState, owner: Side, monsterId: string): DuelState {
  const ownerName = owner === "player" ? "あなた" : "CPU";
  const effect = flipEffect(monsterId);
  if (effect === "destroy-swords-extra-battle") {
    const targetSpellTrap = owner === "player" ? state.cpuSpellTrap : state.playerSpellTrap;
    const destroyed = targetSpellTrap.filter((id) => id === "vol2-swords-revealing-light").length;
    if (destroyed === 0) {
      return { ...state, log: appendLog(state.log, `${ownerName}のウェザー・レポートがリバース。破壊できる光の護封剣はなかった。`) };
    }
    return owner === "player"
      ? {
          ...state,
          cpuSpellTrap: removeCardCopies(state.cpuSpellTrap, "vol2-swords-revealing-light", destroyed),
          cpuSwordsTurns: [],
          cpuGraveyard: [...state.cpuGraveyard, ...Array(destroyed).fill("vol2-swords-revealing-light")],
          playerExtraBattles: state.playerExtraBattles + 1,
          log: appendLog(state.log, `あなたのウェザー・レポートがリバース。CPUの光の護封剣を${destroyed}枚破壊し、次のバトルフェイズを2回行える。`),
        }
      : {
          ...state,
          playerSpellTrap: removeCardCopies(state.playerSpellTrap, "vol2-swords-revealing-light", destroyed),
          playerSwordsTurns: [],
          playerGraveyard: [...state.playerGraveyard, ...Array(destroyed).fill("vol2-swords-revealing-light")],
          cpuExtraBattles: state.cpuExtraBattles + 1,
          log: appendLog(state.log, `CPUのウェザー・レポートがリバース。あなたの光の護封剣を${destroyed}枚破壊し、次のバトルフェイズを2回行える。`),
        };
  }
  if (effect === "inspect-all-set") {
    const opponentField = owner === "player" ? state.cpuField : state.playerField;
    const opponentSpellTrap = owner === "player" ? state.cpuSpellTrap : state.playerSpellTrap;
    const opponentActiveTraps = owner === "player" ? state.cpuActiveTraps : state.playerActiveTraps;
    const equipped = new Set(opponentField.flatMap((zone) => zone.equipped));
    const setIds = [
      ...opponentField.filter((zone) => zone.faceDown).map((zone) => zone.id),
      ...opponentSpellTrap.filter((id) => !opponentActiveTraps.includes(id) && !equipped.has(id)),
    ];
    const revealed = setIds.map((id) => cardById.get(id)?.name ?? id);
    return {
      ...state,
      log: appendLog(
        state.log,
        revealed.length > 0
          ? `${ownerName}の厳格な老魔術師がリバース。相手のセットカードを確認：${revealed.join("／")}。`
          : `${ownerName}の厳格な老魔術師がリバース。相手にセットカードはなかった。`,
      ),
    };
  }
  if (effect === "pay-2000-damage-1000") {
    const ownerLp = owner === "player" ? state.playerLp : state.cpuLp;
    if (ownerLp <= 2000) {
      return { ...state, log: appendLog(state.log, `${ownerName}のニードル・ボールがリバース。LP不足のため効果は発動しなかった。`) };
    }
    const nextPlayerLp = owner === "player" ? state.playerLp - 2000 : Math.max(0, state.playerLp - 1000);
    const nextCpuLp = owner === "cpu" ? state.cpuLp - 2000 : Math.max(0, state.cpuLp - 1000);
    return {
      ...state,
      playerLp: nextPlayerLp,
      cpuLp: nextCpuLp,
      result: nextPlayerLp === 0 ? "lose" : nextCpuLp === 0 ? "win" : state.result,
      log: appendLog(state.log, `${ownerName}のニードル・ボールがリバース。2000LPを払い、相手に1000ダメージ。`),
    };
  }
  if (effect === "gain-3000") {
    const amount = flipLifeAmount(monsterId)?.gain ?? 0;
    return {
      ...state,
      playerLp: owner === "player" ? state.playerLp + amount : state.playerLp,
      cpuLp: owner === "cpu" ? state.cpuLp + amount : state.cpuLp,
      log: appendLog(state.log, `${ownerName}の雷仙人がリバース。${amount}LP回復。`),
    };
  }
  if (effect === "damage-spell-traps") {
    const opponentCards = owner === "player" ? state.cpuSpellTrap.length : state.playerSpellTrap.length;
    const damage = flipLifeAmount(monsterId, opponentCards)?.damage ?? 0;
    const nextPlayerLp = owner === "cpu" ? Math.max(0, state.playerLp - damage) : state.playerLp;
    const nextCpuLp = owner === "player" ? Math.max(0, state.cpuLp - damage) : state.cpuLp;
    return {
      ...state,
      playerLp: nextPlayerLp,
      cpuLp: nextCpuLp,
      result: nextPlayerLp === 0 ? "lose" : nextCpuLp === 0 ? "win" : state.result,
      log: appendLog(state.log, `${ownerName}の剣の女王がリバース。相手の魔法・罠${opponentCards}枚につき500、合計${damage}ダメージ。`),
    };
  }
  if (effect === "destroy-dragon-jar") {
    const playerJars = state.playerSpellTrap.filter((id) => id === "stb-dragon-capture-jar");
    const cpuJars = state.cpuSpellTrap.filter((id) => id === "stb-dragon-capture-jar");
    if (playerJars.length + cpuJars.length === 0) {
      return { ...state, log: appendLog(state.log, `${ownerName}の壺魔人がリバース。破壊できるドラゴン族・封印の壺はなかった。`) };
    }
    return {
      ...state,
      playerField: forceFaceUpDragonsToPosition(state.playerField, "attack"),
      cpuField: forceFaceUpDragonsToPosition(state.cpuField, "attack"),
      playerSpellTrap: state.playerSpellTrap.filter((id) => id !== "stb-dragon-capture-jar"),
      cpuSpellTrap: state.cpuSpellTrap.filter((id) => id !== "stb-dragon-capture-jar"),
      playerGraveyard: [...state.playerGraveyard, ...playerJars],
      cpuGraveyard: [...state.cpuGraveyard, ...cpuJars],
      log: appendLog(state.log, `${ownerName}の壺魔人がリバース。ドラゴン族・封印の壺を破壊し、表側のドラゴン族を攻撃表示にした。`),
    };
  }
  if (effect === "reorder-five") {
    const deck = owner === "player" ? state.playerDeck : state.cpuDeck;
    const topCards = deck.slice(0, 5);
    if (topCards.length === 0) return state;
    if (owner === "player" && shouldPlayerChooseFlipTarget(owner, state.turn, state.phase)) {
      return {
        ...state,
        playerDeck: deck.slice(topCards.length),
        pendingDeckReorder: { monsterId, cards: topCards },
        log: appendLog(state.log, `${ownerName}の大王目玉がリバース。デッキ上${topCards.length}枚の順番を選択してください。`),
      };
    }
    return {
      ...state,
      log: appendLog(state.log, `${ownerName}の大王目玉がリバース。デッキ上${topCards.length}枚を確認して並べ替えた。`),
    };
  }
  if (effect === "draw") {
    const deck = owner === "player" ? state.playerDeck : state.cpuDeck;
    if (deck.length === 0) return state;
    return owner === "player"
      ? {
          ...state,
          playerDeck: deck.slice(1),
          playerHand: [...state.playerHand, deck[0]],
          log: appendLog(state.log, `${ownerName}のスケルエンジェルがリバース。カードを1枚ドロー。`),
        }
      : {
          ...state,
          cpuDeck: deck.slice(1),
          cpuHand: [...state.cpuHand, deck[0]],
          log: appendLog(state.log, `${ownerName}のスケルエンジェルがリバース。カードを1枚ドロー。`),
        };
  }
  if (effect === "opponent-draw-three-discard-spells") {
    const opponentDeck = owner === "player" ? state.cpuDeck : state.playerDeck;
    const drawn = opponentDeck.slice(0, 3);
    const discarded = drawn.filter((id) => cardById.get(id)?.cardType === "spell");
    const kept = drawn.filter((id) => cardById.get(id)?.cardType !== "spell");
    let next: DuelState = owner === "player"
      ? {
          ...state,
          cpuDeck: opponentDeck.slice(drawn.length),
          cpuHand: [...state.cpuHand, ...kept],
          cpuGraveyard: [...state.cpuGraveyard, ...discarded],
          log: appendLog(state.log, `${ownerName}の悪魔の偵察者がリバース。CPUは${drawn.length}枚ドローし、魔法カード${discarded.length}枚を墓地へ捨てた。`),
        }
      : {
          ...state,
          playerDeck: opponentDeck.slice(drawn.length),
          playerHand: [...state.playerHand, ...kept],
          playerGraveyard: [...state.playerGraveyard, ...discarded],
          log: appendLog(state.log, `${ownerName}の悪魔の偵察者がリバース。あなたは${drawn.length}枚ドローし、魔法カード${discarded.length}枚を墓地へ捨てた。`),
        };
    if (discarded.length > 0) next = applyOpponentDiscardTriggers(next, owner === "player" ? "cpu" : "player", discarded);
    return next;
  }
  if (effect === "mill-five") {
    const opponentDeck = owner === "player" ? state.cpuDeck : state.playerDeck;
    const milled = opponentDeck.slice(0, 5);
    if (milled.length === 0) return state;
    let next: DuelState = owner === "player"
      ? {
          ...state,
          cpuDeck: opponentDeck.slice(milled.length),
          cpuGraveyard: [...state.cpuGraveyard, ...milled],
          log: appendLog(state.log, `${ownerName}のニードルワームがリバース。CPUのデッキ上から${milled.length}枚を墓地へ送った。`),
        }
      : {
          ...state,
          playerDeck: opponentDeck.slice(milled.length),
          playerGraveyard: [...state.playerGraveyard, ...milled],
          log: appendLog(state.log, `${ownerName}のニードルワームがリバース。あなたのデッキ上から${milled.length}枚を墓地へ送った。`),
        };
    if (milled.includes("mr-penguin-knight")) {
      next = owner === "player"
        ? {
            ...next,
            cpuDeck: shuffle([...next.cpuDeck, ...next.cpuGraveyard]),
            cpuGraveyard: [],
            log: appendLog(next.log, "ペンギン・ナイトの効果が発動。CPUの墓地のカードをすべてデッキに戻してシャッフル。"),
          }
        : {
            ...next,
            playerDeck: shuffle([...next.playerDeck, ...next.playerGraveyard]),
            playerGraveyard: [],
            log: appendLog(next.log, "ペンギン・ナイトの効果が発動。自分の墓地のカードをすべてデッキに戻してシャッフル。"),
          };
    }
    return next;
  }
  if (effect === "reload-five") {
    const playerDraw = state.playerDeck.slice(0, 5);
    const cpuDraw = state.cpuDeck.slice(0, 5);
    return {
      ...state,
      playerDeck: state.playerDeck.slice(playerDraw.length),
      cpuDeck: state.cpuDeck.slice(cpuDraw.length),
      playerGraveyard: [...state.playerGraveyard, ...state.playerHand],
      cpuGraveyard: [...state.cpuGraveyard, ...state.cpuHand],
      playerHand: playerDraw,
      cpuHand: cpuDraw,
      log: appendLog(state.log, `${ownerName}のメタモルポットがリバース。お互いに手札を全て捨て、あなたは${playerDraw.length}枚、CPUは${cpuDraw.length}枚ドローした。`),
    };
  }

  if (effect === "return-two-monsters" || effect === "destroy-two-set-spell-traps") {
    const pending: PendingMultiTarget = { monsterId, effect, selected: [] };
    const choices = multiTargetChoices(state, pending);
    if (choices.length === 0 || (effect === "destroy-two-set-spell-traps" && choices.length < 2)) return state;
    if (owner === "player") {
      return {
        ...state,
        pendingMultiTarget: pending,
        log: appendLog(state.log, `${ownerName}の${cardById.get(monsterId)?.name}がリバース。効果対象を選んでください。`),
      };
    }
    const required = effect === "return-two-monsters" ? Math.min(2, choices.length) : choices.length >= 2 ? 2 : 0;
    if (required === 0) return state;
    return resolvePendingMultiTarget({ ...state, pendingMultiTarget: { ...pending, selected: choices.slice(0, required).map((choice) => choice.key) } });
  }

  if (effect === "swap-control" && state.phase === "battle") {
    return { ...state, log: appendLog(state.log, `${ownerName}の王座の侵略者がリバース。バトルフェイズ中のため効果は発動できない。`) };
  }

  const playerChooses = shouldPlayerChooseFlipTarget(owner, state.turn, state.phase);
  if (playerChooses && effect) {
    const pending = { monsterId, owner, effect } as PendingFlipTarget;
    if (flipTargetChoices(state, pending).length > 0) {
      return {
        ...state,
        pendingFlipTarget: pending,
        log: appendLog(state.log, `${ownerName}の${cardById.get(monsterId)?.name ?? "モンスター"}がリバース。効果対象を選択してください。`),
      };
    }
    if (effect === "destroy-monster" || effect === "return-monster" || effect === "swap-control") {
      return {
        ...state,
        log: appendLog(state.log, `${ownerName}の${cardById.get(monsterId)?.name ?? "モンスター"}がリバース。効果を発動したが、選べる相手モンスターはいなかった。`),
      };
    }
  }

  if (effect === "swap-control") {
    const pending: PendingFlipTarget = { monsterId, owner, effect };
    const choices = flipTargetChoices(state, pending);
    if (choices.length === 0) {
      return { ...state, log: appendLog(state.log, `${ownerName}の王座の侵略者がリバース。交換できる相手モンスターはいなかった。`) };
    }
    const opponentSide: Side = owner === "player" ? "cpu" : "player";
    const strongest = strongestAttackIndex(choices.map((choice) => effectiveAtk(
      (opponentSide === "player" ? state.playerField : state.cpuField)[choice.index],
      state,
      opponentSide,
    )));
    const targetIndex = strongest === null ? choices[0].index : choices[strongest].index;
    return resolvePendingFlipTarget({ ...state, pendingFlipTarget: pending }, targetIndex);
  }

  if (effect === "recover-spell" || effect === "recover-trap") {
    const ownerGraveyard = owner === "player" ? state.playerGraveyard : state.cpuGraveyard;
    const targetType = effect === "recover-spell" ? "spell" : "trap";
    const targetIndex = ownerGraveyard.findIndex((id) => cardById.get(id)?.cardType === targetType);
    if (targetIndex < 0) return state;
    const targetId = ownerGraveyard[targetIndex];
    const targetName = cardById.get(targetId)?.name ?? (targetType === "spell" ? "魔法カード" : "罠カード");
    const effectName = effect === "recover-spell" ? "聖なる魔術師" : "闇の仮面";
    return owner === "player"
      ? {
          ...state,
          playerGraveyard: ownerGraveyard.filter((_, index) => index !== targetIndex),
          playerHand: [...state.playerHand, targetId],
          log: appendLog(state.log, `${ownerName}の${effectName}がリバース。墓地の${targetName}を手札に戻した。`),
        }
      : {
          ...state,
          cpuGraveyard: ownerGraveyard.filter((_, index) => index !== targetIndex),
          cpuHand: [...state.cpuHand, targetId],
          log: appendLog(state.log, `${ownerName}の${effectName}がリバース。墓地の${targetName}を手札に戻した。`),
        };
  }

  if (effect === "destroy-monster" || effect === "return-monster") {
    const opponentField = owner === "player" ? state.cpuField : state.playerField;
    const opponentSide: Side = owner === "player" ? "cpu" : "player";
    const validTargets = opponentField
      .map((zone, index) => ({ zone, index }))
      .filter(({ zone }) => !isEffectTargetProtected(state, opponentSide, zone));
    const choiceIndex = strongestAttackIndex(validTargets.map(({ zone }) => effectiveAtk(zone, state, opponentSide)));
    const targetIndex = choiceIndex === null ? null : validTargets[choiceIndex]?.index ?? null;
    if (targetIndex === null) {
      return {
        ...state,
        log: appendLog(state.log, `${ownerName}の${cardById.get(monsterId)?.name ?? "モンスター"}がリバース。効果を発動したが、選べる相手モンスターはいなかった。`),
      };
    }
    const target = opponentField[targetIndex];
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const remainingField = opponentField.filter((_, index) => index !== targetIndex);
    const remainingSpellTrap = discardEquips(
      owner === "player" ? state.cpuSpellTrap : state.playerSpellTrap,
      [target],
    );
    if (effect === "return-monster") {
      return owner === "player"
        ? {
            ...state,
            cpuField: remainingField,
            cpuSpellTrap: remainingSpellTrap,
            cpuHand: [...state.cpuHand, target.id],
            cpuGraveyard: [...state.cpuGraveyard, ...target.equipped],
            log: appendLog(state.log, `${ownerName}のハネハネがリバース。${targetName}を手札に戻した。`),
          }
        : {
            ...state,
            playerField: remainingField,
            playerSpellTrap: remainingSpellTrap,
            playerHand: [...state.playerHand, target.id],
            playerGraveyard: [...state.playerGraveyard, ...target.equipped],
            log: appendLog(state.log, `${ownerName}のハネハネがリバース。${targetName}を手札に戻した。`),
          };
    }
    const destroyedState: DuelState = owner === "player"
      ? {
          ...state,
          cpuField: remainingField,
          cpuSpellTrap: remainingSpellTrap,
          cpuGraveyard: [...state.cpuGraveyard, ...graveCards([target])],
          log: appendLog(state.log, `${ownerName}の人喰い虫がリバース。${targetName}を破壊した。`),
        }
      : {
          ...state,
          playerField: remainingField,
          playerSpellTrap: remainingSpellTrap,
          playerGraveyard: [...state.playerGraveyard, ...graveCards([target])],
          log: appendLog(state.log, `${ownerName}の人喰い虫がリバース。${targetName}を破壊した。`),
        };
    return applyDeckSearchTriggers(
      destroyedState,
      owner === "cpu" ? [target] : [],
      owner === "player" ? [target] : [],
    );
  }

  const targetType = effect === "destroy-spell" ? "spell" : effect === "destroy-trap" ? "trap" : null;
  if (!targetType) return state;
  const opponentSpellTrap = owner === "player" ? state.cpuSpellTrap : state.playerSpellTrap;
  let targetIndex = opponentSpellTrap.findIndex((id) => fieldCardType(id) === targetType);
  if (owner === "cpu" && targetType === "trap") {
    const protectedTrapIndex = opponentSpellTrap.findIndex((id) => id !== "vol5-fake-trap" && fieldCardType(id) === "trap");
    if (protectedTrapIndex >= 0) targetIndex = protectedTrapIndex;
  }
  if (targetIndex < 0) return state;
  const targetId = opponentSpellTrap[targetIndex];
  const targetName = cardById.get(targetId)?.name ?? (targetType === "spell" ? "魔法カード" : "罠カード");
  if (owner === "cpu" && targetType === "trap" && fakeTrapCanProtect(opponentSpellTrap, targetIndex)) {
    return {
      ...state,
      pendingFakeTrap: {
        monsterId,
        targetIndex,
        targetId,
        fakeTrapIndex: opponentSpellTrap.indexOf("vol5-fake-trap"),
      },
      log: appendLog(state.log, `${ownerName}のカードを狩る死神がリバース。${targetName}が破壊されようとしている。`),
    };
  }
  const remainingSpellTrap = opponentSpellTrap.filter((_, index) => index !== targetIndex);
  const effectName = effect === "destroy-spell" ? "青い忍者" : "カードを狩る死神";
  return owner === "player"
    ? {
        ...state,
        cpuField: removeEquippedCard(state.cpuField, targetId),
        cpuSpellTrap: remainingSpellTrap,
        cpuGraveyard: [...state.cpuGraveyard, targetId],
        log: appendLog(state.log, `${ownerName}の${effectName}がリバース。${targetName}を破壊した。`),
      }
    : {
        ...state,
        playerField: removeEquippedCard(state.playerField, targetId),
        playerSpellTrap: remainingSpellTrap,
        playerGraveyard: [...state.playerGraveyard, targetId],
        log: appendLog(state.log, `${ownerName}の${effectName}がリバース。${targetName}を破壊した。`),
      };
}

function expandDeck(counts: Record<string, number>) {
  return Object.entries(counts).flatMap(([id, count]) =>
    cardById.has(id) && !cardById.get(id)?.fusion && Number.isInteger(count) && count > 0
      ? Array(Math.min(cardCopyLimit(cardById.get(id)!), count)).fill(id)
      : [],
  );
}

function expandFusionDeck(counts: Record<string, number>) {
  return Object.entries(counts).flatMap(([id, count]) =>
    cardById.get(id)?.fusion && Number.isInteger(count) && count > 0
      ? Array(Math.min(cardCopyLimit(cardById.get(id)!), count)).fill(id)
      : [],
  );
}

function elegantEgotistChoices(state: DuelState, spellHandIndex: number) {
  const handIds = state.playerHand.filter((_, index) => index !== spellHandIndex);
  return (["hand", "deck"] as const).flatMap((source) => {
    const ids = source === "hand" ? handIds : state.playerDeck;
    return [...new Set(ids.filter(isElegantEgotistTarget))].map((cardId) => ({ source, cardId }));
  });
}

function canActivateElegantEgotist(state: DuelState, spellHandIndex: number) {
  return state.playerField.length < FIELD_LIMIT
    && state.playerField.some((zone) => !zone.faceDown && zone.id === "vol4-harpie-lady")
    && elegantEgotistChoices(state, spellHandIndex).length > 0;
}

function shuffle<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function tributeCount(card: Card) {
  const level = card.level ?? 0;
  return level >= 7 ? 2 : level >= 5 ? 1 : 0;
}

function lowestAttackIndexes(field: ZoneCard[], count: number) {
  return field
    .map((zone, index) => ({ index, value: cardById.get(zone.id)?.atk ?? 0 }))
    .sort((a, b) => a.value - b.value)
    .slice(0, count)
    .map((item) => item.index);
}

function strongestHandCardIndex(hand: string[]) {
  let bestIndex = 0;
  let bestScore = -1;
  hand.forEach((id, index) => {
    const card = cardById.get(id);
    const score = card?.cardType === "monster" ? (card.atk ?? 0) : card?.rarity === "UR" ? 2600 : card?.rarity === "SR" ? 2300 : 1800;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function weakestHandCardIndex(hand: string[]) {
  let weakestIndex = 0;
  let weakestScore = Number.POSITIVE_INFINITY;
  hand.forEach((id, index) => {
    const card = cardById.get(id);
    const score = card?.cardType === "monster" ? (card.atk ?? 0) : card?.rarity === "UR" ? 2600 : card?.rarity === "SR" ? 2300 : 1800;
    if (score < weakestScore) {
      weakestScore = score;
      weakestIndex = index;
    }
  });
  return weakestIndex;
}

function applyOpponentDiscardTriggers(state: DuelState, owner: Side, discardedIds: string[]) {
  const snakeCount = discardedIds.filter((id) => id === "mr-electric-snake").length;
  const minarCount = discardedIds.filter((id) => id === "mr-minar").length;
  if (snakeCount === 0 && minarCount === 0) return state;
  const deckKey = owner === "player" ? "playerDeck" : "cpuDeck";
  const handKey = owner === "player" ? "playerHand" : "cpuHand";
  const opponentLpKey = owner === "player" ? "cpuLp" : "playerLp";
  const drawCount = Math.min(state[deckKey].length, snakeCount * 2);
  const damage = minarCount * 1000;
  const next = {
    ...state,
    [deckKey]: state[deckKey].slice(drawCount),
    [handKey]: [...state[handKey], ...state[deckKey].slice(0, drawCount)],
    [opponentLpKey]: Math.max(0, state[opponentLpKey] - damage),
  } as DuelState;
  return {
    ...next,
    result: next.playerLp === 0 ? "lose" : next.cpuLp === 0 ? "win" : next.result,
    log: appendLog(next.log, `${snakeCount > 0 ? `エレクトリック・スネークの効果で${drawCount}枚ドロー。` : ""}${minarCount > 0 ? `イビーの効果で相手に${damage}ダメージ。` : ""}`),
  };
}

function lowestFaceUpAttackIndex(field: ZoneCard[], state?: DuelState, side?: Side) {
  const candidates = field
    .map((zone, index) => ({ zone, index }))
    .filter(({ zone }) => !zone.faceDown)
    .sort((a, b) => effectiveAtk(a.zone, state, side) - effectiveAtk(b.zone, state, side));
  return candidates[0]?.index ?? null;
}

function effectiveAtk(zone: ZoneCard, state?: DuelState, side?: Side) {
  const card = cardById.get(zone.id);
  const original = hourglassOriginalStats(
    zone.id,
    card?.atk ?? 0,
    card?.def ?? 0,
    zone.faceUpTurn ?? zone.summonedTurn,
    state?.turnNumber,
  );
  const base = swappedMonsterStats(original.atk, original.def, Boolean(state && zone.statsSwappedTurn === state.turnNumber));
  const equipped = equippedMonsterStats(base.atk, base.def, zone.equipped);
  if (!state || !side || zone.faceDown || !card) return equipped.atk;
  const stats = continuousMonsterStats({
    id: zone.id,
    attribute: card.attribute,
    kind: card.kind,
    position: zone.position,
    atk: equipped.atk,
    def: equipped.def,
    handSize: side === "player" ? state.playerHand.length : state.cpuHand.length,
    graveyardMonsterCount: (side === "player" ? state.playerGraveyard : state.cpuGraveyard)
      .filter((id) => cardById.get(id)?.cardType === "monster").length,
    faceUpPlantCount: [...state.playerField, ...state.cpuField]
      .filter((fieldZone) => !fieldZone.faceDown && cardById.get(fieldZone.id)?.kind === "植物族").length,
    faceUpMachineCount: [...state.playerField, ...state.cpuField]
      .filter((fieldZone) => !fieldZone.faceDown && cardById.get(fieldZone.id)?.kind === "機械族").length,
    equipCount: zone.equipped.length,
    auraIds: [...state.playerField, ...state.cpuField].filter((fieldZone) => !fieldZone.faceDown).map((fieldZone) => fieldZone.id),
    allyIds: (side === "player" ? state.playerField : state.cpuField).filter((fieldZone) => !fieldZone.faceDown).map((fieldZone) => fieldZone.id),
    fieldSpellIds: [state.playerFieldSpell, state.cpuFieldSpell].filter((id): id is string => Boolean(id)),
  });
  const adjusted = stats.atk
    + timedFieldBonus(zone, state)
    + aileSwordsmanAttackBonus(zone.aileBoostTurn, zone.aileTributeCount, state.turnNumber)
    + temporaryBattleStatBonus(zone.battleAtkBonusTurn, state.turnNumber, zone.battleAtkBonusValue)
    - germInfectionPenalty(zone.equipped, zone.germStandbys)
    - dopingPenalty(zone.equipped, zone.germStandbys);
  return reverseAdjustedStat(base.atk, adjusted, state.reverseTrapTurn === state.turnNumber);
}

function effectiveDef(zone: ZoneCard, state?: DuelState, side?: Side) {
  const card = cardById.get(zone.id);
  const original = hourglassOriginalStats(
    zone.id,
    card?.atk ?? 0,
    card?.def ?? 0,
    zone.faceUpTurn ?? zone.summonedTurn,
    state?.turnNumber,
  );
  const base = swappedMonsterStats(original.atk, original.def, Boolean(state && zone.statsSwappedTurn === state.turnNumber));
  const equipped = equippedMonsterStats(base.atk, base.def, zone.equipped);
  if (!state || !side || zone.faceDown || !card) return equipped.def;
  const stats = continuousMonsterStats({
    id: zone.id,
    attribute: card.attribute,
    kind: card.kind,
    position: zone.position,
    atk: equipped.atk,
    def: equipped.def,
    handSize: side === "player" ? state.playerHand.length : state.cpuHand.length,
    graveyardMonsterCount: 0,
    equipCount: zone.equipped.length,
    auraIds: [],
    fieldSpellIds: [state.playerFieldSpell, state.cpuFieldSpell].filter((id): id is string => Boolean(id)),
  });
  const adjusted = stats.def + timedFieldBonus(zone, state) + temporaryBattleStatBonus(zone.battleDefBonusTurn, state.turnNumber, zone.battleDefBonusValue);
  return reverseAdjustedStat(base.def, adjusted, state.reverseTrapTurn === state.turnNumber);
}

function timedFieldBonus(zone: ZoneCard, state: DuelState) {
  const card = cardById.get(zone.id);
  if (!card || zone.faceDown) return 0;
  const castleTurns = [...state.playerField, ...state.cpuField]
    .filter((fieldZone) => fieldZone.id === "bo7-castle-dark-illusions" && !fieldZone.faceDown)
    .map((fieldZone) => fieldZone.faceUpTurn ?? fieldZone.summonedTurn);
  const castleBoost = card.kind === "アンデット族"
    ? darkCastleUndeadBoost(castleTurns, state.turnNumber)
    : 0;
  const pumpkingBoost = pumpkingTimedBonus(
    zone.id,
    castleTurns.length > 0,
    zone.faceUpTurn ?? zone.summonedTurn,
    state.turnNumber,
  );
  return castleBoost + pumpkingBoost;
}

function canEquip(spellId: string, monster: Card) {
  if (spellId === "vol4-cocoon-evolution") return monster.id === "vol4-petit-moth";
  if (spellId === "vol7-germ-infection" || spellId === "vol7-paralyzing-potion") return monster.cardType === "monster" && monster.kind !== "機械族";
  if (spellId === "vol7-sword-deep-seated") return monster.cardType === "monster";
  if (spellId === "bo7-magnetic-ring" || spellId === "bo7-doping") return monster.cardType === "monster";
  if (["mr-axe-despair", "mr-black-pendant", "mr-horn-light", "mr-malevolent-nuzzler", "mr-snatch-steal"].includes(spellId)) return monster.cardType === "monster";
  if (EQUIP_RULES[spellId]?.endsWith("属性")) return monster.cardType === "monster" && `${monster.attribute}属性` === EQUIP_RULES[spellId];
  return monster.cardType === "monster" && EQUIP_RULES[spellId] === monster.kind;
}

function isOpponentEquip(spellId: string) {
  return spellId === "vol7-germ-infection" || spellId === "vol7-paralyzing-potion" || spellId === "mr-snatch-steal";
}

function canActivateEquip(state: DuelState, spellId: string) {
  if (spellId === "mr-snatch-steal") {
    return state.playerField.length < FIELD_LIMIT
      && state.playerSpellTrap.length < FIELD_LIMIT
      && state.cpuField.some((zone) => !zone.faceDown && !isEffectTargetProtected(state, "cpu", zone));
  }
  const playerTarget = state.playerSpellTrap.length < FIELD_LIMIT
    && state.playerField.some((zone) => !zone.faceDown && Boolean(cardById.get(zone.id) && canEquip(spellId, cardById.get(zone.id)!)));
  const cpuTarget = isOpponentEquip(spellId) && state.cpuSpellTrap.length < FIELD_LIMIT
    && state.cpuField.some((zone) => !zone.faceDown && Boolean(cardById.get(zone.id) && canEquip(spellId, cardById.get(zone.id)!)));
  return playerTarget || cpuTarget;
}

function mothTargetIndex(state: DuelState, mothId: string) {
  return state.playerField.findIndex((zone) =>
    zone.id === "vol4-petit-moth"
    && !zone.faceDown
    && zone.equipped.includes("vol4-cocoon-evolution")
    && canSpecialSummonMoth(mothId, state.turnNumber, zone.cocoonEquippedTurn),
  );
}

function fieldCardType(cardId: string) {
  return cardId === "vol4-cocoon-evolution"
    ? "spell"
    : cardById.get(cardId)?.cardType ?? "trap";
}

function duelChainEnergyIds(state: DuelState) {
  return [...state.playerSpellTrap, ...state.cpuSpellTrap];
}

function duelChainEnergyCost(state: DuelState, actionCount = 1) {
  return chainEnergyCost(duelChainEnergyIds(state), actionCount);
}

function canPayDuelChainEnergy(state: DuelState, side: Side, actionCount = 1) {
  return canPayChainEnergy(side === "player" ? state.playerLp : state.cpuLp, duelChainEnergyIds(state), actionCount);
}

function applyChainEnergyPayment(state: DuelState, side: Side, actionCount = 1): DuelState {
  const cost = duelChainEnergyCost(state, actionCount);
  if (cost === 0) return state;
  const lifeKey = side === "player" ? "playerLp" : "cpuLp";
  return {
    ...state,
    [lifeKey]: state[lifeKey] - cost,
    log: appendLog(state.log, `魔力の枷により${side === "player" ? "プレイヤー" : "CPU"}が${cost}LPを支払った。`),
  };
}

function removeHandCard(state: DuelState, handIndex: number): DuelState {
  return applyChainEnergyPayment({ ...state, playerHand: state.playerHand.filter((_, index) => index !== handIndex) }, "player");
}

function removeCpuHandCard(state: DuelState, cardId: string): DuelState {
  const index = state.cpuHand.indexOf(cardId);
  return index < 0
    ? state
    : applyChainEnergyPayment({ ...state, cpuHand: state.cpuHand.filter((_, handIndex) => handIndex !== index) }, "cpu");
}

function fieldPower(field: ZoneCard[], state?: DuelState, side?: Side) {
  return field.reduce((total, zone) => total + Math.max(effectiveAtk(zone, state, side), effectiveDef(zone, state, side)), 0);
}

function discardEquips(spellTrap: string[], zones: ZoneCard[]) {
  const remaining = [...spellTrap];
  zones.flatMap((zone) => zone.equipped).forEach((equipId) => {
    const index = remaining.indexOf(equipId);
    if (index >= 0) remaining.splice(index, 1);
  });
  return remaining;
}

function graveCards(zones: ZoneCard[]) {
  return zones.flatMap((zone) => [zone.id, ...zone.equipped]);
}

function equipGraveCards(zones: ZoneCard[]) {
  return zones.flatMap((zone) => zone.equipped);
}

function applyDeckSearchTriggers(state: DuelState, playerZones: ZoneCard[] = [], cpuZones: ZoneCard[] = []): DuelState {
  let next = state;
  const playerCockroaches = playerZones.filter((zone) => cockroachKnightReturns(zone.id)).length;
  const cpuCockroaches = cpuZones.filter((zone) => cockroachKnightReturns(zone.id)).length;
  if (playerCockroaches > 0 || cpuCockroaches > 0) {
    next = {
      ...next,
      playerDeck: [...Array(playerCockroaches).fill("bo4-cockroach-knight"), ...next.playerDeck],
      cpuDeck: [...Array(cpuCockroaches).fill("bo4-cockroach-knight"), ...next.cpuDeck],
      playerGraveyard: removeCardCopies(next.playerGraveyard, "bo4-cockroach-knight", playerCockroaches),
      cpuGraveyard: removeCardCopies(next.cpuGraveyard, "bo4-cockroach-knight", cpuCockroaches),
      log: appendLog(next.log, `コカローチ・ナイト${playerCockroaches + cpuCockroaches}体をデッキの一番上へ戻した。`),
    };
  }
  const playerSwords = playerZones.flatMap((zone) => zone.equipped).filter((id) => id === "vol7-sword-deep-seated").length;
  const cpuSwords = cpuZones.flatMap((zone) => zone.equipped).filter((id) => id === "vol7-sword-deep-seated").length;
  if (playerSwords > 0 || cpuSwords > 0) {
    next = {
      ...next,
      playerDeck: [...Array(playerSwords).fill("vol7-sword-deep-seated"), ...next.playerDeck],
      cpuDeck: [...Array(cpuSwords).fill("vol7-sword-deep-seated"), ...next.cpuDeck],
      playerGraveyard: removeCardCopies(next.playerGraveyard, "vol7-sword-deep-seated", playerSwords),
      cpuGraveyard: removeCardCopies(next.cpuGraveyard, "vol7-sword-deep-seated", cpuSwords),
      log: appendLog(next.log, `執念の剣${playerSwords + cpuSwords}枚を墓地からデッキの一番上へ戻した。`),
    };
  }
  const playerLifeLoss = playerZones.reduce((total, zone) => total + graveyardLifeLoss(zone.id), 0);
  const cpuLifeLoss = cpuZones.reduce((total, zone) => total + graveyardLifeLoss(zone.id), 0);
  if (playerLifeLoss > 0 || cpuLifeLoss > 0) {
    const playerLp = Math.max(0, next.playerLp - playerLifeLoss);
    const cpuLp = Math.max(0, next.cpuLp - cpuLifeLoss);
    next = {
      ...next,
      playerLp,
      cpuLp,
      result: playerLp === 0 && cpuLp === 0 ? "draw" : playerLp === 0 ? "lose" : cpuLp === 0 ? "win" : next.result,
      log: appendLog(
        next.log,
        playerLifeLoss > 0 && cpuLifeLoss > 0
          ? `双方の雷仙人が墓地へ送られ、双方が${playerLifeLoss}LPを失った。`
          : playerLifeLoss > 0
            ? `雷仙人が墓地へ送られ、プレイヤーが${playerLifeLoss}LPを失った。`
            : `CPUの雷仙人が墓地へ送られ、CPUが${cpuLifeLoss}LPを失った。`,
      ),
    };
  }
  const playerTriggers = playerZones
    .map((zone) => zone.id)
    .filter((id) => (id === "vol6-sangan" || id === "vol6-witch-black-forest")
      && next.playerDeck.some((deckId) => canDeckSearchTarget(id, cardById.get(deckId))));
  if (playerTriggers.length > 0) {
    next = {
      ...next,
      pendingDeckSearch: { monsterIds: [...(next.pendingDeckSearch?.monsterIds ?? []), ...playerTriggers] },
      log: appendLog(next.log, `${cardById.get(playerTriggers[0])?.name}のデッキ検索効果が発動。`),
    };
  }
  cpuZones
    .map((zone) => zone.id)
    .filter((id) => id === "vol6-sangan" || id === "vol6-witch-black-forest")
    .forEach((sourceId) => {
      const candidates = next.cpuDeck
        .map((id, index) => ({ id, index, card: cardById.get(id) }))
        .filter(({ card }) => canDeckSearchTarget(sourceId, card))
        .sort((a, b) => (b.card?.atk ?? 0) - (a.card?.atk ?? 0));
      const choice = candidates[0];
      if (!choice) return;
      next = {
        ...next,
        cpuDeck: next.cpuDeck.filter((_, index) => index !== choice.index),
        cpuHand: [...next.cpuHand, choice.id],
        log: appendLog(next.log, `CPUの${cardById.get(sourceId)?.name}の効果で${choice.card?.name}を手札に加えた。`),
      };
    });
  return next;
}

function isDragonCaptureJarActive(state: DuelState) {
  return state.playerSpellTrap.includes("stb-dragon-capture-jar") || state.cpuSpellTrap.includes("stb-dragon-capture-jar");
}

function forceFaceUpDragonsToPosition(zones: ZoneCard[], position: Position) {
  return zones.map((zone) => !zone.faceDown && cardById.get(zone.id)?.kind === "ドラゴン族"
    ? { ...zone, position, positionChanged: true }
    : zone);
}

function useCpuCannonSoldierForLethal(state: DuelState): DuelState {
  const sourceIndex = state.cpuField.findIndex((zone) => zone.id === "vol6-cannon-soldier" && !zone.faceDown);
  if (sourceIndex < 0 || state.playerLp > 500 || state.cpuField.length === 0) return state;
  const targetIndex = lowestAttackIndexes(state.cpuField, 1)[0] ?? sourceIndex;
  const target = state.cpuField[targetIndex];
  const targetName = cardById.get(target.id)?.name ?? "モンスター";
  let resolved: DuelState = {
    ...state,
    cpuField: state.cpuField.filter((_, index) => index !== targetIndex),
    cpuSpellTrap: discardEquips(state.cpuSpellTrap, [target]),
    cpuGraveyard: [...state.cpuGraveyard, ...graveCards([target])],
    playerLp: Math.max(0, state.playerLp - 500),
    result: "lose",
    log: appendLog(state.log, `CPUがキャノン・ソルジャーの効果で${targetName}を生け贄にし、500ダメージ。`),
  };
  resolved = applyDeckSearchTriggers(resolved, [], [target]);
  return resolved;
}

function useCpuBarrelDragon(state: DuelState): DuelState {
  const sourceIndex = state.cpuField.findIndex((zone) => zone.id === "vol7-barrel-dragon"
    && !zone.faceDown
    && zone.barrelUsedTurn !== state.turnNumber);
  if (sourceIndex < 0 || state.playerField.length === 0) return state;
  const targetIndex = strongestAttackIndex(state.playerField.map((zone) => Math.max(
    effectiveAtk(zone, state, "player"),
    effectiveDef(zone, state, "player"),
  )));
  if (targetIndex === null) return state;
  const target = state.playerField[targetIndex];
  const targetName = target.faceDown ? "裏側モンスター" : cardById.get(target.id)?.name ?? "モンスター";
  const tosses = Array.from({ length: 3 }, () => Math.random() < 0.5);
  const result = barrelDragonCoinResult(tosses);
  let resolved: DuelState = {
    ...state,
    cpuField: state.cpuField.map((zone, index) => index === sourceIndex ? { ...zone, barrelUsedTurn: state.turnNumber } : zone),
    log: appendLog(state.log, `CPUのリボルバー・ドラゴンが効果を発動。コイントスは表${result.heads}・裏${3 - result.heads}。${result.destroys ? `${targetName}を破壊。` : "破壊できなかった。"}`),
  };
  if (!result.destroys) return resolved;
  resolved = {
    ...resolved,
    playerField: resolved.playerField.filter((_, index) => index !== targetIndex),
    playerSpellTrap: discardEquips(resolved.playerSpellTrap, [target]),
    playerGraveyard: [...resolved.playerGraveyard, ...graveCards([target])],
  };
  return applyDeckSearchTriggers(resolved, [target]);
}

function spellDescription(id: string) {
  if (id === "mr-chain-energy") return "手札からカードを召喚・特殊召喚・発動・セットするたび、表側の枚数×500LPを支払う";
  if (id === "mr-curse-fiend") return "スタンバイフェイズに全モンスターの表示形式を入れ替え、このターンの表示形式変更を封じる";
  if (id === "mr-snatch-steal") return "相手モンスター1体のコントロールを得る。相手スタンバイフェイズごとに相手は1000LP回復";
  if (id === "mr-axe-despair") return "モンスター1体のATKを1000アップ";
  if (id === "mr-black-pendant") return "ATKを500アップ。フィールドから墓地へ送られた時、相手に500ダメージ";
  if (id === "mr-horn-light") return "モンスター1体のDEFを800アップ";
  if (id === "mr-malevolent-nuzzler") return "モンスター1体のATKを700アップ";
  if (id === "stb-forest") return "表側の昆虫・獣・植物・獣戦士族のATK・DEFを200アップ";
  if (id === "stb-wasteland") return "表側の恐竜・アンデット・岩石族のATK・DEFを200アップ";
  if (id === "stb-mountain") return "表側のドラゴン・鳥獣・雷族のATK・DEFを200アップ";
  if (id === "stb-sogen") return "表側の戦士・獣戦士族のATK・DEFを200アップ";
  if (id === "stb-umi") return "魚・海竜・雷・水族を200強化し、機械・炎族を200弱体化";
  if (id === "stb-yami") return "魔法使い・悪魔族を200強化し、天使族を200弱体化";
  if (id === "vol7-germ-infection") return "機械族以外に装備し、装備モンスターのATKをスタンバイフェイズ毎に300ダウン";
  if (id === "vol7-paralyzing-potion") return "機械族以外に装備し、装備モンスターの攻撃を封じる";
  if (id === "vol7-sword-deep-seated") return "ATK・DEFを500アップし、墓地へ送られた時デッキの一番上へ戻る";
  if (id === "bo7-magnetic-ring") return "モンスター1体のATK・DEFを500ダウンし、攻撃対象をそのモンスターに限定";
  if (id === "bo7-doping") return "モンスター1体のATKを700アップ。スタンバイフェイズごとに200ダウン";
  if (EQUIP_RULES[id]) return id.startsWith("bo2-")
    ? `${EQUIP_RULES[id]}モンスター1体のATKを400アップし、DEFを200ダウン`
    : `${EQUIP_RULES[id]}1体のATK・DEFを300アップ`;
  if (id === "vol1-dark-hole") return "フィールドのモンスターをすべて破壊";
  if (id === "stb-raigeki") return "相手フィールドのモンスターをすべて破壊";
  const effect = simpleSpellEffect(id);
  if (effect?.gain) return `自分のLPを${effect.gain}回復`;
  if (effect?.damage) return `相手に${effect.damage}ダメージ${effect.selfDamage ? `、自分に${effect.selfDamage}ダメージ` : ""}`;
  if (id === "vol2-swords-revealing-light") return "相手モンスターを表にし、相手の攻撃を3ターン封じる";
  if (id === "vol2-monster-reborn") return "自分または相手の墓地からモンスター1体を特殊召喚";
  if (id === "vol2-de-spell") return "フィールドのカード1枚を確認し、魔法カードなら破壊";
  if (id === "stb-remove-trap") return "表側表示でフィールドに残っている罠カード1枚を破壊";
  if (id === "vol1-fissure") return "相手の表側モンスターのうちATKが一番低い1体を破壊";
  if (id === "vol3-pot-of-greed") return "デッキからカードを2枚ドロー";
  if (id === "mr-upstart-goblin") return "1枚ドローし、相手は1000LP回復";
  if (id === "mr-mystical-space-typhoon") return "フィールドの魔法・罠カード1枚を破壊";
  if (id === "mr-giant-trunade") return "フィールドの魔法・罠カードをすべて持ち主の手札へ戻す";
  if (id === "mr-gravekeepers-servant") return "相手はデッキの一番上を墓地へ送らなければ攻撃できない";
  if (id === "mr-toll") return "お互いは500LPを払わなければ攻撃できない";
  if (id === "mr-final-destiny") return "手札を5枚捨て、フィールドのカードをすべて破壊";
  if (id === "mr-confiscation") return "1000LPを払い、相手の手札を1枚選んで捨てる";
  if (id === "mr-delinquent-duo") return "1000LPを払い、相手の手札を2枚捨てる";
  if (id === "mr-forceful-sentry") return "相手の手札を1枚選んでデッキに戻す";
  if (id === "mr-painful-choice") return "デッキから5枚を公開し、相手が選んだ1枚を手札へ、残りを墓地へ送る";
  if (id === "mr-darkness-approaches") return "手札を2枚捨て、表側表示モンスター1体を表示形式を変えずに裏側表示にする";
  if (id === "mr-tailor-fickle") return "フィールドの装備魔法1枚を、装備可能な別のモンスターへ移し替える";
  if (id === "vol3-stop-defense") return "相手の守備表示モンスター1体を攻撃表示に変更";
  if (id === "vol3-gravedigger-ghoul") return "相手の墓地のモンスターを2体まで除外";
  if (id === "vol4-elegant-egotist") return "ハーピィ・レディがいる時、手札・デッキからハーピィ1体を特殊召喚";
  if (id === "vol5-tribute-doomed") return "手札を1枚捨て、フィールドのモンスター1体を破壊する";
  if (id === "vol5-soul-release") return "自分・相手の墓地からカードを合計5枚まで除外する";
  if (id === "vol5-cheerful-coffin") return "手札のモンスターを3枚まで墓地へ送る";
  if (id === "vol5-change-heart") return "相手モンスター1体のコントロールをターン終了時まで得る";
  if (id === "vol7-stop-attack") return "相手の表側攻撃表示モンスター1体を表側守備表示に変更";
  if (id === "vol7-shield-sword") return "現在表側表示の全モンスターの元々のATKとDEFをターン終了時まで入れ替える";
  if (id === "bo2-light-reveal") return "相手の裏側表示モンスターをすべて表側にして確認する。リバース効果は発動しない";
  if (id === "bo2-amateur-spy") return "相手の手札を1枚選んで確認する";
  if (id === "bo3-ancient-telescope") return "相手のデッキの上から5枚を確認する";
  if (id === "bo4-graceful-charity") return "3枚ドローし、その後手札から2枚捨てる";
  if (id === "bo6-revolution") return "相手の手札1枚につき200ダメージを与える";
  if (id === "bo6-fusion-sage") return "デッキから「融合」1枚を手札に加える";
  if (id === "bo7-share-pain") return "自分のモンスター1体を生け贄にし、相手にもモンスター1体を生け贄にさせる";
  if (id === "ex-039") return "このターンに自分のモンスターが墓地へ送られている場合、デッキからATK1500以下のモンスター1体を特殊召喚する";
  if (id === "ex-085") return "ロード・オブ・ドラゴンが表側表示の時、双方は手札からドラゴン族を最大2体ずつ特殊召喚できる";
  if (id === "stb-polymerization" || id === "vol6-polymerization") return "手札・フィールドの決められた素材を墓地へ送り、融合デッキから融合召喚する";
  if (id.startsWith("vol4-")) return "効果処理は次の更新で対応";
  return "";
}

function isSpellImplemented(id: string) {
  return Boolean(EQUIP_RULES[id])
    || Boolean(simpleSpellEffect(id))
    || [
      "vol1-dark-hole",
      "stb-raigeki",
      "vol1-fissure",
      "vol2-swords-revealing-light",
      "vol2-monster-reborn",
      "vol2-de-spell",
      "vol3-pot-of-greed",
      "mr-upstart-goblin",
      "mr-curse-fiend",
      "mr-mystical-space-typhoon",
      "mr-giant-trunade",
      "mr-gravekeepers-servant",
      "mr-toll",
      "mr-chain-energy",
      "mr-final-destiny",
      "mr-confiscation",
      "mr-delinquent-duo",
      "mr-forceful-sentry",
      "mr-rush-recklessly",
      "mr-reliable-guardian",
      "mr-painful-choice",
      "mr-darkness-approaches",
      "mr-tailor-fickle",
      "vol3-stop-defense",
      "vol3-gravedigger-ghoul",
      "vol4-elegant-egotist",
      "vol5-tribute-doomed",
      "vol5-soul-release",
      "vol5-cheerful-coffin",
      "vol5-change-heart",
      "vol7-stop-attack",
      "vol7-shield-sword",
      "bo2-light-reveal",
      "bo2-amateur-spy",
      "bo3-ancient-telescope",
      "bo4-graceful-charity",
      "bo6-revolution",
      "bo6-fusion-sage",
      "bo7-share-pain",
      "ex-039",
      "stb-remove-trap",
      "stb-polymerization",
      "vol6-polymerization",
      "ex-085",
      ...FIELD_SPELL_IDS,
    ].includes(id);
}

function trapDescription(id: string) {
  if (id === "vol1-trap-hole") return "ATK1000以上で召喚された相手モンスターを破壊";
  if (id === "vol7-mirror-force") return "相手の攻撃宣言時、相手の攻撃表示モンスターをすべて破壊";
  if (id === "vol7-robbin-goblin") return "自分のモンスターが戦闘ダメージを与えるたび、相手の手札をランダムに1枚捨てる";
  if (id === "vol5-anti-raigeki") return "相手のサンダー・ボルトを無効にし、相手モンスターをすべて破壊";
  if (id === "vol5-call-darkness") return "死者蘇生を使用できなくし、死者蘇生で蘇ったモンスターを墓地へ送る";
  if (id === "vol5-fake-trap") return "自分の罠カードが破壊される時、代わりにこのカードを破壊する";
  if (id === "stb-dragon-capture-jar") return "表側のドラゴン族を守備表示にし、表示形式の変更を封じる";
  if (id === "stb-two-pronged-attack") return "自分のモンスター2体と相手のモンスター1体を選び、同時に破壊する";
  if (id === "vol6-seven-tools") return "1000LPを払い、罠カードの発動を無効にして破壊する";
  if (id === "vol6-magic-jammer") return "手札を1枚捨て、魔法カードの発動を無効にして破壊する";
  if (id === "vol6-horn-heaven") return "自分のモンスター1体を生け贄にし、モンスターの召喚を無効にして破壊する";
  if (id === "vol6-solemn-judgment") return "LPを半分払い、魔法・罠の発動またはモンスターの召喚を無効にして破壊する";
  if (id === "bo5-just-desserts") return "相手フィールドのモンスター1体につき、相手に500ダメージを与える";
  if (id === "bo3-reinforcements") return "ダメージステップ中、自分の表側モンスター1体のATKをターン終了まで500アップ";
  if (id === "bo3-castle-walls") return "ダメージステップ中、自分の表側モンスター1体のDEFをターン終了まで500アップ";
  if (id === "bo3-ultimate-offering") return "500LPを払うことで、通常召喚に加えてモンスター1体を召喚できる";
  if (id === "bo3-reverse-trap") return "ターン終了までATK・DEFをアップ・ダウンさせる効果を反転する";
  if (id === "bo4-white-hole") return "相手のブラック・ホールにチェーンし、自分のモンスターの破壊を防ぐ";
  if (id === "bo4-call-grave") return "相手の死者蘇生にチェーンし、その効果を無効にする";
  if (id === "bo5-royal-decree") return "表側表示の間、このカード以外のフィールドの罠効果を無効にする";
  if (id === "bo6-magic-thorn") return "相手が効果で手札を捨てるたび、1枚につき500ダメージ";
  if (id === "bo7-griffin-wing") return "相手のハーピィの羽根帚にチェーンし、代わりに相手の魔法・罠を破壊する";
  if (id === "mr-snake-fang") return "表側表示モンスター1体のDEFをターン終了まで500ダウン";
  if (id === "mr-spellbinding-circle") return "相手の表側表示モンスター1体の攻撃と表示形式の変更を封じる";
  return "効果処理は次の更新で対応";
}

function isTrapImplemented(id: string) {
  return id === "vol1-trap-hole" || id === "vol5-anti-raigeki" || id === "vol5-call-darkness" || id === "vol5-fake-trap" || id === "stb-dragon-capture-jar" || id === "stb-two-pronged-attack" || id === "vol6-seven-tools" || id === "vol6-magic-jammer" || id === "vol6-horn-heaven" || id === "vol6-solemn-judgment" || id === "vol7-mirror-force" || id === "vol7-robbin-goblin" || id === "bo5-just-desserts" || id === "bo3-reinforcements" || id === "bo3-castle-walls" || id === "bo3-ultimate-offering" || id === "bo3-reverse-trap" || id === "bo4-white-hole" || id === "bo4-call-grave" || id === "bo5-royal-decree" || id === "bo6-magic-thorn" || id === "bo7-griffin-wing" || id === "mr-snake-fang" || id === "mr-spellbinding-circle" || id === "ex-040";
}

function monsterDescription(id: string) {
  const recipe = fusionRecipe(id);
  if (recipe) return `融合素材：${recipe.map((materialId) => cardById.get(materialId)?.name ?? materialId).join(" ＋ ")}`;
  if (id === "mr-ameba") return "表側表示でコントロールが相手に移った時、そのコントローラーに2000ダメージ";
  if (id === "mr-griggle") return "表側表示でコントロールが相手に移った時、元々の持ち主は3000LP回復";
  if (id === "mr-weather-report") return "リバース：相手の光の護封剣を全て破壊し、このターンのバトルフェイズを2回行う";
  if (id === "mr-invader-throne") return "リバース：バトルフェイズ以外に相手モンスター1体とこのカードのコントロールを交換する";
  if (id === "mr-hiros-shadow-scout") return "リバース：相手は3枚ドローし、その中の魔法カードを全て墓地へ捨てる";
  if (id === "mr-penguin-knight") return "相手のカード効果でデッキから墓地へ送られた時、自分の墓地を全てデッキに戻してシャッフルする";
  if (id === "vol3-reaper-cards") return "リバース：フィールドの罠カード1枚を確認し、罠カードなら破壊する";
  if (id === "vol3-armed-ninja") return "リバース：フィールドの魔法カード1枚を確認し、魔法カードなら破壊する";
  if (id === "vol3-man-eater-bug") return "リバース：フィールドのモンスター1体を破壊する";
  if (id === "vol3-skelengel") return "リバース：デッキからカードを1枚ドローする";
  if (id === "vol3-hane-hane") return "リバース：フィールドのモンスター1体を持ち主の手札に戻す";
  if (id === "vol4-magician-faith") return "リバース：自分の墓地から魔法カード1枚を選び、手札に戻す";
  if (id === "vol4-mask-darkness") return "リバース：自分の墓地から罠カード1枚を選び、手札に戻す";
  if (id === "vol4-harpie-sisters") return "通常召喚できず、万華鏡－華麗なる分身－の効果で特殊召喚する";
  if (id === "vol4-cocoon-evolution") return "手札から表側のプチモスに装備でき、ATK 0・DEF 2000を適用する";
  if (id === "vol6-sangan") return "フィールドから墓地へ送られた時、デッキからATK1500以下のモンスター1体を手札に加える";
  if (id === "vol6-witch-black-forest") return "フィールドから墓地へ送られた時、デッキからDEF1500以下のモンスター1体を手札に加える";
  if (id === "vol6-cannon-soldier") return "自分フィールドのモンスター1体を生け贄にするたび、相手に500ダメージを与える";
  if (id === "vol6-dragon-piper") return "リバース：ドラゴン族・封印の壺を破壊し、表側のドラゴン族を全て攻撃表示にする";
  if (id === "ex-033") return "リバース：相手フィールドのセットカードをすべて確認する";
  if (id === "ex-034") return "このカードを攻撃したモンスターが戦闘後もフィールドに残る場合、持ち主の手札へ戻す";
  if (id === "ex-084") return "表側表示で存在する限り、フィールドのドラゴン族はカード効果の対象にできない";
  return "";
}

function removeCardCopies(cardIds: string[], cardId: string, count: number) {
  let remaining = count;
  return cardIds.filter((id) => {
    if (id !== cardId || remaining <= 0) return true;
    remaining -= 1;
    return false;
  });
}

function removeEquippedCard(field: ZoneCard[], spellId: string) {
  let removed = false;
  return field.map((zone) => ({
    ...zone,
    equipped: zone.equipped.filter((id) => {
      if (removed || id !== spellId) return true;
      removed = true;
      return false;
    }),
  }));
}

function applyBlackPendantGraveTriggers(previous: DuelState, next: DuelState): DuelState {
  const countInGraves = (state: DuelState) => [...state.playerGraveyard, ...state.cpuGraveyard]
    .filter((id) => id === "mr-black-pendant").length;
  const triggers = blackPendantTriggerCounts(
    previous.playerSpellTrap,
    previous.cpuSpellTrap,
    next.playerSpellTrap,
    next.cpuSpellTrap,
    Math.max(0, countInGraves(next) - countInGraves(previous)),
  );
  if (triggers.player === 0 && triggers.cpu === 0) return next;
  const playerDamage = triggers.cpu * 500;
  const cpuDamage = triggers.player * 500;
  const playerLp = Math.max(0, next.playerLp - playerDamage);
  const cpuLp = Math.max(0, next.cpuLp - cpuDamage);
  let log = next.log;
  if (cpuDamage > 0) log = appendLog(log, `黒いペンダントの効果が発動。CPUに${cpuDamage}ダメージ。`);
  if (playerDamage > 0) log = appendLog(log, `CPUの黒いペンダントの効果が発動。プレイヤーに${playerDamage}ダメージ。`);
  return {
    ...next,
    playerLp,
    cpuLp,
    result: playerLp === 0 && cpuLp === 0 ? "draw" : cpuLp === 0 ? "win" : playerLp === 0 ? "lose" : next.result,
    log,
  };
}

function trackMonstersSentToGrave(previous: DuelState, next: DuelState): DuelState {
  const previousGraves = [...previous.playerGraveyard, ...previous.cpuGraveyard];
  const nextGraves = [...next.playerGraveyard, ...next.cpuGraveyard];
  const playerSent = monsterSentFromFieldToGrave(
    previous.playerField.map((zone) => zone.id),
    next.playerField.map((zone) => zone.id),
    previousGraves,
    nextGraves,
  );
  const cpuSent = monsterSentFromFieldToGrave(
    previous.cpuField.map((zone) => zone.id),
    next.cpuField.map((zone) => zone.id),
    previousGraves,
    nextGraves,
  );
  if (!playerSent && !cpuSent) return next;
  return {
    ...next,
    playerMonsterSentToGraveTurn: playerSent ? next.turnNumber : next.playerMonsterSentToGraveTurn,
    cpuMonsterSentToGraveTurn: cpuSent ? next.turnNumber : next.cpuMonsterSentToGraveTurn,
  };
}

function lastWillTargets(deck: string[]) {
  return deck.flatMap((id, index) => {
    const card = cardById.get(id);
    return card?.cardType === "monster" && !card.fusion && card.id !== "mr-relinquished" && (card.atk ?? 0) <= 1500
      ? [{ id, index }]
      : [];
  });
}

function appendLog(log: string[], entry: string) {
  return [...log, entry].slice(-30);
}
