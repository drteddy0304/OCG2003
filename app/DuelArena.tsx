"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardById, cards, type Card } from "./card-data";

const DECK_STORAGE_KEY = "ocg2003.deck.main.v1";
const MIN_DECK_SIZE = 40;
const STARTING_LP = 8000;
const FIELD_LIMIT = 5;

type Position = "attack" | "defense";
type Side = "player" | "cpu";
type Result = "win" | "lose" | null;

type ZoneCard = {
  id: string;
  position: Position;
  faceDown: boolean;
  attacked: boolean;
  equipped: string[];
};

type DuelState = {
  playerDeck: string[];
  cpuDeck: string[];
  playerHand: string[];
  cpuHand: string[];
  playerField: ZoneCard[];
  cpuField: ZoneCard[];
  playerSpellTrap: string[];
  playerLp: number;
  cpuLp: number;
  turn: Side;
  turnNumber: number;
  normalSummoned: boolean;
  result: Result;
  log: string[];
};

const monsterIds = cards.filter((card) => card.cardType === "monster").map((card) => card.id);
const CPU_DECK = [...monsterIds, ...monsterIds.slice(0, 10)];
const EQUIP_RULES: Record<string, string> = {
  "vol1-legendary-sword": "戦士族",
  "vol1-beast-fangs": "獣族",
  "vol1-violet-crystal": "アンデット族",
  "vol1-book-secret-arts": "魔法使い族",
  "vol1-power-kaishin": "水族",
};

