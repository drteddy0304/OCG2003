"use client";

import { useEffect, useMemo, useState } from "react";
import { cardById, cards, packs, type Card, type Rarity } from "./card-data";
import { cardDescription, rarityNames } from "./card-text";
import { deckComposition, matchesDeckFilters, normalizeDeckLibrary, type AttributeFilter, type DeckCardTypeFilter, type MonsterClassFilter, type RaceFilter, type RarityFilter } from "./deck-rules.mjs";
import { cardCopyLimit, cardLimitStatus, LIMIT_REGULATION_DATE } from "./limit-regulation.mjs";

const DECK_STORAGE_KEY = "ocg2003.deck.main.v1";
const FUSION_DECK_STORAGE_KEY = "ocg2003.deck.fusion.v1";
const FAVORITES_STORAGE_KEY = "ocg2003.deck.favorites.v1";
const DECK_LIBRARY_STORAGE_KEY = "ocg2003.deck.library.v1";
const ACTIVE_DECK_SLOT_STORAGE_KEY = "ocg2003.deck.active-slot.v1";
const MIN_DECK_SIZE = 40;
const DECK_SLOTS = [1, 2, 3, 4, 5] as const;
type SortOrder = "name" | "level" | "atk" | "def";
type DeckSlot = typeof DECK_SLOTS[number];
type SavedDeckSlot = { main: Record<string, number>; fusion: Record<string, number> };
type DeckLibrary = Record<string, SavedDeckSlot>;

const MONSTER_ATTRIBUTES = [...new Set(cards.flatMap((card) => card.cardType === "monster" && card.attribute ? [card.attribute] : []))];
const MONSTER_RACES = [...new Set(cards.flatMap((card) => card.cardType === "monster" ? [card.kind] : []))].sort((a, b) => a.localeCompare(b, "ja"));

