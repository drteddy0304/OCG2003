"use client";

import { useEffect, useMemo, useState } from "react";
import { cardById, cards, packs, type Card, type Rarity } from "./card-data";
import { DeckEditor } from "./DeckEditor";
import { DuelArena } from "./DuelArena";

const STORAGE_KEY = "ocg2003.collection.v1";
const DAILY_KEY = "ocg2003.daily-packs.v1";
const DAILY_PACKS = 10;
const LEGACY_CARD_IDS: Record<string, string> = {
  "dark-magician": "vol1-dark-magician",
  gaia: "vol1-gaia",
  "silver-fang": "vol1-silver-fang",
};

type DailyAllowance = { date: string; remaining: number };

function jstDateKey(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function loadDailyAllowance(): DailyAllowance {
  const today = jstDateKey();
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_KEY) ?? "null") as DailyAllowance | null;
    if (saved?.date === today && Number.isInteger(saved.remaining)) {
      return { date: today, remaining: Math.max(0, Math.min(DAILY_PACKS, saved.remaining)) };
    }
  } catch {
    // 壊れた端末データは当日分を再作成する。
  }
  const fresh = { date: today, remaining: DAILY_PACKS };
  localStorage.setItem(DAILY_KEY, JSON.stringify(fresh));
  return fresh;
}

function randomCard(pool: Card[]) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function drawPack(packId: string) {
  const pack = packs.find((item) => item.id === packId) ?? packs[0];
  const pool = pack.cardIds.map((id) => cardById.get(id)).filter((card): card is Card => Boolean(card));
  const normalPool = pool.filter((card) => card.rarity === "N");
  const rarityRoll = Math.random();
  const rareRarity: Rarity = rarityRoll < 0.05 ? "UR" : rarityRoll < 0.2 ? "SR" : "R";
  const rarePool = pool.filter((card) => card.rarity === rareRarity);
  const result = Array.from({ length: 4 }, () => randomCard(normalPool));
  result.push(randomCard(rarePool.length ? rarePool : pool.filter((card) => card.rarity !== "N")));
  return result.sort(() => Math.random() - 0.5);
}