export function DuelArena({
  collection,
  onReward,
}: {
  collection: Record<string, number>;
  onReward: (cardId: string) => void;
}) {
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<number | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<number | null>(null);
  const [rewardName, setRewardName] = useState<string | null>(null);
  const rewarded = useRef(false);

  const savedDeck = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const counts = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
      return expandDeck(counts);
    } catch {
      return [];
    }
  }, [collection, duel]);

  useEffect(() => {
    if (duel?.result !== "win" || rewarded.current) return;
    rewarded.current = true;
    const rewardId = CPU_DECK[Math.floor(Math.random() * CPU_DECK.length)];
    onReward(rewardId);
    setRewardName(cardById.get(rewardId)?.name ?? null);
  }, [duel?.result, onReward]);

  function startDuel() {
    const counts = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
    const playerCards = expandDeck(counts);
    if (playerCards.length < MIN_DECK_SIZE) return;

    const shuffledPlayer = shuffle(playerCards);
    const shuffledCpu = shuffle(CPU_DECK);
    const playerDraw = shuffledPlayer.slice(0, 6);
    const cpuDraw = shuffledCpu.slice(0, 5);
    rewarded.current = false;
    setRewardName(null);
    setSelectedAttacker(null);
    setDuel({
      playerDeck: shuffledPlayer.slice(6),
      cpuDeck: shuffledCpu.slice(5),
      playerHand: playerDraw,
      cpuHand: cpuDraw,
      playerField: [],
      cpuField: [],
      playerSpellTrap: [],
      playerLp: STARTING_LP,
      cpuLp: STARTING_LP,
      turn: "player",
      turnNumber: 1,
      normalSummoned: false,
      result: null,
      log: ["デュエル開始。先攻プレイヤーは6枚でスタート。", "第1ターンは攻撃できません。"],
    });
  }

  function summon(handIndex: number, position: Position) {
    if (!duel || duel.turn !== "player" || duel.normalSummoned || duel.result) return;
    const id = duel.playerHand[handIndex];
    const card = cardById.get(id);
    if (!card || card.cardType !== "monster") return;
    const tributes = tributeCount(card);
    if (duel.playerField.length < tributes || duel.playerField.length - tributes >= FIELD_LIMIT) return;

    const tributeIndexes = lowestAttackIndexes(duel.playerField, tributes);
    const tributedZones = duel.playerField.filter((_, index) => tributeIndexes.includes(index));
    const tributeNames = tributeIndexes.map((index) => cardById.get(duel.playerField[index].id)?.name).filter(Boolean);
    const nextField = duel.playerField.filter((_, index) => !tributeIndexes.includes(index));
    nextField.push({ id, position, faceDown: position === "defense", attacked: false, equipped: [] });
    setDuel({
      ...duel,
      playerHand: duel.playerHand.filter((_, index) => index !== handIndex),
      playerField: nextField,
      playerSpellTrap: discardEquips(duel.playerSpellTrap, tributedZones),
      normalSummoned: true,
      log: appendLog(duel.log, `${card.name}を${position === "attack" ? "攻撃表示で召喚" : "裏側守備表示でセット"}。${tributeNames.length ? `（${tributeNames.join("、")}をリリース）` : ""}`),
    });
  }

  function useSpell(handIndex: number) {
    if (!duel || duel.turn !== "player" || duel.result) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "spell") return;
    if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
    if (EQUIP_RULES[card.id]) {
      if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
      setSelectedEquip(handIndex);
      setSelectedAttacker(null);
      return;
    }

    let next = removeHandCard(duel, handIndex);
    if (card.id === "vol1-dark-hole") {
      next = {
        ...next,
        playerField: [],
        cpuField: [],
        playerSpellTrap: discardEquips(next.playerSpellTrap, next.playerField),
      };
    } else if (card.id === "vol1-red-medicine") {
      next = { ...next, playerLp: next.playerLp + 500 };
    } else if (card.id === "vol1-sparks") {
      next = { ...next, cpuLp: next.cpuLp - 200 };
      if (next.cpuLp <= 0) next.result = "win";
    } else if (card.id === "vol1-fissure") {
      const target = lowestFaceUpAttackIndex(next.cpuField);
      if (target === null) return;
      next = { ...next, cpuField: next.cpuField.filter((_, index) => index !== target) };
    } else return;
    next.log = appendLog(next.log, `${card.name}を発動。`);
    setDuel(next);
  }

  function equipSpell(fieldIndex: number) {
    if (!duel || selectedEquip === null) return;
    const spell = cardById.get(duel.playerHand[selectedEquip]);
    const zone = duel.playerField[fieldIndex];
    const monster = zone ? cardById.get(zone.id) : null;
    if (!spell || !monster || !canEquip(spell.id, monster)) return;
    setDuel({
      ...removeHandCard(duel, selectedEquip),
      playerField: duel.playerField.map((item, index) =>
        index === fieldIndex ? { ...item, equipped: [...item.equipped, spell.id] } : item,
      ),
      playerSpellTrap: [...duel.playerSpellTrap, spell.id],
      log: appendLog(duel.log, `${spell.name}を${monster.name}に装備。ATK・DEFが300アップ。`),
    });
    setSelectedEquip(null);
  }

  function setTrap(handIndex: number) {
    if (!duel || duel.turn !== "player" || duel.result || duel.playerSpellTrap.length >= FIELD_LIMIT) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "trap") return;
    setDuel({
      ...removeHandCard(duel, handIndex),
      playerSpellTrap: [...duel.playerSpellTrap, card.id],
      log: appendLog(duel.log, "罠カードを1枚セット。"),
    });
  }

  function chooseAttacker(index: number) {
    if (!duel || duel.turn !== "player" || duel.turnNumber === 1 || duel.result) return;
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

  function endTurn() {
    if (!duel || duel.turn !== "player" || duel.result) return;
    setSelectedAttacker(null);
    setSelectedEquip(null);
    setDuel(runCpuTurn({
      ...duel,
      turn: "cpu",
      turnNumber: duel.turnNumber + 1,
      log: appendLog(duel.log, "ターン終了。CPUのターン。"),
    }));
  }

  if (!duel) {
    return (
      <section className="duel-lobby">
        <p className="section-label">SINGLE DUEL</p>
        <h2>CPUデュエル</h2>
        <div className="duel-rule-card">
          <strong>VOL.1 DUEL · BUILD 005</strong>
          <p>モンスター戦闘に加え、Vol.1収録の魔法・罠カード10種を使用できます。</p>
        </div>
        <dl>
          <div><dt>自分のデッキ</dt><dd>{savedDeck.length}枚</dd></div>
          <div><dt>開始条件</dt><dd>40枚以上</dd></div>
          <div><dt>勝利報酬</dt><dd>CPUデッキから1枚</dd></div>
        </dl>
        <button className="duel-start" disabled={savedDeck.length < MIN_DECK_SIZE} onClick={startDuel}>
          {savedDeck.length >= MIN_DECK_SIZE ? "デュエル開始" : `あと${MIN_DECK_SIZE - savedDeck.length}枚必要`}
        </button>
      </section>
    );
  }

  return (
    <section className="duel-screen">
      <div className="duel-hud">
        <div><span>CPU</span><strong>{Math.max(0, duel.cpuLp)}</strong><small>LP</small></div>
        <div className="turn-badge">TURN {duel.turnNumber}<b>{duel.turn === "player" ? "YOUR TURN" : "CPU TURN"}</b></div>
        <div><span>PLAYER</span><strong>{Math.max(0, duel.playerLp)}</strong><small>LP</small></div>
      </div>

      <div className="duel-board">
        <div className="hand-summary"><span>CPU HAND</span><b>{duel.cpuHand.length}</b><span>DECK</span><b>{duel.cpuDeck.length}</b></div>
        <FieldRow zones={duel.cpuField} owner="cpu" selectedTarget={selectedAttacker !== null} onTarget={attackTarget} />
        <div className="phase-line"><span>BATTLE FIELD</span></div>
        <FieldRow
          zones={duel.playerField}
          owner="player"
          onAttack={chooseAttacker}
          equipTarget={selectedEquip !== null}
          onEquip={equipSpell}
          equipId={selectedEquip === null ? null : duel.playerHand[selectedEquip]}
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
        <div className="hand-summary"><span>YOUR HAND</span><b>{duel.playerHand.length}</b><span>DECK</span><b>{duel.playerDeck.length}</b></div>
      </div>

      <div className="duel-controls">
        <div className="duel-hand">
          {duel.playerHand.map((id, index) => {
            const card = cardById.get(id);
            if (!card) return null;
            const tributes = tributeCount(card);
            const canSummon = card.cardType === "monster"
              && duel.turn === "player"
              && !duel.normalSummoned
              && duel.playerField.length >= tributes
              && duel.playerField.length - tributes < FIELD_LIMIT;
            return (
              <article className={`hand-card hand-${card.cardType}`} key={`${id}-${index}`}>
                <strong>{card.name}</strong>
                <span>{card.kind}</span>
                {card.cardType === "monster" ? (
                  <>
                    <small>★{card.level}　ATK {card.atk} / DEF {card.def}</small>
                    <div><button disabled={!canSummon} onClick={() => summon(index, "attack")}>召喚</button><button disabled={!canSummon} onClick={() => summon(index, "defense")}>セット</button></div>
                  </>
                ) : card.cardType === "spell" ? (
                  <>
                    <small>{spellDescription(card.id)}</small>
                    <button
                      disabled={
                        duel.turn !== "player"
                        || duel.playerSpellTrap.length >= FIELD_LIMIT
                        || (card.id === "vol1-fissure" && lowestFaceUpAttackIndex(duel.cpuField) === null)
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
                    <small>ATK1000以上の召喚モンスターを破壊</small>
                    <button disabled={duel.turn !== "player" || duel.playerSpellTrap.length >= FIELD_LIMIT} onClick={() => setTrap(index)}>セット</button>
                  </>
                )}
              </article>
            );
          })}
        </div>
        <button className="end-turn" disabled={duel.turn !== "player" || Boolean(duel.result)} onClick={endTurn}>ターン終了</button>
      </div>

      <div className="duel-log" aria-live="polite">
        {duel.log.slice(-5).map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}
      </div>

      {duel.result && (
        <div className="duel-result">
          <p className="section-label">DUEL RESULT</p>
          <h2>{duel.result === "win" ? "VICTORY" : "DEFEAT"}</h2>
          {duel.result === "win" && <p>勝利報酬：<strong>{rewardName ?? "カード抽選中…"}</strong></p>}
          <button onClick={() => setDuel(null)}>デュエルメニューへ</button>
        </div>
      )}
    </section>
  );
}

function FieldRow({
  zones,
  owner,
  selectedTarget = false,
  onTarget,
  onAttack,
  equipTarget = false,
  onEquip,
  equipId,
}: {
  zones: ZoneCard[];
  owner: Side;
  selectedTarget?: boolean;
  onTarget?: (index: number) => void;
  onAttack?: (index: number) => void;
  equipTarget?: boolean;
  onEquip?: (index: number) => void;
  equipId?: string | null;
}) {
  return (
    <div className={`monster-zones zones-${owner}`}>
      {Array.from({ length: FIELD_LIMIT }, (_, index) => {
        const zone = zones[index];
        if (!zone) return <div className="empty-zone" key={index}>MONSTER</div>;
        const card = cardById.get(zone.id);
        if (!card) return null;
        const hidden = owner === "cpu" && zone.faceDown;
        const validEquipTarget = equipTarget && Boolean(equipId && canEquip(equipId, card));
        return (
          <button
            className={`field-card ${zone.position} ${selectedTarget || validEquipTarget ? "targetable" : ""}`}
            disabled={equipTarget ? !validEquipTarget : selectedTarget ? !onTarget : owner === "cpu" || zone.position !== "attack" || zone.attacked}
            key={`${zone.id}-${index}`}
            onClick={() => equipTarget ? onEquip?.(index) : selectedTarget ? onTarget?.(index) : onAttack?.(index)}
          >
            <strong>{hidden ? "伏せモンスター" : card.name}</strong>
            <span>{zone.position === "attack" ? `ATK ${effectiveAtk(zone)}` : hidden ? "DEF ???" : `DEF ${effectiveDef(zone)}`}</span>
            {!hidden && zone.equipped.length > 0 && <small>装備 ×{zone.equipped.length}</small>}
            {owner === "player" && zone.position === "attack" && <small>{zone.attacked ? "攻撃済" : "攻撃"}</small>}
          </button>
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
    const nextField = state.cpuField.filter((_, index) => !tributeIndexes.includes(index));
    const defensive = (summonChoice.card.def ?? 0) > (summonChoice.card.atk ?? 0);
    nextField.push({ id: summonChoice.card.id, position: defensive ? "defense" : "attack", faceDown: defensive, attacked: true, equipped: [] });
    state = {
      ...state,
      cpuHand: state.cpuHand.filter((_, index) => index !== summonChoice.index),
      cpuField: nextField,
      log: appendLog(state.log, defensive ? "CPUがモンスターをセット。" : `CPUが${summonChoice.card.name}を召喚。`),
    };
    const trapIndex = state.playerSpellTrap.indexOf("vol1-trap-hole");
    if (!defensive && (summonChoice.card.atk ?? 0) >= 1000 && trapIndex >= 0) {
      state = {
        ...state,
        cpuField: state.cpuField.filter((_, index) => index !== state.cpuField.length - 1),
        playerSpellTrap: state.playerSpellTrap.filter((_, index) => index !== trapIndex),
        log: appendLog(state.log, `落とし穴を発動。${summonChoice.card.name}を破壊。`),
      };
    }
  }

  state = {
    ...state,
    cpuField: state.cpuField.map((zone) => ({ ...zone, attacked: false })),
  };
  for (let index = state.cpuField.length - 1; index >= 0 && !state.result; index -= 1) {
    const attacker = state.cpuField[index];
    if (attacker.position !== "attack" || attacker.attacked) continue;
    const targetIndex = weakestTargetIndex(state.playerField);
    state = resolveBattle(state, "cpu", index, targetIndex);
  }
  if (state.result) return state;

  if (state.playerDeck.length === 0) {
    return { ...state, result: "lose", log: appendLog(state.log, "デッキからカードを引けず敗北。") };
  }
  return {
    ...state,
    playerHand: [...state.playerHand, state.playerDeck[0]],
    playerDeck: state.playerDeck.slice(1),
    playerField: state.playerField.map((zone) => ({ ...zone, attacked: false })),
    turn: "player",
    turnNumber: state.turnNumber + 1,
    normalSummoned: false,
    log: appendLog(state.log, "あなたのターン。1枚ドロー。"),
  };
}

function resolveBattle(state: DuelState, attackerSide: Side, attackerIndex: number, defenderIndex: number | null): DuelState {
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
    const next = { ...state, [attackerFieldKey]: attackerField, [defenderLpKey]: state[defenderLpKey] - damage } as DuelState;
    next.log = appendLog(state.log, `${attacker.name}の直接攻撃。${damage}ダメージ。`);
    if (next[defenderLpKey] <= 0) next.result = attackerSide === "player" ? "win" : "lose";
    return next;
  }

  const defenderZone = defenderField[defenderIndex];
  defenderZone.faceDown = false;
  const defender = cardById.get(defenderZone.id);
  if (!defender) return state;
  const attackValue = effectiveAtk(attackerZone);
  const defenseValue = defenderZone.position === "attack" ? effectiveAtk(defenderZone) : effectiveDef(defenderZone);
  let attackerDestroyed = false;
  let defenderDestroyed = false;
  let attackerDamage = 0;
  let defenderDamage = 0;

  if (defenderZone.position === "attack") {
    if (attackValue > defenseValue) {
      defenderDestroyed = true;
      defenderDamage = attackValue - defenseValue;
    } else if (attackValue < defenseValue) {
      attackerDestroyed = true;
      attackerDamage = defenseValue - attackValue;
    } else {
      attackerDestroyed = true;
      defenderDestroyed = true;
    }
  } else if (attackValue > defenseValue) defenderDestroyed = true;
  else if (attackValue < defenseValue) attackerDestroyed = true;

  const nextAttackerField = attackerDestroyed ? attackerField.filter((_, index) => index !== attackerIndex) : attackerField;
  const nextDefenderField = defenderDestroyed ? defenderField.filter((_, index) => index !== defenderIndex) : defenderField;
  const destroyedPlayerZones = [
    ...(attackerDestroyed && attackerSide === "player" ? [attackerZone] : []),
    ...(defenderDestroyed && attackerSide === "cpu" ? [defenderZone] : []),
  ];
  const next = {
    ...state,
    [attackerFieldKey]: nextAttackerField,
    [defenderFieldKey]: nextDefenderField,
    [attackerLpKey]: state[attackerLpKey] - attackerDamage,
    [defenderLpKey]: state[defenderLpKey] - defenderDamage,
    playerSpellTrap: discardEquips(state.playerSpellTrap, destroyedPlayerZones),
    log: appendLog(state.log, `${attacker.name}が${defender.name}を攻撃。${defenderDamage || attackerDamage ? `${defenderDamage || attackerDamage}ダメージ。` : "戦闘ダメージなし。"}`),
  } as DuelState;
  if (next.cpuLp <= 0) next.result = "win";
  if (next.playerLp <= 0) next.result = "lose";
  return next;
}

function expandDeck(counts: Record<string, number>) {
  return Object.entries(counts).flatMap(([id, count]) =>
    cardById.has(id) && Number.isInteger(count) && count > 0 ? Array(Math.min(3, count)).fill(id) : [],
  );
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

function weakestTargetIndex(field: ZoneCard[]) {
  if (field.length === 0) return null;
  return field
    .map((zone, index) => ({
      index,
      value: zone.position === "attack" ? effectiveAtk(zone) : effectiveDef(zone),
    }))
    .sort((a, b) => a.value - b.value)[0].index;
}

function lowestFaceUpAttackIndex(field: ZoneCard[]) {
  const candidates = field
    .map((zone, index) => ({ zone, index }))
    .filter(({ zone }) => !zone.faceDown)
    .sort((a, b) => effectiveAtk(a.zone) - effectiveAtk(b.zone));
  return candidates[0]?.index ?? null;
}

function effectiveAtk(zone: ZoneCard) {
  return (cardById.get(zone.id)?.atk ?? 0) + zone.equipped.length * 300;
}

function effectiveDef(zone: ZoneCard) {
  return (cardById.get(zone.id)?.def ?? 0) + zone.equipped.length * 300;
}

function canEquip(spellId: string, monster: Card) {
  return monster.cardType === "monster" && EQUIP_RULES[spellId] === monster.kind;
}

function removeHandCard(state: DuelState, handIndex: number): DuelState {
  return { ...state, playerHand: state.playerHand.filter((_, index) => index !== handIndex) };
}

function discardEquips(spellTrap: string[], zones: ZoneCard[]) {
  const remaining = [...spellTrap];
  zones.flatMap((zone) => zone.equipped).forEach((equipId) => {
    const index = remaining.indexOf(equipId);
    if (index >= 0) remaining.splice(index, 1);
  });
  return remaining;
}

function spellDescription(id: string) {
  if (EQUIP_RULES[id]) return `${EQUIP_RULES[id]}1体のATK・DEFを300アップ`;
  if (id === "vol1-dark-hole") return "フィールドのモンスターをすべて破壊";
  if (id === "vol1-red-medicine") return "自分のLPを500回復";
  if (id === "vol1-sparks") return "相手に200ダメージ";
  if (id === "vol1-fissure") return "相手の表側モンスターのうちATKが一番低い1体を破壊";
  return "";
}

function appendLog(log: string[], entry: string) {
  return [...log, entry].slice(-30);
}
