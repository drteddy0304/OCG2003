import type { Card, Pack, Rarity } from "./card-data";

export const exCards: Card[] = [
  { id: "ex-009", name: "エルフの剣士", cardType: "monster", kind: "戦士族", attribute: "地", level: 4, atk: 1400, def: 1200, rarity: "N" },
  { id: "ex-023", name: "治療の神 ディアン・ケト", cardType: "spell", kind: "通常魔法", rarity: "N" },
  { id: "ex-033", name: "厳格な老魔術師", cardType: "monster", kind: "魔法使い族", attribute: "光", level: 4, atk: 1500, def: 1200, rarity: "N", effect: true },
  { id: "ex-034", name: "幻影の壁", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 4, atk: 1000, def: 1850, rarity: "N", effect: true },
  { id: "ex-035", name: "魔法剣士ネオ", cardType: "monster", kind: "魔法使い族", attribute: "光", level: 4, atk: 1700, def: 1000, rarity: "N" },
  { id: "ex-036", name: "邪剣男爵", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 4, atk: 1550, def: 800, rarity: "N" },
  { id: "ex-037", name: "人喰い宝石箱", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 4, atk: 1600, def: 1000, rarity: "N" },
  { id: "ex-038", name: "デス・ソーサラー", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 4, atk: 1450, def: 1200, rarity: "N" },
  { id: "ex-039", name: "遺言状", cardType: "spell", kind: "通常魔法", rarity: "N" },
  { id: "ex-040", name: "和睦の使者", cardType: "trap", kind: "通常罠", rarity: "N" },
  { id: "ex-055", name: "ジャッジ・マン", cardType: "monster", kind: "戦士族", attribute: "地", level: 6, atk: 2200, def: 1500, rarity: "SR" },
  { id: "ex-059", name: "逆転の女神", cardType: "monster", kind: "天使族", attribute: "光", level: 6, atk: 1800, def: 2000, rarity: "N" },
  { id: "ex-071", name: "復讐のソード・ストーカー", cardType: "monster", kind: "戦士族", attribute: "闇", level: 6, atk: 2000, def: 1600, rarity: "N" },
  { id: "ex-084", name: "ロード・オブ・ドラゴン－ドラゴンの支配者－", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 4, atk: 1200, def: 1100, rarity: "SE", effect: true },
  { id: "ex-085", name: "ドラゴンを呼ぶ笛", cardType: "spell", kind: "通常魔法", rarity: "SE" },
];

const exCardIds = [
  "vol2-holy-elf", "vol5-feral-imp", "vol4-winged-dragon-fortress", "vol4-summoned-skull", "vol3-beaver-warrior",
  "vol1-dark-magician", "vol1-gaia", "vol2-curse-of-dragon", "ex-009", "vol1-mammoth-graveyard", "bo3-great-white",
  "vol1-silver-fang", "vol3-giant-soldier-stone", "bo5-dragon-zombie", "vol4-doma", "vol3-ansatsu", "vol3-witty-phantom",
  "vol2-killer-claw", "bo3-berserker", "bo2-dark-piercing-sword", "vol1-book-secret-arts", "vol1-dark-hole", "ex-023",
  "vol4-ancient-elf", "vol5-magical-ghost", "vol1-fissure", "vol1-trap-hole", "stb-two-pronged-attack", "vol2-de-spell",
  "vol2-monster-reborn", "bo3-reinforcements", "vol5-change-heart", "ex-033", "ex-034", "ex-035", "ex-036", "ex-037",
  "ex-038", "ex-039", "ex-040", "bo5-trap-master", "stb-dragon-capture-jar", "stb-yami", "vol3-man-eater-bug",
  "bo3-reverse-trap", "stb-remove-trap", "bo3-castle-walls", "bo3-ultimate-offering", "stb-blue-eyes", "vol1-cyclops",
  "bo1-gargoyle", "bo4-worm-beast", "bo6-battle-ox", "bo7-devil-dragon", "ex-055", "vol3-rogue-doll",
  "vol4-monster-hunter", "vol2-wild-raptor", "ex-059", "vol7-centaur", "vol2-terra-terrible", "bo4-nightmare",
  "vol4-dark-assassin", "vol5-master-expert", "vol5-unknown-warrior", "vol4-black-shadow-ogre", "vol2-dark-energy",
  "bo2-awakening", "bo2-fire", "bo7-powered-gargoyle", "ex-071", "bo4-la-jinn", "bo5-rude-kaiser",
  "vol4-destroyer-golem", "vol3-skull-red-bird", "vol4-dragon-human", "vol5-pale-beast", "bo2-amateur-spy",
  "bo3-ancient-telescope", "bo5-just-desserts", "bo5-mysterious-puppeteer", "stb-sogen", "vol3-hane-hane", "ex-084", "ex-085",
];

export const exRarityOverrides: Record<string, Rarity> = Object.fromEntries(exCardIds.map((id) => [id, "N" as Rarity]));
exRarityOverrides["vol4-winged-dragon-fortress"] = "SR";
exRarityOverrides["vol1-dark-magician"] = "UR";
exRarityOverrides["stb-blue-eyes"] = "UR";
exRarityOverrides["ex-055"] = "SR";
exRarityOverrides["ex-084"] = "SE";
exRarityOverrides["ex-085"] = "SE";

export const exPack: Pack = { id: "ex", name: "EX", releaseDate: "1999-12-16", category: "official", cardIds: exCardIds, rarityOverrides: exRarityOverrides };
