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
  fusion?: boolean;
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
  { id: "vol2-holy-elf", name: "ホーリー・エルフ", cardType: "monster", kind: "魔法使い族", attribute: "光", level: 4, atk: 800, def: 2000, rarity: "SR" },
  { id: "vol2-tyhone", name: "タイホーン", cardType: "monster", kind: "鳥獣族", attribute: "風", level: 4, atk: 1200, def: 1400, rarity: "N" },
  { id: "vol2-undead-warrior", name: "アンデット・ウォーリアー", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 3, atk: 1200, def: 900, rarity: "N", fusion: true },
  { id: "vol2-curse-of-dragon", name: "カース・オブ・ドラゴン", cardType: "monster", kind: "ドラゴン族", attribute: "闇", level: 5, atk: 2000, def: 1500, rarity: "UR" },
  { id: "vol2-karbonala-warrior", name: "カルボナーラ戦士", cardType: "monster", kind: "戦士族", attribute: "地", level: 4, atk: 1500, def: 1200, rarity: "N", fusion: true },
  { id: "vol2-wild-raptor", name: "ワイルド・ラプター", cardType: "monster", kind: "恐竜族", attribute: "地", level: 4, atk: 1500, def: 800, rarity: "N" },
  { id: "vol2-chaos-wizard", name: "カオス・ウィザード", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 4, atk: 1300, def: 1100, rarity: "N", fusion: true },
  { id: "vol2-supporter-shadows", name: "物陰の協力者", cardType: "monster", kind: "戦士族", attribute: "地", level: 3, atk: 1000, def: 1000, rarity: "N" },
  { id: "vol2-blue-eyed-silver-zombie", name: "青眼の銀ゾンビ", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 3, atk: 900, def: 700, rarity: "N" },
  { id: "vol2-bewitching-phantom-thief", name: "魅惑の怪盗", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 2, atk: 700, def: 700, rarity: "N" },
  { id: "vol2-larvas", name: "ラーバス", cardType: "monster", kind: "獣族", attribute: "地", level: 3, atk: 800, def: 1000, rarity: "N" },
  { id: "vol2-hard-armor", name: "ハードアーマー", cardType: "monster", kind: "戦士族", attribute: "地", level: 3, atk: 300, def: 1200, rarity: "N" },
  { id: "vol2-man-eater", name: "マンイーター", cardType: "monster", kind: "植物族", attribute: "地", level: 2, atk: 800, def: 600, rarity: "N" },
  { id: "vol2-m-w1", name: "マグネッツ１号", cardType: "monster", kind: "戦士族", attribute: "地", level: 3, atk: 1000, def: 500, rarity: "N" },
  { id: "vol2-m-w2", name: "マグネッツ２号", cardType: "monster", kind: "戦士族", attribute: "地", level: 3, atk: 500, def: 1000, rarity: "N" },
  { id: "vol2-spirit-harp", name: "ハープの精", cardType: "monster", kind: "天使族", attribute: "光", level: 4, atk: 800, def: 2000, rarity: "N" },
  { id: "vol2-armail", name: "アーメイル", cardType: "monster", kind: "戦士族", attribute: "地", level: 3, atk: 700, def: 1300, rarity: "N" },
  { id: "vol2-killer-claw", name: "キラー・ザ・クロー", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 3, atk: 1000, def: 800, rarity: "N" },
  { id: "vol2-terra-terrible", name: "魔人 テラ", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 4, atk: 1200, def: 1300, rarity: "N" },
  { id: "vol2-drover", name: "ドローバ", cardType: "monster", kind: "水族", attribute: "水", level: 3, atk: 900, def: 800, rarity: "N" },
  { id: "vol2-solitude", name: "ソリテュード", cardType: "monster", kind: "獣戦士族", attribute: "地", level: 3, atk: 1050, def: 1000, rarity: "N" },
  { id: "vol2-spider-man", name: "蜘蛛男", cardType: "monster", kind: "昆虫族", attribute: "地", level: 3, atk: 700, def: 1400, rarity: "N" },
  { id: "vol2-wood-remains", name: "森の屍", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 3, atk: 1000, def: 900, rarity: "N" },
  { id: "vol2-d-napoleon", name: "D・ナポレオン", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 2, atk: 800, def: 400, rarity: "N" },
  { id: "vol2-enchanting-mermaid", name: "恍惚の人魚", cardType: "monster", kind: "魚族", attribute: "水", level: 3, atk: 1200, def: 900, rarity: "N" },
  { id: "vol2-stone-armadiller", name: "ストーン・アルマジラー", cardType: "monster", kind: "岩石族", attribute: "地", level: 3, atk: 800, def: 1200, rarity: "N" },
  { id: "vol2-mavelus", name: "マブラス", cardType: "monster", kind: "鳥獣族", attribute: "風", level: 4, atk: 1300, def: 900, rarity: "N", fusion: true },
  { id: "vol2-holograh", name: "ホログラー", cardType: "monster", kind: "機械族", attribute: "地", level: 3, atk: 1100, def: 700, rarity: "N" },
  { id: "vol2-dragoness-wicked-knight", name: "魔装騎士ドラゴネス", cardType: "monster", kind: "戦士族", attribute: "風", level: 3, atk: 1200, def: 900, rarity: "N", fusion: true },
  { id: "vol2-one-eyed-shield-dragon", name: "一眼の盾竜", cardType: "monster", kind: "ドラゴン族", attribute: "風", level: 3, atk: 700, def: 1300, rarity: "N" },
  { id: "vol2-dark-energy", name: "闇・エネルギー", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol2-laser-cannon-armor", name: "レーザー砲機甲鎧", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol2-vile-germs", name: "魔菌", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol2-machine-conversion-factory", name: "機械改造工場", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol2-raise-body-heat", name: "体温の上昇", cardType: "spell", kind: "装備魔法", rarity: "R" },
  { id: "vol2-goblin-secret-remedy", name: "ゴブリンの秘薬", cardType: "spell", kind: "通常魔法", rarity: "N" },
  { id: "vol2-final-flame", name: "火あぶりの刑", cardType: "spell", kind: "通常魔法", rarity: "SR" },
  { id: "vol2-swords-revealing-light", name: "光の護封剣", cardType: "spell", kind: "通常魔法", rarity: "UR" },
  { id: "vol2-monster-reborn", name: "死者蘇生", cardType: "spell", kind: "通常魔法", rarity: "SR" },
  { id: "vol2-de-spell", name: "魔法除去", cardType: "spell", kind: "通常魔法", rarity: "N" },
];

export const packs: Pack[] = [
  {
    id: "vol-1",
    name: "Vol.1",
    releaseDate: "1999-02-04",
    category: "official",
    cardIds: cards.filter((card) => card.id.startsWith("vol1-")).map((card) => card.id),
  },
  {
    id: "vol-2",
    name: "Vol.2",
    releaseDate: "1999-03-27",
    category: "official",
    cardIds: cards.filter((card) => card.id.startsWith("vol2-")).map((card) => card.id),
  },
];

export const cardById = new Map(cards.map((card) => [card.id, card]));
