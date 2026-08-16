"use client";

import { useEffect, useMemo, useState } from "react";
import { cardById, cards, packs, type Card, type Rarity } from "./card-data";
import { DeckEditor } from "./DeckEditor";
import { DuelArena } from "./DuelArena";
import { addCardsToCollection, MAX_OWNED_COPIES } from "./collection-rules.mjs";
import { calculatePackCardOdds, calculateRareSlotOdds } from "./pack-odds.mjs";
import { cardDescription, rarityNames } from "./card-text";

const STORAGE_KEY = "ocg2003.collection.v1";
const DAILY_KEY = "ocg2003.daily-packs.v1";
const DAILY_PACKS = 10;
const LEGACY_CARD_IDS: Record<string, string> = {
  "dark-magician": "vol1-dark-magician",
  gaia: "vol1-gaia",
  "silver-fang": "vol1-silver-fang",
};

type DailyAllowance = { date: string; remainingByPack: Record<string, number> };
type OpenedCard = { card: Card; discarded: boolean };

function freshPackAllowances() {
  return Object.fromEntries(packs.map((pack) => [pack.id, DAILY_PACKS]));
}

function jstDateKey(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function loadDailyAllowance(): DailyAllowance {
  const today = jstDateKey();
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_KEY) ?? "null") as DailyAllowance | null;
    if (saved?.date === today && saved.remainingByPack && typeof saved.remainingByPack === "object") {
      const remainingByPack = Object.fromEntries(packs.map((pack) => {
        const value = saved.remainingByPack[pack.id];
        return [pack.id, Number.isInteger(value) ? Math.max(0, Math.min(DAILY_PACKS, value)) : DAILY_PACKS];
      }));
      return { date: today, remainingByPack };
    }
  } catch {
    // 壊れた端末データは当日分を再作成する。
  }
  const fresh = { date: today, remainingByPack: freshPackAllowances() };
  localStorage.setItem(DAILY_KEY, JSON.stringify(fresh));
  return fresh;
}

function randomCard(pool: Card[]) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function packCards(pack: (typeof packs)[number]) {
  return pack.cardIds
    .map((id) => {
      const card = cardById.get(id);
      const rarity = pack.rarityOverrides?.[id];
      return card ? (rarity ? { ...card, rarity } : card) : null;
    })
    .filter((card): card is Card => Boolean(card));
}

function drawPack(packId: string) {
  const pack = packs.find((item) => item.id === packId) ?? packs[0];
  const pool = packCards(pack);
  const normalPool = pool.filter((card) => card.rarity === "N");
  const rarityRoll = Math.random();
  const rareRarity: Rarity = rarityRoll < 0.02 ? "SE" : rarityRoll < 0.07 ? "UR" : rarityRoll < 0.22 ? "SR" : "R";
  const rarePool = pool.filter((card) => card.rarity === rareRarity);
  const result = Array.from({ length: 4 }, () => randomCard(normalPool));
  result.push(randomCard(rarePool.length ? rarePool : pool.filter((card) => card.rarity !== "N")));
  return result.sort(() => Math.random() - 0.5);
}

