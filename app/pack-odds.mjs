export const RARITY_SLOT_WEIGHTS = Object.freeze({ SE: 0.02, UR: 0.05, SR: 0.15, R: 0.78 });

export function calculatePackCardOdds(cards, cardsPerPack = 5) {
  if (cardsPerPack === 1) {
    return cards.map((card) => ({ cardId: card.id, probability: cards.length ? 1 / cards.length : 0, slot: "special" }));
  }
  const normalCards = cards.filter((card) => card.rarity === "N");
  const rareCards = cards.filter((card) => card.rarity !== "N");
  const rarityPools = Object.fromEntries(
    Object.keys(RARITY_SLOT_WEIGHTS).map((rarity) => [rarity, rareCards.filter((card) => card.rarity === rarity)]),
  );
  const fallbackWeight = Object.entries(RARITY_SLOT_WEIGHTS)
    .filter(([rarity]) => rarityPools[rarity].length === 0)
    .reduce((sum, [, weight]) => sum + weight, 0);

  return cards.map((card) => {
    if (card.rarity === "N") {
      const perSlot = normalCards.length ? 1 / normalCards.length : 0;
      return { cardId: card.id, probability: 1 - (1 - perSlot) ** Math.max(0, cardsPerPack - 1), slot: "normal" };
    }
    const ownPool = rarityPools[card.rarity];
    const ownWeight = ownPool.length ? RARITY_SLOT_WEIGHTS[card.rarity] / ownPool.length : 0;
    const fallbackShare = rareCards.length ? fallbackWeight / rareCards.length : 0;
    return { cardId: card.id, probability: ownWeight + fallbackShare, slot: "rare" };
  });
}

export function calculateRareSlotOdds(cards, cardsPerPack = 5) {
  const cardOdds = new Map(calculatePackCardOdds(cards, cardsPerPack).map((item) => [item.cardId, item]));
  return ["SE", "UR", "SR", "R"].map((rarity) => ({
    rarity,
    probability: cards
      .filter((card) => card.rarity === rarity)
      .reduce((sum, card) => sum + (cardOdds.get(card.id)?.probability ?? 0), 0),
  }));
}
