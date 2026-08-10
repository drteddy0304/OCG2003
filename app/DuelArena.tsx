"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardById, type Card } from "./card-data";
import { advanceSwordsTurns, battleDamageEffect, battleOutcome, bestCpuBattleTargetIndex, canActivateChangeOfHeart, canActivateCheerfulCoffin, canActivateTributeToDoomed, canBlastJugglerTarget, canMonsterAttackDirectly, canNormalSummonMonster, canRespondWithAntiRaigeki, canSpecialSummonLarvaeMoth, competitiveCpuDeck, deSpellDestroys, equipRules, equippedMonsterStats, firstSpellTargetIndex, flipEffect, guardianAdjustedAttack, isElegantEgotistTarget, isGuardianMonster, isMonsterRebornBlocked, moveDeckCard, shouldCpuActivateSwords, shouldCpuUseSimpleSpell, shouldPlayerChooseFlipTarget, simpleSpellEffect, strongestAttackIndex, takeGraveyardCard, toggleLimitedSelection } from "./duel-rules.mjs";
import { feedbackForMessage } from "./duel-feedback.mjs";
import { playDuelSound, unlockDuelAudio, type DuelSound } from "./duel-audio";

const DECK_STORAGE_KEY = "ocg2003.deck.main.v1";
const MIN_DECK_SIZE = 40;
const STARTING_LP = 8000;
const FIELD_LIMIT = 5;