export function GameHome() {
  const [collection, setCollection] = useState<Record<string, number>>({});
  const [opened, setOpened] = useState<Card[]>([]);
  const [tab, setTab] = useState<"pack" | "collection" | "deck" | "duel">("pack");
  const [selectedPackId, setSelectedPackId] = useState(packs[0].id);
  const [remainingPacks, setRemainingPacks] = useState(DAILY_PACKS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, number>;
        const migrated = Object.entries(parsed).reduce<Record<string, number>>((result, [id, count]) => {
          const currentId = LEGACY_CARD_IDS[id] ?? id;
          if (cardById.has(currentId) && Number.isInteger(count) && count > 0) {
            result[currentId] = (result[currentId] ?? 0) + count;
          }
          return result;
        }, {});
        setCollection(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
      setRemainingPacks(loadDailyAllowance().remaining);
    } finally {
      setReady(true);
    }
  }, []);

  const uniqueCount = Object.keys(collection).length;
  const totalCount = useMemo(
    () => Object.values(collection).reduce((sum, count) => sum + count, 0),
    [collection],
  );

  function openPack() {
    const allowance = loadDailyAllowance();
    if (allowance.remaining <= 0) {
      setRemainingPacks(0);
      return;
    }
    const result = drawPack(selectedPackId);
    const next = { ...collection };
    result.forEach((card) => {
      next[card.id] = (next[card.id] ?? 0) + 1;
    });
    const nextAllowance = { ...allowance, remaining: allowance.remaining - 1 };
    setCollection(next);
    setRemainingPacks(nextAllowance.remaining);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(DAILY_KEY, JSON.stringify(nextAllowance));
    setOpened(result);
  }

  function awardCard(cardId: string) {
    const next = { ...collection, [cardId]: (collection[cardId] ?? 0) + 1 };
    setCollection(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">OFFLINE CARD GAME</p>
          <h1>OCG 2003</h1>
        </div>
        <div className="counter" aria-label={`所持カード ${totalCount}枚`}>
          <span>本日の残り</span>
          <strong>{ready ? `${remainingPacks} PACK` : "—"}</strong>
        </div>
      </header>

      <nav className="tabs" aria-label="メインメニュー">
        <button className={tab === "pack" ? "active" : ""} onClick={() => setTab("pack")}>パック</button>
        <button className={tab === "collection" ? "active" : ""} onClick={() => setTab("collection")}>カード</button>
        <button className={tab === "deck" ? "active" : ""} onClick={() => setTab("deck")}>デッキ</button>
        <button className={tab === "duel" ? "active" : ""} onClick={() => setTab("duel")}>デュエル</button>
      </nav>

      {tab === "pack" ? (
        <section className="pack-screen">
          <div className="pack-stage">
            <div className="pack">
              <div className="pack-lines" />
              <span className="pack-kicker">OFFICIAL CARD GAME</span>
              <div className="pack-logo">Vol.<br /><b>1</b></div>
              <p>1999.02.04</p>
            </div>
            <p className="pack-count">{remainingPacks} / {DAILY_PACKS} PACKS</p>
          </div>
          <div className="pack-copy">
            <p className="section-label">SELECT BOOSTER PACK</p>
            <h2>好きなパックを<br />選んで開封。</h2>
            <div className="pack-selector" role="list" aria-label="パック選択">
              {packs.map((pack) => (
                <button
                  className={selectedPackId === pack.id ? "selected" : ""}
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  role="listitem"
                >
                  <span><b>{pack.name}</b><small>{pack.releaseDate.replaceAll("-", ".")}</small></span>
                  <strong>{pack.cardIds.length}種</strong>
                </button>
              ))}
            </div>
            <p>毎日0:00（日本時間）に10パックまで回復します。未使用分は翌日に持ち越されません。</p>
            <button className="primary" onClick={openPack} disabled={!ready || remainingPacks === 0}>
              {remainingPacks > 0 ? "パックを開ける" : "本日分は終了"} <span>5枚</span>
            </button>
          </div>

          {opened.length > 0 && (
            <div className="results" aria-live="polite">
              <div className="result-heading">
                <p className="section-label">OPEN RESULT</p>
                <button onClick={() => setOpened([])}>閉じる</button>
              </div>
              <div className="card-row">
                {opened.map((card, index) => <CardTile key={`${card.id}-${index}`} card={card} />)}
              </div>
            </div>
          )}
        </section>
      ) : tab === "collection" ? (
        <section className="collection-screen">
          <div className="collection-heading">
            <div><p className="section-label">CARD COLLECTION</p><h2>カードリスト</h2></div>
            <p><strong>{uniqueCount}</strong> / {cards.length} 種</p>
          </div>
          {uniqueCount === 0 ? (
            <div className="empty"><p>カードはまだありません。</p><button onClick={() => setTab("pack")}>最初のパックを開ける</button></div>
          ) : (
            <div className="collection-grid">
              {cards.filter((card) => collection[card.id]).map((card) => (
                <div className="owned-card" key={card.id}><CardTile card={card} /><span>× {collection[card.id]}</span></div>
              ))}
            </div>
          )}
        </section>
      ) : tab === "deck"
        ? <DeckEditor collection={collection} />
        : <DuelArena collection={collection} onReward={awardCard} />}
      <footer><span>2003.12.31 RULESET</span><span>PHASE 1 · BUILD 010</span></footer>
    </main>
  );
}

function CardTile({ card }: { card: Card }) {
  const isMonster = card.cardType === "monster";
  return (
    <article className={`card card-${card.cardType} rarity-${card.rarity.toLowerCase()}`}>
      <div className="card-name"><strong>{card.name}</strong><span>{card.attribute ?? (card.cardType === "spell" ? "魔" : "罠")}</span></div>
      <div className="stars">{isMonster ? "★".repeat(card.level ?? 0) : card.kind}</div>
      <div className="card-art"><span>{card.kind}</span></div>
      <div className="card-text">
        <b>【{card.kind}】</b>
        <p>{isMonster ? "通常モンスター" : card.cardType === "spell" ? "魔法カード" : "罠カード"}</p>
        {isMonster && <strong>ATK/{card.atk} DEF/{card.def}</strong>}
      </div>
      <i>{card.rarity}</i>
    </article>
  );
}