export function DeckEditor({ collection }: { collection: Record<string, number> }) {
  const [deck, setDeck] = useState<Record<string, number>>({});
  const [fusionDeck, setFusionDeck] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DeckCardTypeFilter>("all");
  const [monsterClass, setMonsterClass] = useState<MonsterClassFilter>("all");
  const [levels, setLevels] = useState<number[]>([]);
  const [attribute, setAttribute] = useState<AttributeFilter>("all");
  const [race, setRace] = useState<RaceFilter>("all");
  const [rarity, setRarity] = useState<RarityFilter>("all");
  const [packFilter, setPackFilter] = useState("all");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("name");
  const [activeDeckSlot, setActiveDeckSlot] = useState<DeckSlot>(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
      const savedFusion = JSON.parse(localStorage.getItem(FUSION_DECK_STORAGE_KEY) ?? "{}") as Record<string, number>;
      const storedLibrary = JSON.parse(localStorage.getItem(DECK_LIBRARY_STORAGE_KEY) ?? "null") as DeckLibrary | null;
      const library = normalizeDeckLibrary(storedLibrary, saved, savedFusion, collection, cardById, DECK_SLOTS.length) as DeckLibrary;
      const storedActiveSlot = Number(localStorage.getItem(ACTIVE_DECK_SLOT_STORAGE_KEY));
      const activeSlot = DECK_SLOTS.includes(storedActiveSlot as DeckSlot) ? storedActiveSlot as DeckSlot : 1;
      const valid = library[activeSlot].main;
      const validFusion = library[activeSlot].fusion;
      setActiveDeckSlot(activeSlot);
      setDeck(valid);
      setFusionDeck(validFusion);
      localStorage.setItem(DECK_LIBRARY_STORAGE_KEY, JSON.stringify(library));
      localStorage.setItem(ACTIVE_DECK_SLOT_STORAGE_KEY, String(activeSlot));
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(valid));
      localStorage.setItem(FUSION_DECK_STORAGE_KEY, JSON.stringify(validFusion));
      const savedFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "{}") as Record<string, boolean>;
      const validFavorites = Object.fromEntries(
        Object.entries(savedFavorites).filter(([id, value]) => cardById.has(id) && value === true),
      );
      setFavorites(validFavorites);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(validFavorites));
    } catch {
      setDeck({});
      setFusionDeck({});
      setFavorites({});
      localStorage.removeItem(DECK_STORAGE_KEY);
      localStorage.removeItem(FUSION_DECK_STORAGE_KEY);
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      localStorage.removeItem(DECK_LIBRARY_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_DECK_SLOT_STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, [collection]);

  const total = useMemo(
    () => Object.values(deck).reduce((sum, count) => sum + count, 0),
    [deck],
  );
  const fusionTotal = useMemo(
    () => Object.values(fusionDeck).reduce((sum, count) => sum + count, 0),
    [fusionDeck],
  );
  const composition = useMemo(() => deckComposition(deck, cardById), [deck]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (!collection[card.id]) return false;
      if (favoritesOnly && !favorites[card.id]) return false;
      if (packFilter !== "all" && !packs.find((pack) => pack.id === packFilter)?.cardIds.includes(card.id)) return false;
      return matchesDeckFilters(card, query, filter, monsterClass, levels, attribute, race, rarity, cardDescription(card));
    });
  }, [attribute, collection, favorites, favoritesOnly, filter, levels, monsterClass, packFilter, query, race, rarity]);

  const deckCards = useMemo(
    () => cards.filter((card) => deck[card.id]).sort(compareCards),
    [deck],
  );
  const fusionDeckCards = useMemo(
    () => cards.filter((card) => fusionDeck[card.id]).sort(compareCards),
    [fusionDeck],
  );

  function saveActiveSlot(nextMain: Record<string, number>, nextFusion: Record<string, number>) {
    const library = JSON.parse(localStorage.getItem(DECK_LIBRARY_STORAGE_KEY) ?? "{}") as DeckLibrary;
    library[activeDeckSlot] = { main: nextMain, fusion: nextFusion };
    localStorage.setItem(DECK_LIBRARY_STORAGE_KEY, JSON.stringify(library));
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(nextMain));
    localStorage.setItem(FUSION_DECK_STORAGE_KEY, JSON.stringify(nextFusion));
  }

  function saveDeck(next: Record<string, number>) {
    setDeck(next);
    saveActiveSlot(next, fusionDeck);
  }

  function saveFusionDeck(next: Record<string, number>) {
    setFusionDeck(next);
    saveActiveSlot(deck, next);
  }

  function selectDeckSlot(slot: DeckSlot) {
    const library = JSON.parse(localStorage.getItem(DECK_LIBRARY_STORAGE_KEY) ?? "{}") as DeckLibrary;
    const selected = library[slot] ?? { main: {}, fusion: {} };
    setActiveDeckSlot(slot);
    setDeck(selected.main);
    setFusionDeck(selected.fusion);
    localStorage.setItem(ACTIVE_DECK_SLOT_STORAGE_KEY, String(slot));
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(selected.main));
    localStorage.setItem(FUSION_DECK_STORAGE_KEY, JSON.stringify(selected.fusion));
  }

  function resetActiveDeck() {
    if (!window.confirm(`デッキ${activeDeckSlot}のメインデッキと融合デッキを空にしますか？`)) return;
    setDeck({});
    setFusionDeck({});
    saveActiveSlot({}, {});
  }

  function addCard(id: string) {
    const fusion = Boolean(cardById.get(id)?.fusion);
    const targetDeck = fusion ? fusionDeck : deck;
    const current = targetDeck[id] ?? 0;
    const owned = collection[id] ?? 0;
    const copyLimit = cardCopyLimit(cardById.get(id)!);
    if (current >= owned || current >= copyLimit) return;
    const next = { ...targetDeck, [id]: current + 1 };
    if (fusion) saveFusionDeck(next);
    else saveDeck(next);
  }

  function removeCard(id: string) {
    const fusion = Boolean(cardById.get(id)?.fusion);
    const targetDeck = fusion ? fusionDeck : deck;
    const current = targetDeck[id] ?? 0;
    if (current <= 0) return;
    const next = { ...targetDeck };
    if (current === 1) delete next[id];
    else next[id] = current - 1;
    if (fusion) saveFusionDeck(next);
    else saveDeck(next);
  }

  function toggleFavorite(id: string) {
    const next = { ...favorites };
    if (next[id]) delete next[id];
    else next[id] = true;
    setFavorites(next);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  }

  function resetFilters() {
    setQuery("");
    setFilter("all");
    setMonsterClass("all");
    setLevels([]);
    setAttribute("all");
    setRace("all");
    setRarity("all");
    setPackFilter("all");
    setFavoritesOnly(false);
  }

  return (
    <section className="deck-screen">
      <div className="deck-heading">
        <div>
          <p className="section-label">DECK EDITOR</p>
          <h2>デッキ編集</h2>
          <p>メインは40枚以上。{LIMIT_REGULATION_DATE.replaceAll("-", ".")}適用の制限・準制限カードに対応。禁止カードはありません。</p>
        </div>
        <div className={`deck-total ${total >= MIN_DECK_SIZE ? "valid" : ""}`}>
          <strong>{ready ? total : "—"}</strong>
          <span>MAIN / 融合 {fusionTotal}</span>
        </div>
      </div>

      <div className={`deck-status ${total >= MIN_DECK_SIZE ? "valid" : ""}`} role="status">
        {total >= MIN_DECK_SIZE
          ? "デュエル可能な枚数です"
          : `あと${MIN_DECK_SIZE - total}枚でデュエル可能`}
      </div>

      <div className="deck-slot-toolbar" aria-label="保存デッキ切り替え">
        <div className="deck-slot-buttons">
          {DECK_SLOTS.map((slot) => (
            <button className={activeDeckSlot === slot ? "active" : ""} key={slot} onClick={() => selectDeckSlot(slot)}>
              デッキ{slot}
            </button>
          ))}
        </div>
        <button className="reset-active-deck" onClick={resetActiveDeck}>デッキ{activeDeckSlot}をリセット</button>
      </div>

      <div className="deck-composition" aria-label="デッキ枚数バランス">
        <div><span>モンスター</span><strong>{composition.monsters}</strong></div>
        <div><span>通常</span><strong>{composition.normalMonsters}</strong></div>
        <div><span>効果</span><strong>{composition.effectMonsters}</strong></div>
        <div><span>魔法</span><strong>{composition.spells}</strong></div>
        <div><span>罠</span><strong>{composition.traps}</strong></div>
      </div>

      <div className="deck-workspace">
        <div className="deck-panel">
          <div className="panel-title"><h3>所持カード</h3><span>{filteredCards.length}種</span></div>
          <label className="card-search">
            <span>カード検索</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・効果・種族・属性" />
          </label>
          <div className="type-filters" aria-label="カード種類">
            {([
              ["all", "すべて"],
              ["monster", "モンスター"],
              ["spell", "魔法"],
              ["trap", "罠"],
            ] as const).map(([value, label]) => (
              <button
                className={filter === value ? "active" : ""}
                key={value}
                onClick={() => {
                  setFilter(value);
                  if (value === "spell" || value === "trap") {
                    setMonsterClass("all");
                    setLevels([]);
                    setAttribute("all");
                    setRace("all");
                  }
                }}
              >{label}</button>
            ))}
          </div>
          <div className="deck-advanced-filters">
            <div className="monster-filters" aria-label="モンスター分類">
              {([
                ["all", "分類すべて"],
                ["normal", "通常"],
                ["effect", "効果"],
                ["fusion", "融合"],
              ] as const).map(([value, label]) => (
                <button
                  className={monsterClass === value ? "active" : ""}
                  key={value}
                  onClick={() => {
                    setMonsterClass(value);
                    if (value !== "all") setFilter("monster");
                  }}
                >{label}</button>
              ))}
            </div>
            <div className="level-filter level-multi-filter">
              <span>★レベル</span>
              <div>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                  <button
                    className={levels.includes(value) ? "active" : ""}
                    key={value}
                    onClick={() => {
                      setLevels((current) => current.includes(value) ? current.filter((level) => level !== value) : [...current, value]);
                      setFilter("monster");
                    }}
                    aria-pressed={levels.includes(value)}
                  >★{value}</button>
                ))}
              </div>
            </div>
            <label className="attribute-filter">
              <span>属性</span>
              <select value={attribute} onChange={(event) => {
                const value = event.target.value as AttributeFilter;
                setAttribute(value);
                if (value !== "all") setFilter("monster");
              }}>
                <option value="all">すべて</option>
                {MONSTER_ATTRIBUTES.map((value) => <option value={value} key={value}>{value}属性</option>)}
              </select>
            </label>
            <label className="race-filter">
              <span>種族</span>
              <select value={race} onChange={(event) => {
                const value = event.target.value as RaceFilter;
                setRace(value);
                if (value !== "all") setFilter("monster");
              }}>
                <option value="all">すべて</option>
                {MONSTER_RACES.map((value) => <option value={value} key={value}>{value}</option>)}
              </select>
            </label>
            <label className="rarity-filter">
              <span>レア度</span>
              <select value={rarity} onChange={(event) => setRarity(event.target.value as RarityFilter)}>
                <option value="all">すべて</option>
                {(["SE", "UR", "SR", "R", "N"] as Rarity[]).map((value) => (
                  <option value={value} key={value}>{value}：{rarityNames[value]}</option>
                ))}
              </select>
            </label>
            <label className="sort-filter">
              <span>並び順</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
                <option value="name">カード名</option>
                <option value="level">★が高い順</option>
                <option value="atk">ATKが高い順</option>
                <option value="def">DEFが高い順</option>
              </select>
            </label>
          </div>
          <div className="deck-filter-actions">
            <label className="pack-filter">
              <span>収録商品</span>
              <select value={packFilter} onChange={(event) => setPackFilter(event.target.value)}>
                <option value="all">すべての商品</option>
                {packs.map((pack) => <option value={pack.id} key={pack.id}>{pack.name}</option>)}
              </select>
            </label>
            <button
              className={`favorite-filter ${favoritesOnly ? "active" : ""}`}
              onClick={() => setFavoritesOnly((current) => !current)}
              aria-pressed={favoritesOnly}
            >
              ★ お気に入りだけ表示
            </button>
            <button className="reset-deck-filters" onClick={resetFilters}>条件をリセット</button>
          </div>
          <div className="deck-list">
            {filteredCards.length ? [...filteredCards].sort((a, b) => Number(Boolean(favorites[b.id])) - Number(Boolean(favorites[a.id])) || compareCardsBy(a, b, sortOrder)).map((card) => {
              const used = (card.fusion ? fusionDeck : deck)[card.id] ?? 0;
              const owned = collection[card.id] ?? 0;
              const copyLimit = cardCopyLimit(card);
              return (
                <DeckRow
                  actionLabel={card.fusion ? "融合へ" : "追加"}
                  card={card}
                  count={`${used} / ${owned}`}
                  disabled={used >= owned || used >= copyLimit}
                  key={card.id}
                  onAction={() => addCard(card.id)}
                  favorite={Boolean(favorites[card.id])}
                  onToggleFavorite={() => toggleFavorite(card.id)}
                />
              );
            }) : <p className="deck-empty">条件に合う所持カードがありません。</p>}
          </div>
        </div>

        <div className="deck-panel main-deck-panel">
          <div className="panel-title"><h3>メインデッキ</h3><span>{total}枚</span></div>
          <div className="deck-list">
            {deckCards.length ? deckCards.map((card) => (
              <DeckRow
                actionLabel="外す"
                card={card}
                count={`× ${deck[card.id]}`}
                key={card.id}
                onAction={() => removeCard(card.id)}
                favorite={Boolean(favorites[card.id])}
                onToggleFavorite={() => toggleFavorite(card.id)}
              />
            )) : <p className="deck-empty">左の所持カードから追加してください。</p>}
          </div>
          <div className="fusion-deck-section">
            <div className="panel-title"><h3>融合デッキ</h3><span>{fusionTotal}枚・上限なし</span></div>
            <p className="fusion-deck-note">融合モンスターはデュエル開始時の手札・ドローには入りません。</p>
            <div className="deck-list fusion-deck-list">
              {fusionDeckCards.length ? fusionDeckCards.map((card) => (
                <DeckRow
                  actionLabel="外す"
                  card={card}
                  count={`× ${fusionDeck[card.id]}`}
                  key={card.id}
                  onAction={() => removeCard(card.id)}
                  favorite={Boolean(favorites[card.id])}
                  onToggleFavorite={() => toggleFavorite(card.id)}
                />
              )) : <p className="deck-empty">融合モンスターを「融合へ」で追加できます。</p>}
            </div>
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