type Position = "attack" | "defense";
type Side = "player" | "cpu";
type Result = "win" | "lose" | null;
type Phase = "main1" | "battle" | "main2";
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
type PendingGuardianResponse = {
  attackerIndex: number;
  defenderIndex: number;
  guardianId: string;
};
type PendingAntiRaigeki = {
  trapIndex: number;
};
type PendingBlastJuggler = {
  monsterIndex: number;
  selected: string[];
};
type PendingFlipTarget = {
  monsterId: string;
  effect: "destroy-monster" | "return-monster" | "destroy-spell" | "destroy-trap" | "recover-spell" | "recover-trap";
};
type PendingDeckReorder = {
  monsterId: string;
  cards: string[];
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
type DuelFeedback = { kind: DuelSound; title: string; detail: string; message: string; duration: number };

type ZoneCard = {
  id: string;
  position: Position;
  faceDown: boolean;
  attacked: boolean;
  equipped: string[];
  summonedTurn: number;
  positionChanged: boolean;
  guardianEffectUsed?: boolean;
  blastPromptedTurn?: number;
  cocoonEquippedTurn?: number;
  controlReturn?: Side;
  revivedByMonsterReborn?: boolean;
};

type DuelState = {
  playerDeck: string[];
  cpuDeck: string[];
  playerHand: string[];
  cpuHand: string[];
  playerField: ZoneCard[];
  cpuField: ZoneCard[];
  playerSpellTrap: string[];
  playerSwordsTurns: number[];
  cpuSpellTrap: string[];
  cpuSwordsTurns: number[];
  playerGraveyard: string[];
  cpuGraveyard: string[];
  playerLp: number;
  cpuLp: number;
  turn: Side;
  turnNumber: number;
  phase: Phase;
  normalSummoned: boolean;
  result: Result;
  pendingTrapResponse: PendingTrapResponse | null;
  pendingGuardianResponse: PendingGuardianResponse | null;
  pendingBlastJuggler: PendingBlastJuggler | null;
  pendingAntiRaigeki: PendingAntiRaigeki | null;
  pendingFlipTarget: PendingFlipTarget | null;
  pendingDeckReorder: PendingDeckReorder | null;
  log: string[];
};

const CPU_DECK = [...competitiveCpuDeck];
const EQUIP_RULES = equipRules;

export function DuelArena({
  collection,
  onReward,
}: {
  collection: Record<string, number>;
  onReward: (cardId: string) => boolean;
}) {
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<number | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<number | null>(null);
  const [pendingTribute, setPendingTribute] = useState<PendingTribute | null>(null);
  const [pendingReborn, setPendingReborn] = useState<number | null>(null);
  const [pendingDeSpell, setPendingDeSpell] = useState<number | null>(null);
  const [pendingEgotist, setPendingEgotist] = useState<number | null>(null);
  const [pendingTributeToDoomed, setPendingTributeToDoomed] = useState<PendingTributeToDoomed | null>(null);
  const [pendingSoulRelease, setPendingSoulRelease] = useState<PendingSoulRelease | null>(null);
  const [pendingCheerfulCoffin, setPendingCheerfulCoffin] = useState<PendingCheerfulCoffin | null>(null);
  const [pendingChangeOfHeart, setPendingChangeOfHeart] = useState<number | null>(null);
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
  const isPlayerMainPhase = duel?.turn === "player"
    && !duel.pendingGuardianResponse
    && !duel.pendingBlastJuggler
    && !duel.pendingAntiRaigeki
    && !duel.pendingFlipTarget
    && !duel.pendingDeckReorder
    && pendingTributeToDoomed === null
    && pendingSoulRelease === null
    && pendingCheerfulCoffin === null
    && pendingChangeOfHeart === null
    && pendingEgotist === null
    && (duel.phase === "main1" || duel.phase === "main2");
  const feedbackMessage = duel
    ? cpuPlayback
      ? cpuPlayback.messages[Math.min(cpuPlayback.index, cpuPlayback.messages.length - 1)] ?? ""
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
    const playerCards = expandDeck(counts);
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
    setPendingChangeOfHeart(null);
    setCpuPlayback(null);
    setFeedbackQueue([]);
    setActiveFeedback(null);
    setDuel({
      playerDeck: shuffledPlayer.slice(6),
      cpuDeck: shuffledCpu.slice(5),
      playerHand: playerDraw,
      cpuHand: cpuDraw,
      playerField: [],
      cpuField: [],
      playerSpellTrap: [],
      playerSwordsTurns: [],
      cpuSpellTrap: [],
      cpuSwordsTurns: [],
      playerGraveyard: [],
      cpuGraveyard: [],
      playerLp: STARTING_LP,
      cpuLp: STARTING_LP,
      turn: "player",
      turnNumber: 1,
      phase: "main1",
      normalSummoned: false,
      result: null,
      pendingTrapResponse: null,
      pendingGuardianResponse: null,
      pendingBlastJuggler: null,
      pendingAntiRaigeki: null,
      pendingFlipTarget: null,
      pendingDeckReorder: null,
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
    nextField.push({
      id,
      position,
      faceDown: position === "defense",
      attacked: false,
      equipped: [],
      summonedTurn: duel.turnNumber,
      positionChanged: false,
    });
    let nextState: DuelState = {
      ...duel,
      playerHand: duel.playerHand.filter((_, index) => index !== handIndex),
      playerField: nextField,
      playerSpellTrap: discardEquips(duel.playerSpellTrap, playerTributes),
      cpuSpellTrap: discardEquips(duel.cpuSpellTrap, returnedTributes),
      playerGraveyard: [...duel.playerGraveyard, ...graveCards(playerTributes)],
      cpuGraveyard: [...duel.cpuGraveyard, ...graveCards(returnedTributes)],
      normalSummoned: true,
      log: appendLog(duel.log, `${card.name}を${position === "attack" ? "攻撃表示で召喚" : "裏側守備表示でセット"}。${tributeNames.length ? `（${tributeNames.join("、")}をリリース）` : ""}`),
    };
    const cpuTrapIndex = nextState.cpuSpellTrap.indexOf("vol1-trap-hole");
    if (position === "attack" && (card.atk ?? 0) >= 1000 && cpuTrapIndex >= 0) {
      nextState = {
        ...nextState,
        playerField: nextState.playerField.filter((_, index) => index !== nextState.playerField.length - 1),
        cpuSpellTrap: nextState.cpuSpellTrap.filter((_, index) => index !== cpuTrapIndex),
        playerGraveyard: [...nextState.playerGraveyard, card.id],
        cpuGraveyard: [...nextState.cpuGraveyard, "vol1-trap-hole"],
        log: appendLog(nextState.log, `CPUが落とし穴を発動。${card.name}を破壊。`),
      };
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
    const nextPosition: Position = zone.position === "defense" ? "attack" : "defense";
    let next: DuelState = {
      ...duel,
      playerField: duel.playerField.map((item, fieldIndex) =>
        fieldIndex === index
          ? { ...item, position: nextPosition, faceDown: false, positionChanged: true }
          : item,
      ),
      log: appendLog(
        duel.log,
        `${cardById.get(zone.id)?.name ?? "モンスター"}を${nextPosition === "attack" ? "攻撃" : "守備"}表示に変更。`,
      ),
    };
    if (zone.faceDown) next = resolveFlipEffect(next, "player", zone.id);
    setDuel(next);
    setSelectedAttacker(null);
  }

  function useSpell(handIndex: number) {
    if (!duel || !isPlayerMainPhase || duel.result || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "spell") return;
    if (EQUIP_RULES[card.id]) {
      if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
      setSelectedEquip(handIndex);
      setSelectedAttacker(null);
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

    if (card.id === "vol2-de-spell") {
      if (duel.playerSpellTrap.length + duel.cpuSpellTrap.length === 0) return;
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
      if (!canActivateChangeOfHeart(duel.playerField.length, duel.cpuField.length, FIELD_LIMIT)) return;
      setPendingChangeOfHeart(handIndex);
      setSelectedAttacker(null);
      setSelectedEquip(null);
      return;
    }

    if (card.id === "vol2-swords-revealing-light") {
      if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
      const next = removeHandCard(duel, handIndex);
      let revealed: DuelState = {
        ...next,
        cpuField: next.cpuField.map((zone) => ({ ...zone, faceDown: false })),
        playerSpellTrap: [...next.playerSpellTrap, card.id],
        playerSwordsTurns: [...next.playerSwordsTurns, 3],
        log: appendLog(next.log, "光の護封剣を発動。相手モンスターを表にし、3ターン攻撃を封じます。"),
      };
      for (const zone of next.cpuField.filter((item) => item.faceDown)) {
        revealed = resolveFlipEffect(revealed, "cpu", zone.id);
      }
      setDuel(revealed);
      return;
    }

    let next = {
      ...removeHandCard(duel, handIndex),
      playerGraveyard: [...duel.playerGraveyard, card.id],
    };
    if (card.id === "vol1-dark-hole") {
      const returnedMonsters = next.playerField.filter((zone) => zone.controlReturn === "cpu");
      const playerMonsters = next.playerField.filter((zone) => zone.controlReturn !== "cpu");
      next = {
        ...next,
        playerField: [],
        cpuField: [],
        playerSpellTrap: discardEquips(next.playerSpellTrap, playerMonsters),
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, [...next.cpuField, ...returnedMonsters]),
        playerGraveyard: [...next.playerGraveyard, ...graveCards(playerMonsters)],
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards(next.cpuField), ...graveCards(returnedMonsters)],
      };
    } else if (card.id === "stb-raigeki") {
      next = {
        ...next,
        cpuField: [],
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, next.cpuField),
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards(next.cpuField)],
      };
    } else if (simpleSpellEffect(card.id)) {
      const effect = simpleSpellEffect(card.id)!;
      next = {
        ...next,
        playerLp: next.playerLp + effect.gain,
        cpuLp: next.cpuLp - effect.damage,
      };
      if (next.cpuLp <= 0) next.result = "win";
    } else if (card.id === "vol1-fissure") {
      const target = lowestFaceUpAttackIndex(next.cpuField);
      if (target === null) return;
      next = {
        ...next,
        cpuField: next.cpuField.filter((_, index) => index !== target),
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, [next.cpuField[target]]),
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards([next.cpuField[target]])],
      };
    } else if (card.id === "vol3-pot-of-greed") {
      if (next.playerDeck.length < 2) return;
      next = {
        ...next,
        playerHand: [...next.playerHand, ...next.playerDeck.slice(0, 2)],
        playerDeck: next.playerDeck.slice(2),
      };
    } else if (card.id === "vol3-stop-defense") {
      const target = next.cpuField.findIndex((zone) => zone.position === "defense");
      if (target < 0) return;
      const targetZone = next.cpuField[target];
      next = {
        ...next,
        cpuField: next.cpuField.map((zone, index) => index === target
          ? { ...zone, position: "attack", faceDown: false, positionChanged: true }
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
    } else return;
    next.log = appendLog(next.log, `${card.name}を発動。`);
    setDuel(next);
  }

  function summonHarpie(source: "hand" | "deck", cardId: string, position: Position) {
    if (!duel || pendingEgotist === null || !isElegantEgotistTarget(cardId)) return;
    if (duel.playerHand[pendingEgotist] !== "vol4-elegant-egotist" || duel.playerField.length >= FIELD_LIMIT) return;
    if (!duel.playerField.some((zone) => !zone.faceDown && zone.id === "vol4-harpie-lady")) return;

    const handWithoutSpell = duel.playerHand.filter((_, index) => index !== pendingEgotist);
    const sourceCards = source === "hand" ? handWithoutSpell : duel.playerDeck;
    const targetIndex = sourceCards.indexOf(cardId);
    if (targetIndex < 0) return;
    const nextHand = source === "hand"
      ? handWithoutSpell.filter((_, index) => index !== targetIndex)
      : handWithoutSpell;
    const nextDeck = source === "deck"
      ? duel.playerDeck.filter((_, index) => index !== targetIndex)
      : duel.playerDeck;
    const target = cardById.get(cardId);
    setDuel({
      ...duel,
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
      log: appendLog(duel.log, `万華鏡－華麗なる分身－を発動。${target?.name ?? "ハーピィ"}を${source === "hand" ? "手札" : "デッキ"}から特殊召喚。`),
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
    setDuel({
      ...removeHandCard(duel, pendingReborn),
      playerField: [
        ...duel.playerField,
        {
          id: taken.cardId,
          position,
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
      log: appendLog(duel.log, `死者蘇生を発動。${monster.name}を${position === "attack" ? "攻撃" : "守備"}表示で特殊召喚。`),
    });
    setPendingReborn(null);
  }

  function resolveDeSpell(targetSide: Side, targetIndex: number) {
    if (!duel || pendingDeSpell === null || duel.playerHand[pendingDeSpell] !== "vol2-de-spell") return;
    const targetZones = targetSide === "player" ? duel.playerSpellTrap : duel.cpuSpellTrap;
    const targetId = targetZones[targetIndex];
    const target = cardById.get(targetId);
    if (!target) return;
    let next: DuelState = {
      ...removeHandCard(duel, pendingDeSpell),
      playerGraveyard: [...duel.playerGraveyard, "vol2-de-spell"],
    };
    if (deSpellDestroys(target.cardType, target.id)) {
      if (targetSide === "player") {
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
      next.log = appendLog(next.log, `魔法除去を発動。${target.name}を破壊。`);
    } else {
      next.log = appendLog(next.log, `魔法除去で伏せカードを確認。${target.name}は罠カードのため元に戻します。`);
    }
    setDuel(next);
    setPendingDeSpell(null);
  }

  function resolveTributeToDoomed(targetSide: Side, targetIndex: number) {
    if (!duel || !pendingTributeToDoomed || pendingTributeToDoomed.discardIndex === null) return;
    const { spellIndex, discardIndex } = pendingTributeToDoomed;
    if (duel.playerHand[spellIndex] !== "vol5-tribute-doomed" || discardIndex === spellIndex) return;
    const discardedId = duel.playerHand[discardIndex];
    const targetField = targetSide === "player" ? duel.playerField : duel.cpuField;
    const target = targetField[targetIndex];
    if (!discardedId || !target) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    let next: DuelState = {
      ...duel,
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
    setDuel({
      ...duel,
      playerHand: duel.playerHand.filter((_, index) => index !== pendingCheerfulCoffin.spellIndex && !selectedIndexes.has(index)),
      playerGraveyard: [...duel.playerGraveyard, "vol5-cheerful-coffin", ...discarded],
      log: appendLog(duel.log, `陽気な葬儀屋を発動。手札からモンスター${discarded.length}枚を墓地へ送った。`),
    });
    setPendingCheerfulCoffin(null);
  }

  function resolveChangeOfHeart(targetIndex: number) {
    if (!duel || pendingChangeOfHeart === null) return;
    if (duel.playerHand[pendingChangeOfHeart] !== "vol5-change-heart") return;
    if (!canActivateChangeOfHeart(duel.playerField.length, duel.cpuField.length, FIELD_LIMIT)) return;
    const target = duel.cpuField[targetIndex];
    if (!target) return;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    setDuel({
      ...removeHandCard(duel, pendingChangeOfHeart),
      playerField: [
        ...duel.playerField,
        { ...target, attacked: false, positionChanged: false, controlReturn: "cpu" },
      ],
      cpuField: duel.cpuField.filter((_, index) => index !== targetIndex),
      playerGraveyard: [...duel.playerGraveyard, "vol5-change-heart"],
      log: appendLog(duel.log, `心変わりを発動。${targetName}のコントロールをターン終了時まで得た。`),
    });
    setPendingChangeOfHeart(null);
  }

  function equipSpell(fieldIndex: number) {
    if (!duel || !isPlayerMainPhase || selectedEquip === null) return;
    const spell = cardById.get(duel.playerHand[selectedEquip]);
    const zone = duel.playerField[fieldIndex];
    const monster = zone ? cardById.get(zone.id) : null;
    if (!spell || !zone || zone.faceDown || !monster || !canEquip(spell.id, monster) || duel.playerSpellTrap.length >= FIELD_LIMIT) return;
    setDuel({
      ...removeHandCard(duel, selectedEquip),
      playerField: duel.playerField.map((item, index) =>
        index === fieldIndex
          ? {
              ...item,
              equipped: [...item.equipped, spell.id],
              ...(spell.id === "vol4-cocoon-evolution" ? { cocoonEquippedTurn: duel.turnNumber } : {}),
            }
          : item,
      ),
      playerSpellTrap: [...duel.playerSpellTrap, spell.id],
      log: appendLog(
        duel.log,
        spell.id === "vol4-cocoon-evolution"
          ? `進化の繭を${monster.name}に装備。ATK 0・DEF 2000を適用。`
          : `${spell.name}を${monster.name}に装備。ATK・DEFが300アップ。`,
      ),
    });
    setSelectedEquip(null);
  }

  function summonLarvaeMoth(handIndex: number, position: Position) {
    if (!duel || !isPlayerMainPhase || duel.playerHand[handIndex] !== "vol5-larvae-moth") return;
    const targetIndex = larvaeMothTargetIndex(duel);
    if (targetIndex < 0) return;
    const petitMoth = duel.playerField[targetIndex];
    setDuel({
      ...duel,
      playerHand: duel.playerHand.filter((_, index) => index !== handIndex),
      playerField: [
        ...duel.playerField.filter((_, index) => index !== targetIndex),
        {
          id: "vol5-larvae-moth",
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
      log: appendLog(duel.log, `プチモスを生け贄にし、ラーバモスを${position === "attack" ? "攻撃" : "守備"}表示で特殊召喚。`),
    });
    setSelectedAttacker(null);
    setSelectedEquip(null);
  }

  function setTrap(handIndex: number) {
    if (!duel || !isPlayerMainPhase || duel.result || pendingReborn !== null || pendingDeSpell !== null || duel.playerSpellTrap.length >= FIELD_LIMIT) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "trap" || !isTrapImplemented(card.id)) return;
    if (card.id === "vol5-call-darkness") {
      const revivedPlayer = duel.playerField.filter((zone) => zone.revivedByMonsterReborn);
      const revivedCpu = duel.cpuField.filter((zone) => zone.revivedByMonsterReborn);
      setDuel({
        ...removeHandCard(duel, handIndex),
        playerField: duel.playerField.filter((zone) => !zone.revivedByMonsterReborn),
        cpuField: duel.cpuField.filter((zone) => !zone.revivedByMonsterReborn),
        playerSpellTrap: [...discardEquips(duel.playerSpellTrap, revivedPlayer), card.id],
        cpuSpellTrap: discardEquips(duel.cpuSpellTrap, revivedCpu),
        playerGraveyard: [...duel.playerGraveyard, ...graveCards(revivedPlayer)],
        cpuGraveyard: [...duel.cpuGraveyard, ...graveCards(revivedCpu)],
        log: appendLog(duel.log, `闇からの呼び声を発動。死者蘇生を封じ、蘇生されていたモンスター${revivedPlayer.length + revivedCpu.length}体を墓地へ送った。`),
      });
      return;
    }
    setDuel({
      ...removeHandCard(duel, handIndex),
      playerSpellTrap: [...duel.playerSpellTrap, card.id],
      log: appendLog(duel.log, "罠カードを1枚セット。"),
    });
  }

  function chooseAttacker(index: number) {
    if (!duel || duel.turn !== "player" || duel.phase !== "battle" || duel.turnNumber === 1 || duel.result || duel.cpuSwordsTurns.length > 0) return;
    const zone = duel.playerField[index];
    if (!zone || zone.position !== "attack" || zone.attacked) return;
    if (duel.cpuField.length === 0) {
      setDuel(resolveBattle(duel, "player", index, null));
      setSelectedAttacker(null);
      return;
    }
    setSelectedAttacker(index);
  }

  function attackTarget(targetIndex: number) {
    if (!duel || selectedAttacker === null) return;
    setDuel(resolveBattle(duel, "player", selectedAttacker, targetIndex));
    setSelectedAttacker(null);
  }

  function attackDirectly() {
    if (!duel || selectedAttacker === null) return;
    const attacker = duel.playerField[selectedAttacker];
    if (!attacker || !canMonsterAttackDirectly(attacker.id)) return;
    setDuel(resolveBattle(duel, "player", selectedAttacker, null));
    setSelectedAttacker(null);
  }

  function advancePhase() {
    if (!duel || duel.turn !== "player" || duel.result || duel.pendingFlipTarget || duel.pendingDeckReorder || duel.pendingBlastJuggler || pendingTribute || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null) return;
    setSelectedAttacker(null);
    setSelectedEquip(null);
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
      setDuel({ ...duel, phase: "main2", log: appendLog(duel.log, "メインフェイズ2へ。") });
      return;
    }
    endTurn();
  }

  function endTurn() {
    if (!duel || duel.turn !== "player" || duel.result || duel.pendingFlipTarget || duel.pendingDeckReorder || duel.pendingBlastJuggler || pendingTribute || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null) return;
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
    playerEnd = returnChangedMonsters(playerEnd);
    const cpuStart: DuelState = {
      ...playerEnd,
      turn: "cpu",
      turnNumber: playerEnd.turnNumber + 1,
      phase: "main1",
      log: appendLog(playerEnd.log, "ターン終了。CPUのターン。"),
    };
    const finalState = runCpuTurn(cpuStart);
    beginCpuPlayback(cpuStart, finalState, "ターン終了。CPUのターン。");
  }

  function beginCpuPlayback(startState: DuelState, finalState: DuelState, marker: string) {
    const markerIndex = finalState.log.lastIndexOf(marker);
    const messages = finalState.log
      .slice(markerIndex >= 0 ? markerIndex + 1 : Math.max(0, finalState.log.length - 6))
      .filter((message) => message !== "あなたのターン。1枚ドロー。");
    setDuel(startState);
    setCpuPlayback({
      finalState,
      messages: messages.length ? messages : ["CPUは行動せずターンを終了。"],
      index: 0,
    });
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
      resumed = {
        ...resumed,
        cpuField: resumed.cpuField.filter((_, index) => index !== pending.monsterIndex),
        playerSpellTrap: resumed.playerSpellTrap.filter((_, index) => index !== pending.trapIndex),
        cpuGraveyard: [...resumed.cpuGraveyard, pending.monsterId],
        playerGraveyard: [...resumed.playerGraveyard, "vol1-trap-hole"],
        log: appendLog(resumed.log, `落とし穴を発動。${monster?.name ?? "モンスター"}を破壊。`),
      };
    } else {
      resumed = { ...resumed, log: appendLog(resumed.log, "落とし穴を発動しませんでした。") };
    }
    const finalState = finishCpuTurn(resumed);
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
    resumed = resolveBattle(resumed, "cpu", pending.attackerIndex, pending.defenderIndex, activate);
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
    const finalState = continueCpuTurnAfterSpells(resumed);
    beginCpuPlayback(resumed, finalState, marker);
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
      index === monsterIndex || (playerIndexes.has(index) && canBlastJugglerTarget(zone.faceDown, effectiveAtk(zone))),
    );
    const destroyedCpu = duel.cpuField.filter((zone, index) =>
      cpuIndexes.has(index) && canBlastJugglerTarget(zone.faceDown, effectiveAtk(zone)),
    );
    const resolved: DuelState = {
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
    setDuel(openBlastJugglerPrompt(resolved));
  }

  function advanceCpuPlayback() {
    if (!cpuPlayback) return;
    if (cpuPlayback.index >= cpuPlayback.messages.length - 1) {
      setDuel(cpuPlayback.finalState);
      setCpuPlayback(null);
      return;
    }
    setCpuPlayback({ ...cpuPlayback, index: cpuPlayback.index + 1 });
  }

  function chooseFlipTarget(targetIndex: number) {
    if (!duel?.pendingFlipTarget) return;
    const resolved = resolvePendingFlipTarget(duel, targetIndex);
    if (duel.turn === "cpu") {
      const marker = "効果対象の選択が終了。";
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

  if (!duel) {
    return (
      <section className="duel-lobby">
        <p className="section-label">SINGLE DUEL</p>
        <h2>CPUデュエル</h2>
        <div className="duel-rule-card">
          <strong>VOL.1 + VOL.2 + VOL.3 強化CPU · BUILD 058</strong>
          <p>40枚の実戦向けデッキを使用し、勝てる戦闘と効果カードを優先します。</p>
        </div>
        <dl>
          <div><dt>自分のデッキ</dt><dd>{savedDeck.length}枚</dd></div>
          <div><dt>開始条件</dt><dd>40枚以上</dd></div>
          <div><dt>勝利報酬</dt><dd>CPUデッキから1枚</dd></div>
        </dl>
        <button className="duel-start" disabled={savedDeck.length < MIN_DECK_SIZE} onClick={startDuel}>
          {savedDeck.length >= MIN_DECK_SIZE ? "デュエル開始" : `あと${MIN_DECK_SIZE - savedDeck.length}枚必要`}
        </button>
        <button className="sound-toggle lobby-sound-toggle" onClick={toggleSound}>効果音 {soundEnabled ? "ON" : "OFF"}</button>
      </section>
    );
  }

  return (
    <section className={`duel-screen${activeFeedback ? ` action-${activeFeedback.kind}` : ""}`}>
      <div className="duel-hud">
        <div><span>CPU</span><strong>{Math.max(0, duel.cpuLp)}</strong><small>LP</small></div>
        <div className="turn-badge">TURN {duel.turnNumber}<b>{duel.turn === "player" ? "YOUR TURN" : "CPU TURN"}</b><button className="sound-toggle" onClick={toggleSound} aria-label={`効果音を${soundEnabled ? "オフ" : "オン"}にする`}>{soundEnabled ? "SOUND ON" : "SOUND OFF"}</button></div>
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
          const activeIndex = duel.phase === "main1" ? 2 : duel.phase === "battle" ? 3 : 4;
          return (
            <div className={index === activeIndex ? "active" : index < activeIndex ? "done" : ""} key={english}>
              <b>{english}</b><span>{japanese}</span>
            </div>
          );
        })}
      </div>
      <p className="phase-help">
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

      {cpuPlayback && (
        <div className="cpu-playback" aria-live="assertive">
          <div>
            <p className="section-label">CPU ACTION</p>
            <strong>{cpuPlayback.messages[Math.min(cpuPlayback.index, cpuPlayback.messages.length - 1)]}</strong>
            <span>{Math.min(cpuPlayback.index + 1, cpuPlayback.messages.length)} / {cpuPlayback.messages.length}</span>
            <div className="cpu-playback-actions">
              <button className="cpu-next" onClick={advanceCpuPlayback}>
                {cpuPlayback.index >= cpuPlayback.messages.length - 1
                  ? cpuPlayback.finalState.pendingTrapResponse
                    ? "落とし穴の発動確認へ"
                    : cpuPlayback.finalState.pendingAntiRaigeki
                      ? "避雷針の発動確認へ"
                    : cpuPlayback.finalState.pendingGuardianResponse
                      ? "三魔神の効果確認へ"
                    : cpuPlayback.finalState.pendingDeckReorder
                      ? "大王目玉の並べ替えへ"
                      : "自分のターンへ"
                  : "次の行動"}
              </button>
              <button onClick={() => {
                setDuel(cpuPlayback.finalState);
                setCpuPlayback(null);
              }}>すべてスキップ</button>
            </div>
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
            <p className="section-label">DE-SPELL</p>
            <h2>確認するカードを選択</h2>
            <p>魔法カードなら破壊し、罠カードなら確認後に元へ戻します。</p>
            <div className="spell-target-list">
              {(["player", "cpu"] as const).flatMap((side) =>
                (side === "player" ? duel.playerSpellTrap : duel.cpuSpellTrap).map((id, index) => {
                  const card = cardById.get(id);
                  if (!card) return null;
                  const hidden = card.cardType === "trap";
                  return (
                    <button key={`${side}-${id}-${index}`} onClick={() => resolveDeSpell(side, index)}>
                      <span>{side === "player" ? "自分" : "CPU"}のフィールド</span>
                      <strong>{hidden ? "伏せカード" : card.name}</strong>
                    </button>
                  );
                }),
              )}
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
                    (side === "player" ? duel.playerField : duel.cpuField).map((zone, index) => (
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
              {duel.cpuField.map((zone, index) => (
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
      {duel.pendingFlipTarget && (
        <div className="card-overlay flip-target-overlay">
          <div className="graveyard-panel spell-target-panel">
            <p className="section-label">FLIP EFFECT</p>
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

      <div className="duel-board">
        <div className="hand-summary">
          <span>CPU HAND</span><b>{duel.cpuHand.length}</b><span>DECK</span><b>{duel.cpuDeck.length}</b>
          <button className="grave-button" onClick={() => setGraveyardView("cpu")}>CPU墓地 {duel.cpuGraveyard.length}</button>
        </div>
        <div className="spell-trap-row cpu-spell-trap-row">
          {Array.from({ length: FIELD_LIMIT }, (_, index) => (
            <div className={duel.cpuSpellTrap[index] ? "set-card" : "empty-zone"} key={index}>
              {duel.cpuSpellTrap[index]
                ? duel.cpuSpellTrap[index] === "vol1-trap-hole"
                  ? "SET"
                  : cardById.get(duel.cpuSpellTrap[index])?.name
                : "MAGIC / TRAP"}
            </div>
          ))}
        </div>
        <FieldRow zones={duel.cpuField} owner="cpu" selectedTarget={selectedAttacker !== null} onTarget={attackTarget} onInspect={setDetailCardId} />
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
              && zone.summonedTurn !== duel.turnNumber,
            );
          }}
          onPositionChange={changePosition}
          onInspect={setDetailCardId}
        />
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

      <div className="duel-controls">
        <div className="duel-hand">
          {duel.playerHand.map((id, index) => {
            const card = cardById.get(id);
            if (!card) return null;
            const tributes = tributeCount(card);
            const canSummon = card.cardType === "monster"
              && canNormalSummonMonster(card.id, card.fusion)
              && isPlayerMainPhase
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
                    {card.id === "vol5-larvae-moth" ? (
                      <>
                        <small>{larvaeMothTargetIndex(duel) >= 0 ? "進化条件を満たしています" : "進化の繭を装備して2回目の自分ターンを待ちます"}</small>
                        <div>
                          <button disabled={!isPlayerMainPhase || larvaeMothTargetIndex(duel) < 0} onClick={() => summonLarvaeMoth(index, "attack")}>特殊召喚（攻）</button>
                          <button disabled={!isPlayerMainPhase || larvaeMothTargetIndex(duel) < 0} onClick={() => summonLarvaeMoth(index, "defense")}>特殊召喚（守）</button>
                        </div>
                      </>
                    ) : (
                      <div><button disabled={!canSummon} onClick={() => summon(index, "attack")}>召喚</button><button disabled={!canSummon} onClick={() => summon(index, "defense")}>セット</button></div>
                    )}
                    {card.id === "vol4-cocoon-evolution" && (
                      <button
                        disabled={
                          !isPlayerMainPhase
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
                  </>
                ) : card.cardType === "spell" ? (
                  <>
                    <small>{spellDescription(card.id)}</small>
                    <button
                      disabled={
                        !isSpellImplemented(card.id)
                        || !isPlayerMainPhase
                        || pendingTribute !== null
                        || pendingReborn !== null
                        || pendingDeSpell !== null
                        || pendingEgotist !== null
                        || pendingTributeToDoomed !== null
                        || pendingSoulRelease !== null
                        || pendingCheerfulCoffin !== null
                        || pendingChangeOfHeart !== null
                        || ((Boolean(EQUIP_RULES[card.id]) || card.id === "vol2-swords-revealing-light") && duel.playerSpellTrap.length >= FIELD_LIMIT)
                        || (card.id === "vol1-fissure" && lowestFaceUpAttackIndex(duel.cpuField) === null)
                        || (card.id === "vol2-monster-reborn" && (
                          duel.playerField.length >= FIELD_LIMIT
                          || isMonsterRebornBlocked(duel.playerSpellTrap, duel.cpuSpellTrap)
                          || ![...duel.playerGraveyard, ...duel.cpuGraveyard]
                            .some((id) => cardById.get(id)?.cardType === "monster")
                        ))
                        || (card.id === "vol2-de-spell" && duel.playerSpellTrap.length + duel.cpuSpellTrap.length === 0)
                        || (card.id === "vol3-pot-of-greed" && duel.playerDeck.length < 2)
                        || (card.id === "vol3-stop-defense" && !duel.cpuField.some((zone) => zone.position === "defense"))
                        || (card.id === "vol3-gravedigger-ghoul" && !duel.cpuGraveyard.some((id) => cardById.get(id)?.cardType === "monster"))
                        || (card.id === "vol4-elegant-egotist" && !canActivateElegantEgotist(duel, index))
                        || (card.id === "vol5-tribute-doomed" && !canActivateTributeToDoomed(duel.playerHand.length, duel.playerField.length + duel.cpuField.length))
                        || (card.id === "vol5-soul-release" && duel.playerGraveyard.length + duel.cpuGraveyard.length === 0)
                        || (card.id === "vol5-cheerful-coffin" && !canActivateCheerfulCoffin(duel.playerHand.flatMap((id, handIndex) => handIndex === index ? [] : [cardById.get(id)?.cardType ?? ""])))
                        || (card.id === "vol5-change-heart" && !canActivateChangeOfHeart(duel.playerField.length, duel.cpuField.length, FIELD_LIMIT))
                        || (Boolean(EQUIP_RULES[card.id]) && !duel.playerField.some((zone) => {
                          const monster = cardById.get(zone.id);
                          return Boolean(monster && canEquip(card.id, monster));
                        }))
                      }
                      onClick={() => useSpell(index)}
                    >
                      {selectedEquip === index ? "装備先を選択中" : "発動"}
                    </button>
                  </>
                ) : (
                  <>
                    <small>{trapDescription(card.id)}</small>
                    <button disabled={!isTrapImplemented(card.id) || !isPlayerMainPhase || pendingTribute !== null || duel.playerSpellTrap.length >= FIELD_LIMIT} onClick={() => setTrap(index)}>セット</button>
                  </>
                )}
              </article>
            );
          })}
        </div>
        <div className="phase-actions">
          <button className="end-turn" disabled={duel.turn !== "player" || Boolean(duel.pendingBlastJuggler) || pendingTribute !== null || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null || Boolean(duel.result)} onClick={advancePhase}>
            {duel.phase === "main1"
              ? duel.turnNumber === 1 ? "メイン2へ" : "バトルへ"
              : duel.phase === "battle" ? "メイン2へ" : "ターン終了"}
          </button>
          {duel.phase !== "main2" && (
            <button className="skip-turn" disabled={Boolean(duel.pendingBlastJuggler) || pendingTribute !== null || pendingReborn !== null || pendingDeSpell !== null || pendingEgotist !== null || pendingTributeToDoomed !== null || pendingSoulRelease !== null || pendingCheerfulCoffin !== null || pendingChangeOfHeart !== null || Boolean(duel.result)} onClick={endTurn}>ターン終了</button>
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
          <h2>{duel.result === "win" ? "VICTORY" : "DEFEAT"}</h2>
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
        const validEquipTarget = equipTarget && !zone.faceDown && Boolean(equipId && canEquip(equipId, card));
        const showPositionChange = owner === "player" && canChangePosition?.(index);
        return (
          <div className="field-slot" key={`${zone.id}-${index}`}>
            <button
              className={`field-card ${zone.position} ${selectedTarget || validEquipTarget || tributeTarget ? "targetable" : ""} ${selectedTributes.includes(index) ? "tribute-selected" : ""}`}
              disabled={tributeTarget ? false : equipTarget ? !validEquipTarget : selectedTarget ? !onTarget : owner === "cpu" || !canAttack || zone.position !== "attack" || zone.attacked}
              onClick={() => tributeTarget ? onTribute?.(index) : equipTarget ? onEquip?.(index) : selectedTarget ? onTarget?.(index) : onAttack?.(index)}
            >
              <strong>{hidden ? "伏せモンスター" : card.name}</strong>
              <span>{zone.position === "attack" ? `ATK ${effectiveAtk(zone)}` : hidden ? "DEF ???" : `DEF ${effectiveDef(zone)}`}</span>
              {!hidden && zone.equipped.length > 0 && <small>装備 ×{zone.equipped.length}</small>}
              {!hidden && card.effect && <small className="field-effect-badge">効果モンスター</small>}
              {!hidden && zone.controlReturn === "cpu" && <small className="field-effect-badge">心変わり・ターン終了時に戻る</small>}
              {tributeTarget && <small>{selectedTributes.includes(index) ? "生け贄に選択済" : "タップして選択"}</small>}
              {owner === "player" && zone.position === "attack" && <small>{zone.attacked ? "攻撃済" : canAttack ? "攻撃" : "BATTLEで攻撃"}</small>}
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
  state = playCpuNormalSpells(state);
  if (state.result || state.pendingAntiRaigeki) return state;
  return continueCpuTurnAfterSpells(state);
}

function continueCpuTurnAfterSpells(initial: DuelState): DuelState {
  let state = initial;
  const candidates = state.cpuHand
    .map((id, index) => ({ card: cardById.get(id), index }))
    .filter((item): item is { card: Card; index: number } => item.card?.cardType === "monster")
    .sort((a, b) => (b.card.atk ?? 0) - (a.card.atk ?? 0));
  const summonChoice = candidates.find(({ card }) => {
    const tributes = tributeCount(card);
    return state.cpuField.length >= tributes && state.cpuField.length - tributes < FIELD_LIMIT;
  });
  if (summonChoice) {
    const tributes = tributeCount(summonChoice.card);
    const tributeIndexes = lowestAttackIndexes(state.cpuField, tributes);
    const tributedZones = state.cpuField.filter((_, index) => tributeIndexes.includes(index));
    const nextField = state.cpuField.filter((_, index) => !tributeIndexes.includes(index));
    const defensive = (summonChoice.card.def ?? 0) > (summonChoice.card.atk ?? 0);
    nextField.push({
      id: summonChoice.card.id,
      position: defensive ? "defense" : "attack",
      faceDown: defensive,
      attacked: true,
      equipped: [],
      summonedTurn: state.turnNumber,
      positionChanged: false,
    });
    state = {
      ...state,
      cpuHand: state.cpuHand.filter((_, index) => index !== summonChoice.index),
      cpuField: nextField,
      cpuSpellTrap: discardEquips(state.cpuSpellTrap, tributedZones),
      cpuGraveyard: [...state.cpuGraveyard, ...graveCards(tributedZones)],
      log: appendLog(
        state.log,
        defensive
          ? "CPUがモンスターをセット。"
          : `CPUが${summonChoice.card.name}を召喚。`,
      ),
    };
    const trapIndex = state.playerSpellTrap.indexOf("vol1-trap-hole");
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
      if (!canBlastJugglerTarget(zone.faceDown, effectiveAtk(zone))) return [];
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

function returnChangedMonsters(state: DuelState): DuelState {
  const returning = state.playerField.filter((zone) => zone.controlReturn === "cpu");
  if (returning.length === 0) return state;
  return {
    ...state,
    playerField: state.playerField.filter((zone) => zone.controlReturn !== "cpu"),
    cpuField: [...state.cpuField, ...returning.map(({ controlReturn: _controlReturn, ...zone }) => zone)],
    log: appendLog(state.log, `心変わりの効果が終了。${returning.length}体をCPUフィールドへ戻した。`),
  };
}

function finishCpuTurn(initial: DuelState, resumeBattle = false): DuelState {
  let state: DuelState = { ...initial, pendingTrapResponse: null };
  if (!resumeBattle) {
    state = setCpuTrapAndEquips(state);
    state = {
      ...state,
      cpuField: state.cpuField.map((zone) => ({ ...zone, attacked: false })),
    };
  }
  state = { ...state, phase: "battle" };
  if (state.playerSwordsTurns.length > 0) {
    state = { ...state, log: appendLog(state.log, "光の護封剣によりCPUは攻撃できません。") };
  } else {
    for (let index = state.cpuField.length - 1; index >= 0 && !state.result && !state.pendingFlipTarget && !state.pendingDeckReorder && !state.pendingGuardianResponse; index -= 1) {
      const attacker = state.cpuField[index];
      if (attacker.position !== "attack" || attacker.attacked) continue;
      if (state.playerField.length === 0) {
        state = resolveBattle(state, "cpu", index, null);
        continue;
      }
      const targetIndex = bestCpuBattleTargetIndex(
        effectiveAtk(attacker),
        state.playerField.map((zone) => ({
          position: zone.position,
          faceDown: zone.faceDown,
          atk: effectiveAtk(zone),
          def: effectiveDef(zone),
        })),
      );
      if (targetIndex !== null) {
        const defender = state.playerField[targetIndex];
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
        state = resolveBattle(state, "cpu", index, targetIndex);
      }
    }
  }
  if (state.result || state.pendingFlipTarget || state.pendingDeckReorder || state.pendingGuardianResponse) return state;

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
  const playerStart: DuelState = {
    ...state,
    playerHand: [...state.playerHand, state.playerDeck[0]],
    playerDeck: state.playerDeck.slice(1),
    playerField: state.playerField.map((zone) => ({ ...zone, attacked: false, positionChanged: false })),
    turn: "player",
    turnNumber: state.turnNumber + 1,
    phase: "main1",
    normalSummoned: false,
    log: appendLog(state.log, "あなたのターン。1枚ドロー。"),
  };
  return openBlastJugglerPrompt(playerStart);
}

function playCpuNormalSpells(initial: DuelState): DuelState {
  let state = initial;

  const deSpellTarget = firstSpellTargetIndex(
    state.playerSpellTrap.map(fieldCardType),
  );
  if (state.cpuHand.includes("vol2-de-spell") && deSpellTarget !== null) {
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

  if (state.cpuHand.includes("stb-raigeki") && state.playerField.length > 0) {
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
    state = {
      ...activated,
      playerSpellTrap: discardEquips(activated.playerSpellTrap, activated.playerField),
      playerGraveyard: [...activated.playerGraveyard, ...graveCards(activated.playerField)],
      playerField: [],
      log: appendLog(activated.log, "サンダー・ボルトでプレイヤーのモンスターをすべて破壊。"),
    };
  }

  if (
    state.cpuHand.includes("vol1-dark-hole")
    && state.playerField.length > 0
    && fieldPower(state.playerField) > fieldPower(state.cpuField)
  ) {
    state = {
      ...removeCpuHandCard(state, "vol1-dark-hole"),
      playerSpellTrap: discardEquips(state.playerSpellTrap, state.playerField),
      cpuSpellTrap: discardEquips(state.cpuSpellTrap, state.cpuField),
      playerGraveyard: [...state.playerGraveyard, ...graveCards(state.playerField)],
      cpuGraveyard: [...state.cpuGraveyard, "vol1-dark-hole", ...graveCards(state.cpuField)],
      playerField: [],
      cpuField: [],
      log: appendLog(state.log, "CPUがブラック・ホールを発動。すべてのモンスターを破壊。"),
    };
  }

  const fissureTarget = lowestFaceUpAttackIndex(state.playerField);
  if (state.cpuHand.includes("vol1-fissure") && fissureTarget !== null) {
    const destroyed = state.playerField[fissureTarget];
    state = {
      ...removeCpuHandCard(state, "vol1-fissure"),
      playerField: state.playerField.filter((_, index) => index !== fissureTarget),
      playerSpellTrap: discardEquips(state.playerSpellTrap, [destroyed]),
      playerGraveyard: [...state.playerGraveyard, ...graveCards([destroyed])],
      cpuGraveyard: [...state.cpuGraveyard, "vol1-fissure"],
      log: appendLog(state.log, "CPUが地割れを発動。モンスター1体を破壊。"),
    };
  }

  if (
    state.cpuHand.includes("vol2-swords-revealing-light")
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
      playerField: state.playerField.map((zone) => ({ ...zone, faceDown: false })),
      cpuSpellTrap: [...state.cpuSpellTrap, "vol2-swords-revealing-light"],
      cpuSwordsTurns: [...state.cpuSwordsTurns, 3],
      log: appendLog(state.log, "CPUが光の護封剣を発動。3ターン攻撃を封じます。"),
    };
    for (const zone of faceDownZones) state = resolveFlipEffect(state, "player", zone.id);
  }

  if (
    state.cpuHand.includes("vol2-monster-reborn")
    && state.cpuField.length < FIELD_LIMIT
    && !isMonsterRebornBlocked(state.playerSpellTrap, state.cpuSpellTrap)
  ) {
    const revivalCandidates = [
      ...state.cpuGraveyard.map((id, index) => ({ id, index, side: "cpu" as const })),
      ...state.playerGraveyard.map((id, index) => ({ id, index, side: "player" as const })),
    ].filter(({ id }) => {
      const card = cardById.get(id);
      return card?.cardType === "monster" && !card.fusion;
    });
    const choiceIndex = strongestAttackIndex(
      revivalCandidates.map(({ id }) => cardById.get(id)?.atk ?? 0),
    );
    const choice = choiceIndex === null ? null : revivalCandidates[choiceIndex];
    const graveyard = choice?.side === "cpu" ? state.cpuGraveyard : state.playerGraveyard;
    const taken = choice ? takeGraveyardCard(graveyard, choice.index) : null;
    const monster = taken ? cardById.get(taken.cardId) : null;
    if (choice && taken && monster?.cardType === "monster") {
      const position: Position = (monster.def ?? 0) > (monster.atk ?? 0) ? "defense" : "attack";
      state = {
        ...removeCpuHandCard(state, "vol2-monster-reborn"),
        cpuField: [
          ...state.cpuField,
          {
            id: taken.cardId,
            position,
            faceDown: false,
            attacked: false,
            equipped: [],
            summonedTurn: state.turnNumber,
            positionChanged: false,
            revivedByMonsterReborn: true,
          },
        ],
        cpuGraveyard: [
          ...(choice.side === "cpu" ? taken.remaining : state.cpuGraveyard),
          "vol2-monster-reborn",
        ],
        playerGraveyard: choice.side === "player" ? taken.remaining : state.playerGraveyard,
        log: appendLog(state.log, `CPUが死者蘇生を発動。${monster.name}を特殊召喚。`),
      };
    }
  }

  while (state.cpuHand.includes("vol3-pot-of-greed") && state.cpuDeck.length >= 2) {
    state = {
      ...removeCpuHandCard(state, "vol3-pot-of-greed"),
      cpuHand: [...removeCpuHandCard(state, "vol3-pot-of-greed").cpuHand, ...state.cpuDeck.slice(0, 2)],
      cpuDeck: state.cpuDeck.slice(2),
      cpuGraveyard: [...state.cpuGraveyard, "vol3-pot-of-greed"],
      log: appendLog(state.log, "CPUが強欲な壺を発動。カードを2枚ドロー。"),
    };
  }

  if (state.cpuHand.includes("vol3-stop-defense")) {
    const targetIndex = state.playerField.findIndex((zone) => zone.position === "defense");
    if (targetIndex >= 0) {
      const target = state.playerField[targetIndex];
      state = {
        ...removeCpuHandCard(state, "vol3-stop-defense"),
        playerField: state.playerField.map((zone, index) => index === targetIndex
          ? { ...zone, position: "attack", faceDown: false, positionChanged: true }
          : zone),
        cpuGraveyard: [...state.cpuGraveyard, "vol3-stop-defense"],
        log: appendLog(state.log, "CPUが『守備』封じを発動。守備モンスターを攻撃表示に変更。"),
      };
      if (target.faceDown) state = resolveFlipEffect(state, "player", target.id);
    }
  }

  if (state.cpuHand.includes("vol3-gravedigger-ghoul")) {
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

  for (const spellId of [...state.cpuHand]) {
    const effect = simpleSpellEffect(spellId);
    if (!effect || !shouldCpuUseSimpleSpell(spellId, state.cpuLp, STARTING_LP)) continue;
    const spell = cardById.get(spellId);
    state = {
      ...removeCpuHandCard(state, spellId),
      cpuLp: state.cpuLp + effect.gain,
      playerLp: state.playerLp - effect.damage,
      cpuGraveyard: [...state.cpuGraveyard, spellId],
      log: appendLog(
        state.log,
        effect.gain
          ? `CPUが${spell?.name ?? "回復魔法"}を発動。LPを${effect.gain}回復。`
          : `CPUが${spell?.name ?? "ダメージ魔法"}を発動。${effect.damage}ダメージ。`,
      ),
    };
    if (state.playerLp <= 0) {
      state.result = "lose";
      break;
    }
  }
  return state;
}

function setCpuTrapAndEquips(initial: DuelState): DuelState {
  let state = initial;
  if (state.cpuSpellTrap.length >= FIELD_LIMIT) return state;

  if (state.cpuHand.includes("vol1-trap-hole")) {
    state = {
      ...removeCpuHandCard(state, "vol1-trap-hole"),
      cpuSpellTrap: [...state.cpuSpellTrap, "vol1-trap-hole"],
      log: appendLog(state.log, "CPUが罠カードを1枚セット。"),
    };
  }

  while (state.cpuSpellTrap.length < FIELD_LIMIT) {
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

function resolveBattle(state: DuelState, attackerSide: Side, attackerIndex: number, defenderIndex: number | null, guardianEffect = false): DuelState {
  const attackerFieldKey = attackerSide === "player" ? "playerField" : "cpuField";
  const defenderFieldKey = attackerSide === "player" ? "cpuField" : "playerField";
  const attackerLpKey = attackerSide === "player" ? "playerLp" : "cpuLp";
  const defenderLpKey = attackerSide === "player" ? "cpuLp" : "playerLp";
  const attackerField = state[attackerFieldKey].map((zone) => ({ ...zone }));
  const defenderField = state[defenderFieldKey].map((zone) => ({ ...zone }));
  const attackerZone = attackerField[attackerIndex];
  const attacker = cardById.get(attackerZone.id);
  if (!attacker) return state;
  attackerZone.attacked = true;

  if (defenderIndex === null || !defenderField[defenderIndex]) {
    const damage = effectiveAtk(attackerZone);
    let next = { ...state, [attackerFieldKey]: attackerField, [defenderLpKey]: state[defenderLpKey] - damage } as DuelState;
    next.log = appendLog(state.log, `${attacker.name}の直接攻撃。${damage}ダメージ。`);
    if (next[defenderLpKey] > 0) next = resolveBattleDamageEffect(next, attackerSide, attacker.id, damage);
    if (next[defenderLpKey] <= 0) next.result = attackerSide === "player" ? "win" : "lose";
    return next;
  }

  const defenderZone = defenderField[defenderIndex];
  const wasFaceDown = defenderZone.faceDown;
  defenderZone.faceDown = false;
  const defender = cardById.get(defenderZone.id);
  if (!defender) return state;
  if (guardianEffect) defenderZone.guardianEffectUsed = true;
  const attackValue = guardianAdjustedAttack(effectiveAtk(attackerZone), guardianEffect);
  const defenseValue = defenderZone.position === "attack" ? effectiveAtk(defenderZone) : effectiveDef(defenderZone);
  const { attackerDestroyed, defenderDestroyed, attackerDamage, defenderDamage } =
    battleOutcome(attackValue, defenseValue, defenderZone.position);

  const nextAttackerField = attackerDestroyed ? attackerField.filter((_, index) => index !== attackerIndex) : attackerField;
  const nextDefenderField = defenderDestroyed ? defenderField.filter((_, index) => index !== defenderIndex) : defenderField;
  const destroyedPlayerZones = [
    ...(attackerDestroyed && attackerSide === "player" ? [attackerZone] : []),
    ...(defenderDestroyed && attackerSide === "cpu" ? [defenderZone] : []),
  ];
  const destroyedCpuZones = [
    ...(attackerDestroyed && attackerSide === "cpu" ? [attackerZone] : []),
    ...(defenderDestroyed && attackerSide === "player" ? [defenderZone] : []),
  ];
  const returnedDestroyedZones = destroyedPlayerZones.filter((zone) => zone.controlReturn === "cpu");
  const ownedDestroyedPlayerZones = destroyedPlayerZones.filter((zone) => zone.controlReturn !== "cpu");
  let next = {
    ...state,
    [attackerFieldKey]: nextAttackerField,
    [defenderFieldKey]: nextDefenderField,
    [attackerLpKey]: state[attackerLpKey] - attackerDamage,
    [defenderLpKey]: state[defenderLpKey] - defenderDamage,
    playerSpellTrap: discardEquips(state.playerSpellTrap, ownedDestroyedPlayerZones),
    cpuSpellTrap: discardEquips(state.cpuSpellTrap, [...destroyedCpuZones, ...returnedDestroyedZones]),
    playerGraveyard: [...state.playerGraveyard, ...graveCards(ownedDestroyedPlayerZones)],
    cpuGraveyard: [...state.cpuGraveyard, ...graveCards(destroyedCpuZones), ...graveCards(returnedDestroyedZones)],
    log: appendLog(
      state.log,
      `${attacker.name}が${defender.name}を攻撃。${
        attackerDestroyed && defenderDestroyed
          ? "両方を破壊。"
          : defenderDestroyed
            ? `${defender.name}を破壊。${defenderDamage ? `${defenderDamage}ダメージ。` : ""}`
            : attackerDestroyed
              ? `${attacker.name}を破壊。${attackerDamage ? `${attackerDamage}ダメージ。` : ""}`
              : `モンスターは破壊されない。${attackerDamage ? `${attackerDamage}ダメージ。` : ""}`
      }`,
    ),
  } as DuelState;
  if (defenderDamage > 0 && next[defenderLpKey] > 0) {
    next = resolveBattleDamageEffect(next, attackerSide, attacker.id, defenderDamage);
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
  if (effect === "discard-random") {
    const opponentHand = attackerSide === "player" ? state.cpuHand : state.playerHand;
    if (opponentHand.length === 0) return state;
    const discardIndex = Math.floor(Math.random() * opponentHand.length);
    const discardedId = opponentHand[discardIndex];
    const discardedName = cardById.get(discardedId)?.name ?? "カード";
    return attackerSide === "player"
      ? {
          ...state,
          cpuHand: opponentHand.filter((_, index) => index !== discardIndex),
          cpuGraveyard: [...state.cpuGraveyard, discardedId],
          log: appendLog(state.log, `${attackerName}の効果でCPUの手札から${discardedName}を捨てた。`),
        }
      : {
          ...state,
          playerHand: opponentHand.filter((_, index) => index !== discardIndex),
          playerGraveyard: [...state.playerGraveyard, discardedId],
          log: appendLog(state.log, `${attackerName}の効果で手札から${discardedName}を捨てた。`),
        };
  }
  if (effect !== "draw") return state;
  const deck = attackerSide === "player" ? state.playerDeck : state.cpuDeck;
  if (deck.length === 0) {
    return {
      ...state,
      result: attackerSide === "player" ? "lose" : "win",
      log: appendLog(state.log, `${attackerName}の効果でドローできず敗北。`),
    };
  }
  return attackerSide === "player"
    ? {
        ...state,
        playerDeck: deck.slice(1),
        playerHand: [...state.playerHand, deck[0]],
        log: appendLog(state.log, `${attackerName}の効果でカードを1枚ドロー。`),
      }
    : {
        ...state,
        cpuDeck: deck.slice(1),
        cpuHand: [...state.cpuHand, deck[0]],
        log: appendLog(state.log, `${attackerName}の効果でCPUがカードを1枚ドロー。`),
      };
}

type FlipTargetChoice = {
  id: string;
  index: number;
  zone: string;
  name: string;
};

function flipTargetChoices(state: DuelState, pending: PendingFlipTarget): FlipTargetChoice[] {
  if (pending.effect === "destroy-monster" || pending.effect === "return-monster") {
    return state.cpuField.map((zone, index) => ({
      id: zone.id,
      index,
      zone: `相手モンスターゾーン ${index + 1}`,
      name: zone.faceDown ? "裏側モンスター" : cardById.get(zone.id)?.name ?? "モンスター",
    }));
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
  if (effect === "destroy-spell") return "確認する魔法・罠カードを選択";
  if (effect === "destroy-trap") return "確認する魔法・罠カードを選択";
  return effect === "recover-spell" ? "手札に戻す魔法カードを選択" : "手札に戻す罠カードを選択";
}

function resolvePendingFlipTarget(state: DuelState, targetIndex: number): DuelState {
  const pending = state.pendingFlipTarget;
  if (!pending) return state;
  const base = { ...state, pendingFlipTarget: null };
  const effectMonsterName = cardById.get(pending.monsterId)?.name ?? "モンスター";

  if (pending.effect === "destroy-monster" || pending.effect === "return-monster") {
    const target = state.cpuField[targetIndex];
    if (!target) return base;
    const targetName = cardById.get(target.id)?.name ?? "モンスター";
    const remainingField = state.cpuField.filter((_, index) => index !== targetIndex);
    const remainingSpellTrap = discardEquips(state.cpuSpellTrap, [target]);
    if (pending.effect === "return-monster") {
      return {
        ...base,
        cpuField: remainingField,
        cpuSpellTrap: remainingSpellTrap,
        cpuHand: [...state.cpuHand, target.id],
        cpuGraveyard: [...state.cpuGraveyard, ...target.equipped],
        log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}を手札に戻した。`),
      };
    }
    return {
      ...base,
      cpuField: remainingField,
      cpuSpellTrap: remainingSpellTrap,
      cpuGraveyard: [...state.cpuGraveyard, ...graveCards([target])],
      log: appendLog(state.log, `${effectMonsterName}の効果で${targetName}を破壊した。`),
    };
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

function resolveFlipEffect(state: DuelState, owner: Side, monsterId: string): DuelState {
  const ownerName = owner === "player" ? "あなた" : "CPU";
  const effect = flipEffect(monsterId);
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

  const playerChooses = shouldPlayerChooseFlipTarget(owner, state.turn, state.phase);
  if (playerChooses && effect) {
    const pending = { monsterId, effect } as PendingFlipTarget;
    if (flipTargetChoices(state, pending).length > 0) {
      return {
        ...state,
        pendingFlipTarget: pending,
        log: appendLog(state.log, `${ownerName}の${cardById.get(monsterId)?.name ?? "モンスター"}がリバース。効果対象を選択してください。`),
      };
    }
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
    const targetIndex = strongestAttackIndex(opponentField.map(effectiveAtk));
    if (targetIndex === null) return state;
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
    return owner === "player"
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
  }

  const targetType = effect === "destroy-spell" ? "spell" : effect === "destroy-trap" ? "trap" : null;
  if (!targetType) return state;
  const opponentSpellTrap = owner === "player" ? state.cpuSpellTrap : state.playerSpellTrap;
  const targetIndex = opponentSpellTrap.findIndex((id) => fieldCardType(id) === targetType);
  if (targetIndex < 0) return state;
  const targetId = opponentSpellTrap[targetIndex];
  const targetName = cardById.get(targetId)?.name ?? (targetType === "spell" ? "魔法カード" : "罠カード");
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
    cardById.has(id) && !cardById.get(id)?.fusion && Number.isInteger(count) && count > 0 ? Array(Math.min(3, count)).fill(id) : [],
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

function lowestFaceUpAttackIndex(field: ZoneCard[]) {
  const candidates = field
    .map((zone, index) => ({ zone, index }))
    .filter(({ zone }) => !zone.faceDown)
    .sort((a, b) => effectiveAtk(a.zone) - effectiveAtk(b.zone));
  return candidates[0]?.index ?? null;
}

function effectiveAtk(zone: ZoneCard) {
  const card = cardById.get(zone.id);
  return equippedMonsterStats(card?.atk ?? 0, card?.def ?? 0, zone.equipped).atk;
}

function effectiveDef(zone: ZoneCard) {
  const card = cardById.get(zone.id);
  return equippedMonsterStats(card?.atk ?? 0, card?.def ?? 0, zone.equipped).def;
}

function canEquip(spellId: string, monster: Card) {
  if (spellId === "vol4-cocoon-evolution") return monster.id === "vol4-petit-moth";
  return monster.cardType === "monster" && EQUIP_RULES[spellId] === monster.kind;
}

function larvaeMothTargetIndex(state: DuelState) {
  return state.playerField.findIndex((zone) =>
    zone.id === "vol4-petit-moth"
    && !zone.faceDown
    && zone.equipped.includes("vol4-cocoon-evolution")
    && canSpecialSummonLarvaeMoth(state.turnNumber, zone.cocoonEquippedTurn),
  );
}

function fieldCardType(cardId: string) {
  return cardId === "vol4-cocoon-evolution"
    ? "spell"
    : cardById.get(cardId)?.cardType ?? "trap";
}

function removeHandCard(state: DuelState, handIndex: number): DuelState {
  return { ...state, playerHand: state.playerHand.filter((_, index) => index !== handIndex) };
}

function removeCpuHandCard(state: DuelState, cardId: string): DuelState {
  const index = state.cpuHand.indexOf(cardId);
  return index < 0
    ? state
    : { ...state, cpuHand: state.cpuHand.filter((_, handIndex) => handIndex !== index) };
}

function fieldPower(field: ZoneCard[]) {
  return field.reduce((total, zone) => total + Math.max(effectiveAtk(zone), effectiveDef(zone)), 0);
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

function spellDescription(id: string) {
  if (EQUIP_RULES[id]) return `${EQUIP_RULES[id]}1体のATK・DEFを300アップ`;
  if (id === "vol1-dark-hole") return "フィールドのモンスターをすべて破壊";
  if (id === "stb-raigeki") return "相手フィールドのモンスターをすべて破壊";
  const effect = simpleSpellEffect(id);
  if (effect?.gain) return `自分のLPを${effect.gain}回復`;
  if (effect?.damage) return `相手に${effect.damage}ダメージ`;
  if (id === "vol2-swords-revealing-light") return "相手モンスターを表にし、相手の攻撃を3ターン封じる";
  if (id === "vol2-monster-reborn") return "自分または相手の墓地からモンスター1体を特殊召喚";
  if (id === "vol2-de-spell") return "フィールドのカード1枚を確認し、魔法カードなら破壊";
  if (id === "vol1-fissure") return "相手の表側モンスターのうちATKが一番低い1体を破壊";
  if (id === "vol3-pot-of-greed") return "デッキからカードを2枚ドロー";
  if (id === "vol3-stop-defense") return "相手の守備表示モンスター1体を攻撃表示に変更";
  if (id === "vol3-gravedigger-ghoul") return "相手の墓地のモンスターを2体まで除外";
  if (id === "vol4-elegant-egotist") return "ハーピィ・レディがいる時、手札・デッキからハーピィ1体を特殊召喚";
  if (id === "vol5-tribute-doomed") return "手札を1枚捨て、フィールドのモンスター1体を破壊する";
  if (id === "vol5-soul-release") return "自分・相手の墓地からカードを合計5枚まで除外する";
  if (id === "vol5-cheerful-coffin") return "手札のモンスターを3枚まで墓地へ送る";
  if (id === "vol5-change-heart") return "相手モンスター1体のコントロールをターン終了時まで得る";
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
      "vol3-stop-defense",
      "vol3-gravedigger-ghoul",
      "vol4-elegant-egotist",
      "vol5-tribute-doomed",
      "vol5-soul-release",
      "vol5-cheerful-coffin",
      "vol5-change-heart",
    ].includes(id);
}

function trapDescription(id: string) {
  if (id === "vol1-trap-hole") return "ATK1000以上で召喚された相手モンスターを破壊";
  if (id === "vol5-anti-raigeki") return "相手のサンダー・ボルトを無効にし、相手モンスターをすべて破壊";
  if (id === "vol5-call-darkness") return "死者蘇生を使用できなくし、死者蘇生で蘇ったモンスターを墓地へ送る";
  return "効果処理は次の更新で対応";
}

function isTrapImplemented(id: string) {
  return id === "vol1-trap-hole" || id === "vol5-anti-raigeki" || id === "vol5-call-darkness";
}

function monsterDescription(id: string) {
  if (id === "vol3-reaper-cards") return "リバース：フィールドの罠カード1枚を確認し、罠カードなら破壊する";
  if (id === "vol3-armed-ninja") return "リバース：フィールドの魔法カード1枚を確認し、魔法カードなら破壊する";
  if (id === "vol3-man-eater-bug") return "リバース：フィールドのモンスター1体を破壊する";
  if (id === "vol3-skelengel") return "リバース：デッキからカードを1枚ドローする";
  if (id === "vol3-hane-hane") return "リバース：フィールドのモンスター1体を持ち主の手札に戻す";
  if (id === "vol4-magician-faith") return "リバース：自分の墓地から魔法カード1枚を選び、手札に戻す";
  if (id === "vol4-mask-darkness") return "リバース：自分の墓地から罠カード1枚を選び、手札に戻す";
  if (id === "vol4-harpie-sisters") return "通常召喚できず、万華鏡－華麗なる分身－の効果で特殊召喚する";
  if (id === "vol4-cocoon-evolution") return "手札から表側のプチモスに装備でき、ATK 0・DEF 2000を適用する";
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

function appendLog(log: string[], entry: string) {
  return [...log, entry].slice(-30);
}
