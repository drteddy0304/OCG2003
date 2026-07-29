export type Rarity = "UR" | "SR" | "R" | "N";

export type Card = {
  id: string;
  name: string;
  cardType: "monster" | "spell" | "trap";
  kind: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  rarity: Rarity;
};

export type Pack = {
  id: string;
  name: string;
  releaseDate: string;
  category: "official" | "original";
  cardIds: string[];
};

export const cards: Card[] = [
  { id: "vol1-cyclops", name: "サイクロプス", cardType: "monster", kind: "獣戦士族", attribute: "地", level: 4, atk: 1200, def: 1000, rarity: "N" },
  { id: "vol1-dark-magician", name: "ブラック・マジシャン", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 7, atk: 2500, def: 2100, rarity: "UR" },
  { id: "vol1-gaia", name: "暗黒騎士ガイア", cardType: "monster", kind: "戦士族", attribute: "地", level: 7, atk: 2300, def: 2100, rarity: "UR" },
  { id: "vol1-mammoth-graveyard", name: "マンモスの墓場", cardType: "monster", kind: "恐竜族", attribute: "地", level: 3, atk: 1200, def: 800, rarity: "N" },
  { id: "vol1-silver-fang", name: "シルバー・フォング", cardType: "monster", kind: "獣族", attribute: "地", level: 3, atk: 1200, def: 800, rarity: "N" },
  { id: "vol1-curtain", name: "黒魔族のカーテン", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 2, atk: 600, def: 500, rarity: "N" },
  { id: "vol1-tomozaurus", name: "トモザウルス", cardType: "monster", kind: "恐竜族", attribute: "地", level: 2, atk: 500, def: 400, rarity: "N" },
  { id: "vol1-dark-gray", name: "ダーク・グレイ", cardType: "monster", kind: "獣族", attribute: "地", level: 3, atk: 800, def: 900, rarity: "N" },
  { id: "vol1-nemuriko", name: "眠り子", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 3, atk: 800, def: 700, rarity: "N" },
  { id: "vol1-arm-of-the-dead", name: "死者の腕", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 2, atk: 600, def: 600, rarity: "N" },
  { id: "vol1-fire-reaper", name: "ファイヤー・デビル", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 2, atk: 700, def: 500, rarity: "N" },
  { id: "vol1-firegrass", name: "火炎草", cardType: "monster", kind: "植物族", attribute: "地", level: 2, atk: 700, def: 600, rarity: "N" },
  { id: "vol1-kopix", name: "コピックス", cardType: "monster", kind: "戦士族", attribute: "地", level: 2, atk: 600, def: 500, rarity: "N" },
  { id: "vol1-lala-li-oon", name: "ララ・ライウーン", cardType: "monster", kind: "雷族", attribute: "風", level: 2, atk: 600, def: 600, rarity: "N" },
  { id: "vol1-petit-dragon", name: "プチリュウ", cardType: "monster", kind: "ドラゴン族", attribute: "風", level: 2, atk: 600, def: 700, rarity: "N" },
  { id: "vol1-archfiend-marmot", name: "デーモン・ビーバー", cardType: "monster", kind: "獣族", attribute: "地", level: 2, atk: 400, def: 600, rarity: "N" },
  { id: "vol1-petit-angel", name: "プチテンシ", cardType: "monster", kind: "天使族", attribute: "光", level: 3, atk: 600, def: 900, rarity: "N" },
  { id: "vol1-dark-killer", name: "ダークキラー", cardType: "monster", kind: "昆虫族", attribute: "地", level: 2, atk: 700, def: 700, rarity: "N" },
  { id: "vol1-thunder-kid", name: "サンダー・キッズ", cardType: "monster", kind: "雷族", attribute: "風", level: 2, atk: 700, def: 600, rarity: "N" },
  { id: "vol1-babylon", name: "バビロン", cardType: "monster", kind: "獣族", attribute: "地", level: 2, atk: 700, def: 600, rarity: "N" },
  { id: "vol1-kagemusha", name: "紫炎の影武者", cardType: "monster", kind: "戦士族", attribute: "地", level: 2, atk: 800, def: 400, rarity: "N" },
  { id: "vol1-tentacle-plant", name: "ヒトデンチャク", cardType: "monster", kind: "水族", attribute: "水", level: 2, atk: 600, def: 700, rarity: "N" },
  { id: "vol1-hourglass", name: "命の砂時計", cardType: "monster", kind: "天使族", attribute: "光", level: 2, atk: 700, def: 600, rarity: "N" },
  { id: "vol1-haniwa", name: "はにわ", cardType: "monster", kind: "岩石族", attribute: "地", level: 2, atk: 500, def: 500, rarity: "N" },
  { id: "vol1-death-foot", name: "デス・フット", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 3, atk: 700, def: 800, rarity: "N" },
  { id: "vol1-candle", name: "運命のろうそく", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 2, atk: 600, def: 600, rarity: "N" },
  { id: "vol1-demons-mirror", name: "悪魔の鏡", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 2, atk: 700, def: 600, rarity: "N" },
  { id: "vol1-angry-sea-king", name: "怒りの海王", cardType: "monster", kind: "水族", attribute: "水", level: 3, atk: 800, def: 700, rarity: "N" },
  { id: "vol1-darkness-approaches", name: "闇にしたがう者", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 2, atk: 700, def: 500, rarity: "N" },
  { id: "vol1-drake", name: "ドレイク", cardType: "monster", kind: "鳥獣族", attribute: "風", level: 3, atk: 800, def: 800, rarity: "N" },
  { id: "vol1-legendary-sword", name: "伝説の剣", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol1-beast-fangs", name: "猛獣の歯", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol1-violet-crystal", name: "紫水晶", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol1-book-secret-arts", name: "秘術の書", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol1-power-kaishin", name: "ポセイドンの力", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol1-dark-hole", name: "ブラック・ホール", cardType: "spell", kind: "通常魔法", rarity: "SR" },
  { id: "vol1-red-medicine", name: "レッド・ポーション", cardType: "spell", kind: "通常魔法", rarity: "N" },
  { id: "vol1-sparks", name: "火の粉", cardType: "spell", kind: "通常魔法", rarity: "N" },
  { id: "vol1-fissure", name: "地割れ", cardType: "spell", kind: "通常魔法", rarity: "SR" },
  { id: "vol1-trap-hole", name: "落とし穴", cardType: "trap", kind: "通常罠", rarity: "SR" },
];

export const packs: Pack[] = [
  {
    id: "vol-1",
    name: "Vol.1",
    releaseDate: "1999-02-04",
    category: "official",
    cardIds: cards.map((card) => card.id),
  },
];

export const cardById = new Map(cards.map((card) => [card.id, card]));