function compareCardsBy(a: Card, b: Card, order: SortOrder) {
  if (order === "level") return (b.level ?? -1) - (a.level ?? -1) || compareCards(a, b);
  if (order === "atk") return (b.atk ?? -1) - (a.atk ?? -1) || compareCards(a, b);
  if (order === "def") return (b.def ?? -1) - (a.def ?? -1) || compareCards(a, b);
  return a.name.localeCompare(b.name, "ja");
}

function DeckRow({
  actionLabel,
  card,
  count,
  disabled = false,
  favorite,
  onAction,
  onToggleFavorite,
}: {
  actionLabel: string;
  card: Card;
  count: string;
  disabled?: boolean;
  favorite: boolean;
  onAction: () => void;
  onToggleFavorite: () => void;
}) {
  const typeLabel = card.cardType === "monster"
    ? `${card.rarity}｜${card.attribute}属性｜${card.kind}｜${card.effect ? "効果" : card.fusion ? "融合" : "通常"}｜★${card.level}`
    : `${card.rarity}｜${card.kind}`;
  return (
    <article className={`deck-row row-${card.cardType}`}>
      <div>
        <strong>{card.name}</strong>
        {cardLimitStatus(card) !== "unlimited" && (
          <span className={`deck-limit-badge ${cardLimitStatus(card)}`}>
            {cardLimitStatus(card) === "limited" ? "制限・1枚まで" : "準制限・2枚まで"}
          </span>
        )}
        <span>{typeLabel}</span>
        {(card.effect || card.fusion || card.cardType !== "monster") && <span className="deck-effect-text">{cardDescription(card)}</span>}
        {card.cardType === "monster" && <span className="monster-stats">ATK {card.atk} / DEF {card.def}</span>}
      </div>
      <b>{count}</b>
      <button
        className={`favorite-card ${favorite ? "active" : ""}`}
        onClick={onToggleFavorite}
        aria-label={`${card.name}をお気に入り${favorite ? "から外す" : "に登録"}`}
        aria-pressed={favorite}
      >★</button>
      <button disabled={disabled} onClick={onAction} aria-label={`${card.name}を${actionLabel}`}>{actionLabel}</button>
    </article>
  );
}
