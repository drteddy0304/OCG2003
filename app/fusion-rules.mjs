export const FUSION_RECIPES = {
  "vol2-undead-warrior": ["stb-skull-servant", "bo1-ultimater"],
  "vol2-karbonala-warrior": ["vol2-m-w1", "vol2-m-w2"],
  "vol2-chaos-wizard": ["vol2-holy-elf", "vol1-curtain"],
  "vol2-mavelus": ["vol2-tyhone", "bo1-wicked-flame-wing"],
  "vol2-dragoness-wicked-knight": ["vol2-armail", "vol2-one-eyed-shield-dragon"],
  "vol3-gaia-dragon-champion": ["vol1-gaia", "vol2-curse-of-dragon"],
  "vol3-barox": ["vol5-feral-imp", "vol6-battle-steer"],
  "vol3-rare-fish": ["stb-fusionist", "vol2-enchanting-mermaid"],
  "vol3-metal-dragon": ["vol3-steel-ogre-grotto", "vol3-lesser-dragon"],
  "vol3-flower-wolf": ["vol1-silver-fang", "vol3-darkworld-thorns"],
  "vol4-deepsea-shark": ["vol4-god-fish", "vol4-tongyo"],
  "vol4-pragtical": ["vol4-trakadon", "vol4-flame-viper"],
  "vol4-thunder-god-anger": ["vol4-angel-ears", "vol4-mega-thunderball"],
  "stb-flame-swordsman": ["stb-flame-manipulator", "stb-masaki"],
  "stb-flame-knight-killer": ["stb-monster-egg", "vol3-fireyarou"],
  "stb-darkfire-dragon": ["vol1-firegrass", "vol1-petit-dragon"],
  "stb-flame-ghost": ["stb-skull-servant", "stb-magman"],
  "vol5-black-skull-dragon": ["vol4-summoned-skull", "vol3-red-eyes"],
  "vol5-roaring-ocean-snake": ["vol5-mystic-lamp", "vol5-hyosube"],
  "vol5-empress-judge": ["vol5-queens-double", "vol5-hibikime"],
  "vol5-rose-spectre": ["vol5-feral-imp", "vol5-snakeyashi"],
  "vol6-punished-eagle": ["vol6-blue-winged-crown", "vol6-niwatori"],
  "vol6-musician-king": ["vol6-witch-black-forest", "vol6-lady-faith"],
  "vol7-twin-headed-thunder-dragon": ["vol7-thunder-dragon", "vol7-thunder-dragon"],
  "vol7-labyrinth-tank": ["vol6-gigatech-wolf", "vol6-cannon-soldier"],
  "bo3-vermilion-sparrow": ["bo3-raimundos", "vol3-fireyarou"],
  "bo3-death-bird": ["bo3-takuhee", "bo3-skull-temple"],
  "bo3-kwagar-hercules": ["bo3-kuwagata-alpha", "bo3-hercules-beetle"],
  "bo3-warrior-elimination": ["bo3-otome", "bo3-headless-beauty"],
  "bo4-aqua-dragon": ["bo4-fairy-dragon", "bo4-warrior-of-tradition", "bo4-zone-eater"],
  "bo4-black-shark": ["bo4-sea-kamen", "bo4-killer-blob", "bo4-warrior-of-tradition"],
  "bo5-soul-hunter": ["bo5-genie-lamp", "bo5-invader-another-dimension"],
  "bo5-brachio-raidus": ["bo5-two-headed-king-rex", "bo5-crawling-dragon-2"],
  "bo5-golden-elephant": ["bo5-medusa-ghost", "bo5-dragon-zombie"],
  "bo5-marine-beast": ["bo5-water-magician", "bo5-behegon"],
  "bo6-kaiser-dragon": ["vol4-winged-dragon-fortress", "bo4-fairy-dragon"],
  "bo6-crimson-sunbird": ["bo4-saint-bird", "vol3-skull-red-bird"],
  "bo6-sand-witch": ["vol3-giant-soldier-stone", "vol4-ancient-elf"],
  "bo6-skelgon": ["bo5-medusa-ghost", "vol6-blackland-fire-dragon"],
  "bo6-amphibious-bugroth": ["vol4-ground-bagroth", "bo6-sea-guardian"],
  "bo7-fiend-box": ["bo7-crass-clown", "bo7-dream-clown"],
  "bo7-skull-bishop": ["bo7-wisdom-devil", "bo7-makenro"],
};

export function fusionRecipe(fusionId) {
  return FUSION_RECIPES[fusionId] ?? null;
}

const fusionSubstituteIds = new Set([
  "bo6-goddess-third-eye",
  "bo6-swamp-beast-king",
  "bo6-versago-destroyer",
  "bo6-illusion-sheep",
]);

export function isFusionSubstitute(id) {
  return fusionSubstituteIds.has(id);
}

export function canSelectFusionMaterial(recipe, selectedIds, candidateId) {
  const requiredId = recipe?.[selectedIds.length];
  if (!requiredId) return false;
  if (candidateId === requiredId) return true;
  return isFusionSubstitute(candidateId)
    && !selectedIds.some((id, index) => id !== recipe[index] && isFusionSubstitute(id));
}

export function isValidFusionSelection(recipe, selectedIds) {
  return recipe.length === selectedIds.length
    && selectedIds.every((id, index) => canSelectFusionMaterial(recipe, selectedIds.slice(0, index), id));
}

export function fusionMaterialSelection(recipe, materialIds, selectedIds = []) {
  if (selectedIds.length === recipe.length) return selectedIds;
  for (let index = 0; index < materialIds.length; index += 1) {
    const id = materialIds[index];
    if (!canSelectFusionMaterial(recipe, selectedIds, id)) continue;
    const selection = fusionMaterialSelection(recipe, materialIds.filter((_, materialIndex) => materialIndex !== index), [...selectedIds, id]);
    if (selection) return selection;
  }
  return null;
}

export function fusionChoices(fusionDeck, materialIds) {
  return [...new Set(fusionDeck)].filter((fusionId) => {
    const recipe = fusionRecipe(fusionId);
    return recipe ? Boolean(fusionMaterialSelection(recipe, materialIds)) : false;
  });
}

export function bestFusionChoice(fusionDeck, materialIds, attackById) {
  return fusionChoices(fusionDeck, materialIds)
    .sort((a, b) => (attackById[b] ?? 0) - (attackById[a] ?? 0))[0] ?? null;
}
