import type { Card, Pack } from "./card-data";

export const godCards: Card[] = [
  { id: "g4-01-obelisk", name: "オベリスクの巨神兵", cardType: "monster", kind: "幻神獣族", attribute: "神", level: 10, atk: 4000, def: 4000, rarity: "SE", effect: true },
  { id: "g4-02-slifer", name: "オシリスの天空竜", cardType: "monster", kind: "幻神獣族", attribute: "神", level: 10, atk: 0, def: 0, rarity: "SE", effect: true },
  { id: "g4-03-ra", name: "ラーの翼神竜", cardType: "monster", kind: "幻神獣族", attribute: "神", level: 10, atk: 0, def: 0, rarity: "SE", effect: true },
];

export const godCardsPack: Pack = {
  id: "dm4-god-cards",
  name: "DM4 三幻神プロモーションパック",
  releaseDate: "2000-12-07",
  category: "original",
  cardIds: godCards.map((card) => card.id),
  cardsPerPack: 1,
};
