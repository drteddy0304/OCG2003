"use client";

import { useEffect, useMemo, useState } from "react";

type Card = {
  id: string;
  name: string;
  kind: string;
  attribute: string;
  level: number;
  atk: number;
  def: number;
  flavor: string;
  rarity: "UR" | "SR" | "R" | "N";
};

const cards: Card[] = [
  { id: "blue-eyes", name: "青眼の白龍", kind: "ドラゴン族", attribute: "光", level: 8, atk: 3000, def: 2500, flavor: "高い攻撃力を誇る伝説のドラゴン。", rarity: "UR" },
  { id: "dark-magician", name: "ブラック・マジシャン", kind: "魔法使い族", attribute: "闇", level: 7, atk: 2500, def: 2100, flavor: "魔法使いとしては、攻撃力・守備力ともに最高クラス。", rarity: "UR" },
  { id: "gaia", name: "暗黒騎士ガイア", kind: "戦士族", attribute: "地", level: 7, atk: 2300, def: 2100, flavor: "風よりも速く走る馬に乗った騎士。突進攻撃に注意。", rarity: "SR" },
  { id: "winged-dragon", name: "砦を守る翼竜", kind: "ドラゴン族", attribute: "風", level: 4, atk: 1400, def: 1200, flavor: "山の砦を守る竜。天空から急降下して敵を攻撃。", rarity: "R" },
  { id: "beaver-warrior", name: "ルイーズ", kind: "獣戦士族", attribute: "地", level: 4, atk: 1200, def: 1500, flavor: "体は小さいが、草原での守備力はかなり強い。", rarity: "N" },
  { id: "silver-fang", name: "シルバー・フォング", kind: "獣族", attribute: "地", level: 3, atk: 1200, def: 800, flavor: "白銀に輝くオオカミ。見た目より凶暴。", rarity: "N" },
];

const STORAGE_KEY = "ocg2003.collection.v1";

function drawPack() {
  const pool = [...cards].sort(() => Math.random() - 0.5);
  const normal = pool.slice(0, 4);
  const rarePool = cards.filter((card) => card.rarity !== "N");
  const rare = rarePool[Math.floor(Math.random() * rarePool.length)];
  return [...normal, rare].sort(() => Math.random() - 0.5);
}

export function GameHome() {
  const [collection, setCollection] = useState<Record<string, number>>({});
  const [opened, setOpened] = useState<Card[]>([]);
  const [tab, setTab] = useState<"pack" | "collection">("pack");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCollection(JSON.parse(saved));
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
    const result = drawPack();
    const next = { ...collection };
    result.forEach((card) => {
      next[card.id] = (next[card.id] ?? 0) + 1;
    });
    setCollection(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setOpened(result);
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">OFFLINE CARD GAME</p>
          <h1>OCG 2003</h1>
        </div>
        <div className="counter" aria-label={`所持カード ${totalCount}枚`}>
          <span>COLLECTION</span>
          <strong>{ready ? totalCount : "—"}</strong>
        </div>
      </header>

      <nav className="tabs" aria-label="メインメニュー">
        <button className={tab === "pack" ? "active" : ""} onClick={() => setTab("pack")}>パック</button>
        <button className={tab === "collection" ? "active" : ""} onClick={() => setTab("collection")}>カード</button>
        <button disabled>デッキ <small>NEXT</small></button>
        <button disabled>デュエル <small>NEXT</small></button>
      </nav>

      {tab === "pack" ? (
        <section className="pack-screen">
          <div className="pack">
            <div className="pack-lines" />
            <span className="pack-kicker">DEVELOPMENT PACK</span>
            <div className="pack-logo">OCG<br /><b>2003</b></div>
            <p>TEST EDITION</p>
          </div>
          <div className="pack-copy">
            <p className="section-label">開発用テストパック</p>
            <h2>最初の5枚を<br />手に入れよう。</h2>
            <p>カードを引くたびに、端末のコレクションへ自動で保存されます。</p>
            <button className="primary" onClick={openPack}>パックを開ける <span>5枚</span></button>
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
      ) : (
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
      )}
      <footer><span>2003.12.31 RULESET</span><span>PHASE 1 · BUILD 001</span></footer>
    </main>
  );
}

function CardTile({ card }: { card: Card }) {
  return (
    <article className={`card rarity-${card.rarity.toLowerCase()}`}>
      <div className="card-name"><strong>{card.name}</strong><span>{card.attribute}</span></div>
      <div className="stars">{"★".repeat(card.level)}</div>
      <div className="card-art"><span>{card.kind}</span></div>
      <div className="card-text"><b>【{card.kind}】</b><p>{card.flavor}</p><strong>ATK/{card.atk} DEF/{card.def}</strong></div>
      <i>{card.rarity}</i>
    </article>
  );
}
