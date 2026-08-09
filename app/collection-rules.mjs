export const MAX_OWNED_COPIES = 5;

export function addCardsToCollection(collection, cardIds, maxCopies = MAX_OWNED_COPIES) {
  const next = { ...collection };
  const kept = cardIds.map((cardId) => {
    const current = Number.isInteger(next[cardId]) && next[cardId] > 0 ? next[cardId] : 0;
    if (current >= maxCopies) return false;
    next[cardId] = current + 1;
    return true;
  });
  return { collection: next, kept };
}
