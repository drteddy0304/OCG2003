"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardById, cards, type Card } from "./card-data";
import { battleOutcome } from "./duel-rules.mjs";

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

type ZoneCard = {
  id: string;
  position: Position;
  faceDown: boolean;
  attacked: boolean;
  equipped: string[];
  summonedTurn: number;
  positionChanged: boolean;
};

type DuelState = {
  playerDeck: string[];
  cpuDeck: string[];
  playerHand: string[];
  cpuHand: string[];
  playerField: ZoneCard[];
  cpuField: ZoneCard[];
  playerSpellTrap: string[];
  cpuSpellTrap: string[];
  playerGraveyard: string[];
  cpuGraveyard: string[];
  playerLp: number;
  cpuLp: number;
  turn: Side;
  turnNumber: number;
  phase: Phase;
  normalSummoned: boolean;
  result: Result;
  log: string[];
};

const CPU_DECK = cards.map((card) => card.id);
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
  const [pendingTribute, setPendingTribute] = useState<PendingTribute | null>(null);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [graveyardView, setGraveyardView] = useState<Side | null>(null);
  const [cpuPlayback, setCpuPlayback] = useState<CpuPlayback | null>(null);
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
  const isPlayerMainPhase = duel?.turn === "player" && (duel.phase === "main1" || duel.phase === "main2");

  useEffect(() => {
    if (duel?.result !== "win" || rewarded.current) return;
    rewarded.current = true;
    const rewardId = CPU_DECK[Math.floor(Math.random() * CPU_DECK.length)];
    onReward(rewardId);
    setRewardName(cardById.get(rewardId)?.name ?? null);
  }, [duel?.result, onReward]);

  useEffect(() => {
    if (!cpuPlayback) return;
    if (cpuPlayback.index >= cpuPlayback.messages.length) {
      setDuel(cpuPlayback.finalState);
      setCpuPlayback(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setCpuPlayback((current) => current ? { ...current, index: current.index + 1 } : null);
    }, 750);
    return () => window.clearTimeout(timer);
  }, [cpuPlayback]);

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
    setPendingTribute(null);
    setCpuPlayback(null);
    setDuel({
      playerDeck: shuffledPlayer.slice(6),
      cpuDeck: shuffledCpu.slice(5),
      playerHand: playerDraw,
      cpuHand: cpuDraw,
      playerField: [],
      cpuField: [],
      playerSpellTrap: [],
      cpuSpellTrap: [],
      playerGraveyard: [],
      cpuGraveyard: [],
      playerLp: STARTING_LP,
      cpuLp: STARTING_LP,
      turn: "player",
      turnNumber: 1,
      phase: "main1",
      normalSummoned: false,
      result: null,
      log: ["デュエル開始。先攻プレイヤーは6枚でスタート。", "第1ターンは攻撃できません。"],
    });
  }

  function summon(handIndex: number, position: Position) {
    if (!duel || !isPlayerMainPhase || duel.normalSummoned || duel.result) return;
    const id = duel.playerHand[handIndex];
    const card = cardById.get(id);
    if (!card || card.cardType !== "monster") return;
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
    if (!card || card.cardType !== "monster" || tributeIndexes.length !== tributeCount(card)) return;
    const tributedZones = duel.playerField.filter((_, index) => tributeIndexes.includes(index));
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
      playerSpellTrap: discardEquips(duel.playerSpellTrap, tributedZones),
      playerGraveyard: [...duel.playerGraveyard, ...graveCards(tributedZones)],
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
    if (!duel || !isPlayerMainPhase || duel.result || pendingTribute) return;
    const zone = duel.playerField[index];
    if (!zone || zone.attacked || zone.positionChanged || zone.summonedTurn === duel.turnNumber) return;
    const nextPosition: Position = zone.position === "defense" ? "attack" : "defense";
    setDuel({
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
    });
    setSelectedAttacker(null);
  }

  function useSpell(handIndex: number) {
    if (!duel || !isPlayerMainPhase || duel.result) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "spell") return;
    if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
    if (EQUIP_RULES[card.id]) {
      if (duel.playerSpellTrap.length >= FIELD_LIMIT) return;
      setSelectedEquip(handIndex);
      setSelectedAttacker(null);
      return;
    }

    let next = {
      ...removeHandCard(duel, handIndex),
      playerGraveyard: [...duel.playerGraveyard, card.id],
    };
    if (card.id === "vol1-dark-hole") {
      next = {
        ...next,
        playerField: [],
        cpuField: [],
        playerSpellTrap: discardEquips(next.playerSpellTrap, next.playerField),
        cpuSpellTrap: discardEquips(next.cpuSpellTrap, next.cpuField),
        playerGraveyard: [...next.playerGraveyard, ...graveCards(next.playerField)],
        cpuGraveyard: [...next.cpuGraveyard, ...graveCards(next.cpuField)],
      };
    } else if (card.id === "vol1-red-medicine") {
      next = { ...next, playerLp: next.playerLp + 500 };
    } else if (card.id === "vol1-sparks") {
      next = { ...next, cpuLp: next.cpuLp - 200 };
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
    } else return;
    next.log = appendLog(next.log, `${card.name}を発動。`);
    setDuel(next);
  }

  function equipSpell(fieldIndex: number) {
    if (!duel || !isPlayerMainPhase || selectedEquip === null) return;
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
    if (!duel || !isPlayerMainPhase || duel.result || duel.playerSpellTrap.length >= FIELD_LIMIT) return;
    const card = cardById.get(duel.playerHand[handIndex]);
    if (!card || card.cardType !== "trap") return;
    setDuel({
      ...removeHandCard(duel, handIndex),
      playerSpellTrap: [...duel.playerSpellTrap, card.id],
      log: appendLog(duel.log, "罠カードを1枚セット。"),
    });
  }

  function chooseAttacker(index: number) {
    if (!duel || duel.turn !== "player" || duel.phase !== "battle" || duel.turnNumber === 1 || duel.result) return;
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

  function advancePhase() {
    if (!duel || duel.turn !== "player" || duel.result || pendingTribute) return;
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
    if (!duel || duel.turn !== "player" || duel.result || pendingTribute) return;
    setSelectedAttacker(null);
    setSelectedEquip(null);
    const cpuStart: DuelState = {
      ...duel,
      turn: "cpu",
      turnNumber: duel.turnNumber + 1,
      phase: "main1",
      log: appendLog(duel.log, "ターン終了。CPUのターン。"),
    };
    const finalState = runCpuTurn(cpuStart);
    const markerIndex = finalState.log.lastIndexOf("ターン終了。CPUのターン。");
    const messages = finalState.log
      .slice(markerIndex >= 0 ? markerIndex + 1 : Math.max(0, finalState.log.length - 6))
      .filter((message) => message !== "あなたのターン。1枚ドロー。");
    setDuel(cpuStart);
    setCpuPlayback({
      finalState,
      messages: messages.length ? messages : ["CPUは行動せずターンを終了。"],
      index: 0,
    });
  }

  if (!duel) {
    return (
      <section className="duel-lobby">
        <p className="section-label">SINGLE DUEL</p>
        <h2>CPUデュエル</h2>
        <div className="duel-rule-card">
          <strong>VOL.1 DUEL · BUILD 011</strong>
          <p>プレイヤーとCPUの両方が、Vol.1収録の魔法・罠カード10種を使用します。</p>
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
        {duel.phase === "battle" && "攻撃するモンスターを選び、攻撃対象を選んでください。"}
        {duel.phase === "main2" && "戦闘後に召喚・セット・魔法・罠を使用できます。"}
      </p>

      {cpuPlayback && (
        <div className="cpu-playback" aria-live="assertive">
          <div>
            <p className="section-label">CPU ACTION</p>
            <strong>{cpuPlayback.messages[Math.min(cpuPlayback.index, cpuPlayback.messages.length - 1)]}</strong>
            <span>{Math.min(cpuPlayback.index + 1, cpuPlayback.messages.length)} / {cpuPlayback.messages.length}</span>
            <button onClick={() => {
              setDuel(cpuPlayback.finalState);
              setCpuPlayback(null);
            }}>演出をスキップ</button>
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
        <div className="phase-line"><span>BATTLE FIELD</span></div>
        <FieldRow
          zones={duel.playerField}
          owner="player"
          onAttack={chooseAttacker}
          canAttack={duel.phase === "battle" && duel.turnNumber > 1}
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
              && isPlayerMainPhase
              && !duel.normalSummoned
              && !pendingTribute
              && duel.playerField.length >= tributes
              && duel.playerField.length - tributes < FIELD_LIMIT;
            return (
              <article className={`hand-card hand-${card.cardType}`} key={`${id}-${index}`}>
                <strong>{card.name}</strong>
                <span>{card.kind}</span>
                <button className="card-detail-button" onClick={() => setDetailCardId(card.id)}>詳細</button>
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
                        !isPlayerMainPhase
                        || pendingTribute !== null
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
                    <button disabled={!isPlayerMainPhase || pendingTribute !== null || duel.playerSpellTrap.length >= FIELD_LIMIT} onClick={() => setTrap(index)}>セット</button>
                  </>
                )}
              </article>
            );
          })}
        </div>
        <div className="phase-actions">
          <button className="end-turn" disabled={duel.turn !== "player" || pendingTribute !== null || Boolean(duel.result)} onClick={advancePhase}>
            {duel.phase === "main1"
              ? duel.turnNumber === 1 ? "メイン2へ" : "バトルへ"
              : duel.phase === "battle" ? "メイン2へ" : "ターン終了"}
          </button>
          {duel.phase !== "main2" && (
            <button className="skip-turn" disabled={pendingTribute !== null || Boolean(duel.result)} onClick={endTurn}>ターン終了</button>
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
          {duel.result === "win" && <p>勝利報酬：<strong>{rewardName ?? "カード抽選中…"}</strong></p>}
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
        <strong>{card.kind}</strong>
        {card.cardType === "monster" ? (
          <>
            <p>属性：{card.attribute}　レベル：{card.level}</p>
            <p className="detail-stats">ATK {card.atk} / DEF {card.def}</p>
          </>
        ) : (
          <p>{card.cardType === "spell" ? spellDescription(card.id) : "ATK1000以上で召喚された相手モンスターを破壊"}</p>
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
        const validEquipTarget = equipTarget && Boolean(equipId && canEquip(equipId, card));
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
  if (state.result) return state;

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
      log: appendLog(state.log, defensive ? "CPUがモンスターをセット。" : `CPUが${summonChoice.card.name}を召喚。`),
    };
    const trapIndex = state.playerSpellTrap.indexOf("vol1-trap-hole");
    if (!defensive && (summonChoice.card.atk ?? 0) >= 1000 && trapIndex >= 0) {
      state = {
        ...state,
        cpuField: state.cpuField.filter((_, index) => index !== state.cpuField.length - 1),
        playerSpellTrap: state.playerSpellTrap.filter((_, index) => index !== trapIndex),
        cpuGraveyard: [...state.cpuGraveyard, summonChoice.card.id],
        playerGraveyard: [...state.playerGraveyard, "vol1-trap-hole"],
        log: appendLog(state.log, `落とし穴を発動。${summonChoice.card.name}を破壊。`),
      };
    }
  }

  state = setCpuTrapAndEquips(state);

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
    playerField: state.playerField.map((zone) => ({ ...zone, attacked: false, positionChanged: false })),
    turn: "player",
    turnNumber: state.turnNumber + 1,
    phase: "main1",
    normalSummoned: false,
    log: appendLog(state.log, "あなたのターン。1枚ドロー。"),
  };
}

