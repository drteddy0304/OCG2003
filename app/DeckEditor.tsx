"use client";

import { useEffect, useMemo, useState } from "react";
import { cardById, cards, type Card } from "./card-data";

const DECK_STORAGE_KEY = "ocg2003.deck.main.v1";
const COPY_LIMIT = 3;
const MIN_DECK_SIZE = 40;

type Filter = "all" | Card["cardType"];

export function DeckEditor({ collection }: { collection: Record<string, number> }) {
  const [deck, setDeck] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
      const valid = Object.entries(saved).reduce<Record<string, number>>((result, [id, count]) => {
        const owned = collection[id] ?? 0;
        if (cardById.has(id) && !cardById.get(id)?.fusion && Number.isInteger(count) && count > 0 && owned > 0) {
          result[id] = Math.min(count, owned, COPY_LIMIT);
        }
        return result;
      }, {});
      setDeck(valid);
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(valid));
    } finally {
      setReady(true);
    }
  }, [collection]);

  const total = useMemo(
    () => Object.values(deck).reduce((sum, count) => sum + count, 0),
    [deck],
  );

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ja");
    return cards.filter((card) => {
      if (!collection[card.id]) return false;
      if (card.fusion) return false;
      if (filter !== "all" && card.cardType !== filter) return false;
      if (!normalized) return true;
      return `${card.name} ${card.kind} ${card.attribute ?? ""}`.toLocaleLowerCase("ja").includes(normalized);
    });
  }, [collection, filter, query]);

  const deckCards = useMemo(
    () => cards.filter((card) => deck[card.id]).sort(compareCards),
    [deck],
  );

  function saveDeck(next: Record<string, number>) {
    setDeck(next);
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(next));
  }

  function addCard(id: string) {
    const current = deck[id] ?? 0;
    const owned = collection[id] ?? 0;
    if (current >= owned || current >= COPY_LIMIT) return;
    saveDeck({ ...deck, [id]: current + 1 });
  }

  function removeCard(id: string) {
    const current = deck[id] ?? 0;
    if (current <= 0) return;
    const next = { ...deck };
    if (current === 1) delete next[id];
    else next[id] = current - 1;
    saveDeck(next);
  }

  return (
    <section className="deck-screen">
      <div className="deck-heading">
        <div>
          <p className="section-label">DECK EDITOR</p>
          <h2>メインデッキ</h2>
          <p>所持カードから40枚以上を選択。同名カードは3枚まで。</p>
        </div>
        <div className={`deck-total ${total >= MIN_DECK_SIZE ? "valid" : ""}`}>
          <strong>{ready ? total : "—"}</strong>
          <span>CARDS</span>
        </div>
      </div>

      <div className={`deck-status ${total >= MIN_DECK_SIZE ? "valid" : ""}`} role="status">
        {total >= MIN_DECK_SIZE
          ? "デュエル可能な枚数です"
          : `あと${MIN_DECK_SIZE - total}枚でデュエル可能`}
      </div>

      <div className="deck-workspace">
        <div className="deck-panel">
          <div className="panel-title"><h3>所持カード</h3><span>{filteredCards.length}種</span></div>
          <label className="card-search">
            <span>カード検索</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・種族・属性" />
          </label>
          <div className="type-filters" aria-label="カード種類">
            {([
              ["all", "すべて"],
              ["monster", "モンスター"],
              ["spell", "魔法"],
              ["trap", "罠"],
            ] as const).map(([value, label]) => (
              <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <div className="deck-list">
            {filteredCards.length ? filteredCards.sort(compareCards).map((card) => {
              const used = deck[card.id] ?? 0;
              const owned = collection[card.id] ?? 0;
              return (
                <DeckRow
                  actionLabel="追加"
                  card={card}
                  count={`${used} / ${owned}`}
                  disabled={used >= owned || used >= COPY_LIMIT}
                  key={card.id}
                  onAction={() => addCard(card.id)}
                />
              );
            }) : <p className="deck-empty">条件に合う所持カードがありません。</p>}
          </div>
        </div>

        <div className="deck-panel main-deck-panel">
          <div className="panel-title"><h3>デッキ内容</h3><span>{total}枚</span></div>
          <div className="deck-list">
            {deckCards.length ? deckCards.map((card) => (
              <DeckRow
                actionLabel="外す"
                card={card}
                count={`× ${deck[card.id]}`}
                key={card.id}
                onAction={() => removeCard(card.id)}
              />
            )) : <p className="deck-empty">左の所持カードから追加してください。</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function compareCards(a: Card, b: Card) {
  const typeOrder = { monster: 0, spell: 1, trap: 2 };
  return typeOrder[a.cardType] - typeOrder[b.cardType]
    || (b.atk ?? -1) - (a.atk ?? -1)
    || a.name.localeCompare(b.name, "ja");
}

function DeckRow({
  actionLabel,
  card,
  count,
  disabled = false,
  onAction,
}: {
  actionLabel: string;
  card: Card;
  count: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  const typeLabel = card.cardType === "monster" ? `${card.attribute}・${card.kind}${card.effect ? "・効果" : card.fusion ? "・融合" : "・通常"}` : card.kind;
  return (
    <article className={`deck-row row-${card.cardType}`}>
      <div>
        <strong>{card.name}</strong>
        <span>{typeLabel}{card.atk !== undefined ? `　ATK ${card.atk}` : ""}</span>
      </div>
      <b>{count}</b>
      <button disabled={disabled} onClick={onAction} aria-label={`${card.name}を${actionLabel}`}>{actionLabel}</button>
    </article>
  );
}
