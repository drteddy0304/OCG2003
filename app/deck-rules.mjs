export function matchesDeckFilters(card, query, cardType, monsterClass, level, attribute = "all", race = "all") {
  if (cardType !== "all" && card.cardType !== cardType) return false;
  if (monsterClass !== "all") {
    if (card.cardType !== "monster") return false;
    if (monsterClass === "effect" && !card.effect) return false;
    if (monsterClass === "fusion" && !card.fusion) return false;
    if (monsterClass === "normal" && (card.effect || card.fusion)) return false;
  }
  if (level !== "all" && (card.cardType !== "monster" || card.level !== Number(level))) return false;
  if (attribute !== "all" && (card.cardType !== "monster" || card.attribute !== attribute)) return false;
  if (race !== "all" && (card.cardType !== "monster" || card.kind !== race)) return false;

  const normalized = query.trim().toLocaleLowerCase("ja");
  if (!normalized) return true;
  const monsterLabel = card.effect ? "効果" : card.fusion ? "融合" : card.cardType === "monster" ? "通常" : "";
  const searchable = `${card.name} ${card.kind} ${card.attribute ?? ""} ${monsterLabel} ${card.level ? `★${card.level}` : ""} ${card.atk !== undefined ? `ATK ${card.atk}` : ""} ${card.def !== undefined ? `DEF ${card.def}` : ""}`;
  return searchable.toLocaleLowerCase("ja").includes(normalized);
}
