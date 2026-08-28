import type { Card, Pack, Rarity } from "./card-data";

// 1999年にパック以外で頒布されたカードを、ゲーム内の40種パックとして集約する。
// 同名カードは既存カードを共有し、コレクション上で重複カードを作らない。
export const promo1999Cards: Card[] = [
  { id: "pr99-time-wizard", name: "時の魔術師", cardType: "monster", kind: "魔法使い族", attribute: "光", level: 2, atk: 500, def: 400, rarity: "SE", effect: true },
  { id: "pr99-exodia", name: "封印されしエクゾディア", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 3, atk: 1000, def: 1000, rarity: "UR", effect: true },
  { id: "pr99-dancing-elf", name: "ダンシング・エルフ", cardType: "monster", kind: "天使族", attribute: "風", level: 1, atk: 300, def: 200, rarity: "UR" },
  { id: "pr99-goddess-whim", name: "きまぐれの女神", cardType: "monster", kind: "天使族", attribute: "光", level: 3, atk: 950, def: 700, rarity: "UR", effect: true },
  { id: "pr99-turu-purun", name: "ツルプルン", cardType: "monster", kind: "水族", attribute: "水", level: 2, atk: 450, def: 500, rarity: "UR" },
  { id: "pr99-cannon-doll", name: "大砲だるま", cardType: "monster", kind: "機械族", attribute: "闇", level: 2, atk: 900, def: 500, rarity: "UR" },
  { id: "pr99-frog-slime", name: "カエルスライム", cardType: "monster", kind: "水族", attribute: "水", level: 2, atk: 700, def: 500, rarity: "UR" },
  { id: "pr99-cosmo-queen", name: "コスモクイーン", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 8, atk: 2900, def: 2450, rarity: "UR" },
  { id: "pr99-crescent-dragon", name: "クレセント・ドラゴン", cardType: "monster", kind: "ドラゴン族", attribute: "闇", level: 7, atk: 2200, def: 2350, rarity: "UR" },
  { id: "pr99-meteor-dragon", name: "メテオ・ドラゴン", cardType: "monster", kind: "ドラゴン族", attribute: "地", level: 6, atk: 1800, def: 2000, rarity: "UR" },
  { id: "pr99-blue-eyes-ultimate", name: "青眼の究極竜", cardType: "monster", kind: "ドラゴン族", attribute: "光", level: 12, atk: 4500, def: 3800, rarity: "SE", fusion: true },
  { id: "pr99-trihorn-dragon", name: "トライホーン・ドラゴン", cardType: "monster", kind: "ドラゴン族", attribute: "闇", level: 8, atk: 2850, def: 2350, rarity: "SE" },
  { id: "pr99-meteor-black-dragon", name: "メテオ・ブラック・ドラゴン", cardType: "monster", kind: "ドラゴン族", attribute: "炎", level: 8, atk: 3500, def: 2000, rarity: "SE", fusion: true },
  { id: "pr99-firewing-pegasus", name: "ファイヤー・ウイング・ペガサス", cardType: "monster", kind: "獣族", attribute: "炎", level: 6, atk: 2250, def: 1800, rarity: "SE" },
  { id: "pr99-sengenjin", name: "千年原人", cardType: "monster", kind: "獣戦士族", attribute: "地", level: 8, atk: 2750, def: 2500, rarity: "UR" },
  { id: "pr99-serpent-night-dragon", name: "エビルナイト・ドラゴン", cardType: "monster", kind: "ドラゴン族", attribute: "闇", level: 7, atk: 2350, def: 2400, rarity: "UR" },
  { id: "pr99-gate-guardian", name: "ゲート・ガーディアン", cardType: "monster", kind: "戦士族", attribute: "闇", level: 11, atk: 3750, def: 3400, rarity: "UR", effect: true },
  { id: "pr99-black-chaos-magician", name: "マジシャン・オブ・ブラックカオス", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 8, atk: 2800, def: 2600, rarity: "UR", ritual: true },
  { id: "pr99-skull-rider", name: "スカルライダー", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 6, atk: 1900, def: 1850, rarity: "UR", ritual: true },
  { id: "pr99-skull-rider-ritual", name: "スカルライダーの復活", cardType: "spell", kind: "儀式魔法", rarity: "UR" },
  { id: "pr99-right-arm", name: "封印されし者の右腕", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 1, atk: 200, def: 300, rarity: "UR" },
  { id: "pr99-left-arm", name: "封印されし者の左腕", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 1, atk: 200, def: 300, rarity: "UR" },
  { id: "pr99-perfect-moth", name: "究極完全態・グレート・モス", cardType: "monster", kind: "昆虫族", attribute: "地", level: 8, atk: 3500, def: 3000, rarity: "UR", effect: true },
  { id: "pr99-insect-armor", name: "火器付機甲鎧", cardType: "spell", kind: "装備魔法", rarity: "UR" },
  { id: "pr99-cyber-bondage", name: "サイバー・ボンテージ", cardType: "spell", kind: "装備魔法", rarity: "UR" },
  { id: "pr99-seiyaryu", name: "ホーリー・ナイト・ドラゴン", cardType: "monster", kind: "ドラゴン族", attribute: "光", level: 7, atk: 2500, def: 2300, rarity: "UR" },
  { id: "pr99-kunai-chain", name: "鎖付きブーメラン", cardType: "trap", kind: "通常罠", rarity: "UR" },
  { id: "pr99-salamandra", name: "サラマンドラ", cardType: "spell", kind: "装備魔法", rarity: "UR" },
  { id: "pr99-crush-card", name: "死のデッキ破壊ウイルス", cardType: "trap", kind: "通常罠", rarity: "UR" },
  { id: "pr99-shine-palace", name: "シャイン・キャッスル", cardType: "spell", kind: "装備魔法", rarity: "UR" },
  { id: "pr99-feather-duster", name: "ハーピィの羽根帚", cardType: "spell", kind: "通常魔法", rarity: "UR" },
  { id: "pr99-acid-trap-hole", name: "硫酸のたまった落とし穴", cardType: "trap", kind: "通常罠", rarity: "UR" },
  { id: "pr99-trial-nightmare", name: "地獄の裁判", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 4, atk: 1300, def: 900, rarity: "UR" },
  { id: "pr99-thirteenth-grave", name: "１３人目の埋葬者", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 3, atk: 1200, def: 900, rarity: "UR" },
  { id: "pr99-kanan", name: "女剣士カナン", cardType: "monster", kind: "戦士族", attribute: "地", level: 4, atk: 1400, def: 1400, rarity: "UR" },
  { id: "pr99-dark-king-abyss", name: "深淵の冥王", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 3, atk: 1200, def: 800, rarity: "UR" },
  { id: "pr99-turtle-tiger", name: "タートル・タイガー", cardType: "monster", kind: "水族", attribute: "水", level: 4, atk: 1000, def: 1500, rarity: "UR" },
  { id: "pr99-aqua-madoor", name: "アクア・マドール", cardType: "monster", kind: "魔法使い族", attribute: "水", level: 4, atk: 1200, def: 2000, rarity: "UR" },
];

