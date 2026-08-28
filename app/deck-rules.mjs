import { cardCopyLimit } from "./limit-regulation.mjs";

export function matchesDeckFilters(card, query, cardType, monsterClass, level, attribute = "all", race = "all", rarity = "all", description = "") {
  if (cardType !== "all" && card.cardType !== cardType) return false;
  if (monsterClass !== "all") {
    if (card.cardType !== "monster") return false;
    if (monsterClass === "effect" && !card.effect) return false;
    if (monsterClass === "fusion" && !card.fusion) return false;
    if (monsterClass === "ritual" && !card.ritual) return false;
    if (monsterClass === "normal" && (card.effect || card.fusion || card.ritual)) return false;
  }
  const selectedLevels = Array.isArray(level) ? level.map(Number) : level === "all" ? [] : [Number(level)];
  if (selectedLevels.length > 0 && (card.cardType !== "monster" || !selectedLevels.includes(card.level))) return false;
  if (attribute !== "all" && (card.cardType !== "monster" || card.attribute !== attribute)) return false;
  if (race !== "all" && (card.cardType !== "monster" || card.kind !== race)) return false;
  if (rarity !== "all" && card.rarity !== rarity) return false;

  const normalized = query.trim().toLocaleLowerCase("ja");
  if (!normalized) return true;
  const monsterLabel = card.cardType === "monster"
    ? card.effect ? "効果 効果モンスター" : card.fusion ? "融合 融合モンスター" : card.ritual ? "儀式 儀式モンスター" : "通常 通常モンスター"
    : "";
  const searchable = `${card.name} ${card.kind} ${card.attribute ?? ""} ${monsterLabel} ${card.level ? `★${card.level}` : ""} ${card.atk !== undefined ? `ATK ${card.atk}` : ""} ${card.def !== undefined ? `DEF ${card.def}` : ""} ${description}`;
  return searchable.toLocaleLowerCase("ja").includes(normalized);
}

export function deckComposition(counts, cardsById) {
  return Object.entries(counts).reduce((result, [id, count]) => {
    const card = cardsById.get(id);
    if (!card || !Number.isInteger(count) || count <= 0) return result;
    if (card.cardType === "monster") {
      result.monsters += count;
      if (card.effect) result.effectMonsters += count;
      else if (card.ritual) result.ritualMonsters += count;
      else result.normalMonsters += count;
    } else if (card.cardType === "spell") {
      result.spells += count;
    } else if (card.cardType === "trap") {
      result.traps += count;
    }
    return result;
  }, { monsters: 0, normalMonsters: 0, effectMonsters: 0, ritualMonsters: 0, spells: 0, traps: 0 });
}

export function sanitizeDeckCounts(counts, collection, cardsById, fusion) {
  return Object.entries(counts).reduce((result, [id, count]) => {
    const card = cardsById.get(id);
    const owned = collection[id] ?? 0;
    if (card && Boolean(card.fusion) === fusion && Number.isInteger(count) && count > 0 && owned > 0) {
      result[id] = Math.min(count, owned, cardCopyLimit(card));
    }
    return result;
  }, {});
}

export function normalizeDeckLibrary(storedLibrary, legacyMain, legacyFusion, collection, cardsById, slotCount = 5) {
  return Object.fromEntries(Array.from({ length: slotCount }, (_, index) => index + 1).map((slot) => {
    const source = storedLibrary?.[slot] ?? (slot === 1
      ? { main: legacyMain, fusion: legacyFusion }
      : { main: {}, fusion: {} });
    return [slot, {
      main: sanitizeDeckCounts(source?.main ?? {}, collection, cardsById, false),
      fusion: sanitizeDeckCounts(source?.fusion ?? {}, collection, cardsById, true),
    }];
  }));
}