function playCpuNormalSpells(initial: DuelState): DuelState {
  let state = initial;
  if (state.cpuSpellTrap.length >= FIELD_LIMIT) return state;

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

  if (state.cpuHand.includes("vol1-red-medicine") && state.cpuLp <= STARTING_LP - 500) {
    state = {
      ...removeCpuHandCard(state, "vol1-red-medicine"),
      cpuLp: state.cpuLp + 500,
      cpuGraveyard: [...state.cpuGraveyard, "vol1-red-medicine"],
      log: appendLog(state.log, "CPUがレッド・ポーションを発動。LPを500回復。"),
    };
  }

  if (state.cpuHand.includes("vol1-sparks")) {
    state = {
      ...removeCpuHandCard(state, "vol1-sparks"),
      playerLp: state.playerLp - 200,
      cpuGraveyard: [...state.cpuGraveyard, "vol1-sparks"],
      log: appendLog(state.log, "CPUが火の粉を発動。200ダメージ。"),
    };
    if (state.playerLp <= 0) state.result = "lose";
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
  const next = {
    ...state,
    [attackerFieldKey]: nextAttackerField,
    [defenderFieldKey]: nextDefenderField,
    [attackerLpKey]: state[attackerLpKey] - attackerDamage,
    [defenderLpKey]: state[defenderLpKey] - defenderDamage,
    playerSpellTrap: discardEquips(state.playerSpellTrap, destroyedPlayerZones),
    cpuSpellTrap: discardEquips(state.cpuSpellTrap, destroyedCpuZones),
    playerGraveyard: [...state.playerGraveyard, ...graveCards(destroyedPlayerZones)],
    cpuGraveyard: [...state.cpuGraveyard, ...graveCards(destroyedCpuZones)],
    log: appendLog(
      state.log,
      `${attacker.name}が${defender.name}を攻撃。${
        attackerDestroyed && defenderDestroyed
          ? "両方を破壊。"
          : defenderDestroyed
            ? `${defender.name}を破壊。${defenderDamage ? `${defenderDamage}ダメージ。` : ""}`
            : attackerDestroyed
              ? `${attacker.name}を破壊。${attackerDamage ? `${attackerDamage}ダメージ。` : ""}`
              : "モンスターは破壊されない。"
      }`,
    ),
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
  if (id === "vol1-red-medicine") return "自分のLPを500回復";
  if (id === "vol1-sparks") return "相手に200ダメージ";
  if (id === "vol1-fissure") return "相手の表側モンスターのうちATKが一番低い1体を破壊";
  return "";
}

function appendLog(log: string[], entry: string) {
  return [...log, entry].slice(-30);
}