export const promo1999CardIds = [
  ...promo1999Cards.map((card) => card.id),
  "stb-flame-swordsman",
  "ex-009",
];

const promoRarities: Record<string, Rarity> = Object.fromEntries(promo1999CardIds.map((id) => [id, "N"])) as Record<string, Rarity>;

Object.assign(promoRarities, {
  "pr99-blue-eyes-ultimate": "SE",
  "pr99-meteor-black-dragon": "UR",
  "pr99-gate-guardian": "UR",
  "pr99-black-chaos-magician": "UR",
  "pr99-perfect-moth": "UR",
  "pr99-time-wizard": "SR",
  "pr99-exodia": "SR",
  "pr99-trihorn-dragon": "SR",
  "pr99-feather-duster": "SR",
  "pr99-crush-card": "SR",
  "pr99-cosmo-queen": "R",
  "pr99-crescent-dragon": "R",
  "pr99-meteor-dragon": "R",
  "pr99-firewing-pegasus": "R",
  "pr99-sengenjin": "R",
  "pr99-serpent-night-dragon": "R",
  "pr99-skull-rider": "R",
  "pr99-skull-rider-ritual": "R",
  "pr99-seiyaryu": "R",
  "pr99-kunai-chain": "R",
});

export const promo1999Pack: Pack = {
  id: "promo-1999",
  name: "1999 プロモーションパック",
  releaseDate: "1999-08-26",
  category: "original",
  cardIds: promo1999CardIds,
  rarityOverrides: promoRarities,
};