export function GameHome() {
  const [collection, setCollection] = useState<Record<string, number>>({});
  const [opened, setOpened] = useState<OpenedCard[]>([]);
  const [tab, setTab] = useState<"pack" | "collection" | "deck" | "duel">("pack");
  const [selectedPackId, setSelectedPackId] = useState(packs[0].id);
  const [remainingByPack, setRemainingByPack] = useState<Record<string, number>>(freshPackAllowances);
  const [showPackDetails, setShowPackDetails] = useState(false);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, number>;
        const migrated = Object.entries(parsed).reduce<Record<string, number>>((result, [id, count]) => {
          const currentId = LEGACY_CARD_IDS[id] ?? id;
          if (cardById.has(currentId) && Number.isInteger(count) && count > 0) {
            result[currentId] = Math.min(MAX_OWNED_COPIES, (result[currentId] ?? 0) + count);
          }
          return result;
        }, {});
        setCollection(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
      setRemainingByPack(loadDailyAllowance().remainingByPack);
    } finally {
      setReady(true);
    }
  }, []);

  const uniqueCount = Object.keys(collection).length;
  const totalCount = useMemo(
    () => Object.values(collection).reduce((sum, count) => sum + count, 0),
    [collection],
  );
  const selectedPack = packs.find((pack) => pack.id === selectedPackId) ?? packs[0];
  const selectedRemaining = remainingByPack[selectedPackId] ?? DAILY_PACKS;
  const selectedPackCards = packCards(selectedPack);
  const detailCard = selectedPackCards.find((card) => card.id === detailCardId) ?? (detailCardId ? cardById.get(detailCardId) : null);
  const selectedPackOdds = new Map(calculatePackCardOdds(selectedPackCards).map((item) => [item.cardId, item]));
  const selectedRareOdds = calculateRareSlotOdds(selectedPackCards);

  function openPack() {
    const allowance = loadDailyAllowance();
    const remaining = allowance.remainingByPack[selectedPackId] ?? DAILY_PACKS;
    if (remaining <= 0) {
      setRemainingByPack(allowance.remainingByPack);
      return;
    }
    const result = drawPack(selectedPackId);
    const addition = addCardsToCollection(collection, result.map((card) => card.id));
    const next = addition.collection;
    const nextAllowance = {
      ...allowance,
      remainingByPack: { ...allowance.remainingByPack, [selectedPackId]: remaining - 1 },
    };
    setCollection(next);
    setRemainingByPack(nextAllowance.remainingByPack);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(DAILY_KEY, JSON.stringify(nextAllowance));
    setOpened(result.map((card, index) => ({ card, discarded: !addition.kept[index] })));
  }

  function awardCard(cardId: string) {
    const addition = addCardsToCollection(collection, [cardId]);
    const next = addition.collection;
    setCollection(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return addition.kept[0];
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">OFFLINE CARD GAME</p>
          <h1>OCG 2003</h1>
        </div>
        <div className="counter" aria-label={`所持カード ${totalCount}枚`}>
          <span>{selectedPack.name} 本日の残り</span>
          <strong>{ready ? `${selectedRemaining} PACK` : "—"}</strong>
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
              <div className="pack-logo">Vol.<br /><b>{selectedPack.name.replace("Vol.", "")}</b></div>
              <p>{selectedPack.releaseDate.replaceAll("-", ".")}</p>
            </div>
            <p className="pack-count">{selectedRemaining} / {DAILY_PACKS} PACKS</p>
          </div>
          <div className="pack-copy">
            <p className="section-label">SELECT BOOSTER PACK</p>
            <h2>好きなパックを<br />選んで開封。</h2>
            <div className="pack-selector" role="list" aria-label="パック選択">
              {packs.map((pack) => (
                <button
                  className={selectedPackId === pack.id ? "selected" : ""}
                  key={pack.id}
                  onClick={() => {
                    setSelectedPackId(pack.id);
                    setOpened([]);
                  }}
                  role="listitem"
                >
                  <span><b>{pack.name}</b><small>{pack.releaseDate.replaceAll("-", ".")} · 残り{remainingByPack[pack.id] ?? DAILY_PACKS}</small></span>
                  <strong>{pack.cardIds.length}種</strong>
                </button>
              ))}
            </div>
            <p>各パックを毎日10回まで開封できます。0:00（日本時間）にパックごとに回復します。カードは同名5枚まで所持でき、6枚目以降は自動で破棄されます。</p>
            <p className="rarity-note">レア枠の基準：SE 2% ／ UR 5% ／ SR 15% ／ R 78%（未収録分は再配分）</p>
            <button className="pack-details-button" onClick={() => setShowPackDetails(true)}>
              収録カード・このパックの排出率を見る
            </button>
            <button className="primary" onClick={openPack} disabled={!ready || selectedRemaining === 0}>
              {selectedRemaining > 0 ? "パックを開ける" : "このパックの本日分は終了"} <span>5枚</span>
            </button>
          </div>

          {opened.length > 0 && (
            <div className="results" aria-live="polite">
              <div className="result-heading">
                <p className="section-label">OPEN RESULT</p>
                <button onClick={() => setOpened([])}>閉じる</button>
              </div>
              <div className="card-row">
                {opened.map(({ card, discarded }, index) => (
                  <div className={discarded ? "opened-card discarded" : "opened-card"} key={`${card.id}-${index}`}>
                    <CardTile card={card} onSelect={() => setDetailCardId(card.id)} />
                    {discarded && <span>所持上限・自動破棄</span>}
                  </div>
                ))}
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
                <div className="owned-card" key={card.id}><CardTile card={card} onSelect={() => setDetailCardId(card.id)} /><span>× {collection[card.id]}</span></div>
              ))}
            </div>
          )}
        </section>
      ) : tab === "deck"
        ? <DeckEditor collection={collection} />
        : <DuelArena collection={collection} onReward={awardCard} />}
      {showPackDetails && (
        <div className="pack-details-overlay" role="dialog" aria-modal="true" aria-label={`${selectedPack.name}の収録カード`}>
          <section className="pack-details-panel">
            <div className="pack-details-heading">
              <div><p className="section-label">PACK CONTENTS</p><h2>{selectedPack.name}</h2></div>
              <button onClick={() => setShowPackDetails(false)}>閉じる</button>
            </div>
            <p className="odds-help">1パックは通常枠4枚＋レア枠1枚です。表示率は、そのカードが1パックに1枚以上含まれる確率です。</p>
            <div className="rarity-odds" aria-label="レア枠の排出率">
              {selectedRareOdds.filter((item) => item.probability > 0).map((item) => (
                <div className={`odds-${item.rarity.toLowerCase()}`} key={item.rarity}>
                  <span>{item.rarity}</span><strong>{formatRate(item.probability)}</strong><small>{rarityNames[item.rarity as Rarity]}</small>
                </div>
              ))}
            </div>
            <div className="pack-card-list">
              {selectedPackCards.map((card) => {
                const odds = selectedPackOdds.get(card.id);
                return (
                  <button className={`pack-card-entry entry-${card.rarity.toLowerCase()}`} key={card.id} onClick={() => setDetailCardId(card.id)}>
                    <span className="entry-rarity">{card.rarity}</span>
                    <span><strong>{card.name}</strong><small>{card.cardType === "monster" ? `${card.attribute}属性・${card.kind}・★${card.level}` : card.kind}</small></span>
                    <b>{odds ? formatRate(odds.probability) : "—"}</b>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {detailCardId && detailCard && (
        <div className="card-info-overlay" role="dialog" aria-modal="true" aria-label="カード詳細">
          <section className={`card-info-panel info-${detailCard.rarity.toLowerCase()}`}>
            <CardTile card={detailCard} />
            <div>
              <p className="section-label">CARD TEXT</p>
              <h2>{detailCard.name}</h2>
              <span className={`rarity-title title-${detailCard.rarity.toLowerCase()}`}>
                {detailCard.rarity} · {rarityNames[detailCard.rarity]}
              </span>
              <p className="full-card-text">{cardDescription(detailCard)}</p>
              {detailCard.cardType === "monster" && (
                <p className="full-card-stats">{detailCard.attribute}属性　{detailCard.kind}　★{detailCard.level}<br />ATK {detailCard.atk} / DEF {detailCard.def}</p>
              )}
              <button className="overlay-close" onClick={() => setDetailCardId(null)}>閉じる</button>
            </div>
          </section>
        </div>
      )}
      <footer><span>2003.12.31 RULESET</span><span>PHASE 2 · BUILD 132</span></footer>
    </main>
  );
}

function CardTile({ card, onSelect }: { card: Card; onSelect?: () => void }) {
  const isMonster = card.cardType === "monster";
  return (
    <article
      className={`card card-${card.cardType} rarity-${card.rarity.toLowerCase()}${onSelect ? " card-selectable" : ""}`}
      onClick={onSelect}
      onKeyDown={onSelect ? (event) => { if (event.key === "Enter" || event.key === " ") onSelect(); } : undefined}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="card-name"><strong>{card.name}</strong><span>{card.attribute ?? (card.cardType === "spell" ? "魔" : "罠")}</span></div>
      <div className="stars">{isMonster ? "★".repeat(card.level ?? 0) : card.kind}</div>
      <div className="card-art"><span>{card.kind}</span>{card.effect && <em className="effect-badge">効果</em>}</div>
      <div className="card-text">
        <b>【{card.kind}】</b>
        <p>{cardDescription(card)}</p>
        {isMonster && <strong>ATK/{card.atk} DEF/{card.def}</strong>}
      </div>
      <i><b>{card.rarity}</b><span>{rarityNames[card.rarity]}</span></i>
    </article>
  );
}

function formatRate(probability: number) {
  const percent = probability * 100;
  return `${percent < 0.1 ? percent.toFixed(2) : percent.toFixed(1)}%`;
}
