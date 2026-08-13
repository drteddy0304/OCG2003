import assert from "node:assert/strict";
import test from "node:test";
import { bestFusionChoice, canSelectFusionMaterial, fusionChoices, fusionMaterialSelection, fusionRecipe, isFusionSubstitute, isValidFusionSelection } from "../app/fusion-rules.mjs";

test("公式の融合素材2体を判定する", () => {
  assert.deepEqual(fusionRecipe("vol3-gaia-dragon-champion"), ["vol1-gaia", "vol2-curse-of-dragon"]);
  assert.deepEqual(fusionRecipe("vol5-black-skull-dragon"), ["vol4-summoned-skull", "vol3-red-eyes"]);
});

test("CPUは召喚可能な中から攻撃力が最も高い融合先を選ぶ", () => {
  const deck = ["vol3-gaia-dragon-champion", "vol2-karbonala-warrior"];
  const materials = ["vol1-gaia", "vol2-curse-of-dragon", "vol2-m-w1", "vol2-m-w2"];
  assert.equal(bestFusionChoice(deck, materials, {
    "vol3-gaia-dragon-champion": 2600,
    "vol2-karbonala-warrior": 1500,
  }), "vol3-gaia-dragon-champion");
});

test("融合デッキ・手札・フィールドから召喚可能な融合モンスターだけを返す", () => {
  const deck = ["vol3-gaia-dragon-champion", "vol5-black-skull-dragon"];
  assert.deepEqual(fusionChoices(deck, ["vol1-gaia", "vol2-curse-of-dragon"]), ["vol3-gaia-dragon-champion"]);
  assert.deepEqual(fusionChoices(deck, ["vol1-gaia"]), []);
});

test("Booster 6の融合代用モンスターは正規素材1体だけを代用できる", () => {
  const recipe = ["vol1-gaia", "vol2-curse-of-dragon"];
  assert.equal(isFusionSubstitute("bo6-goddess-third-eye"), true);
  assert.equal(canSelectFusionMaterial(recipe, [], "bo6-goddess-third-eye"), true);
  assert.equal(canSelectFusionMaterial(recipe, ["bo6-goddess-third-eye"], "bo6-illusion-sheep"), false);
  assert.equal(isValidFusionSelection(recipe, ["bo6-goddess-third-eye", "vol2-curse-of-dragon"]), true);
  assert.equal(isValidFusionSelection(recipe, ["bo6-goddess-third-eye", "bo6-illusion-sheep"]), false);
  assert.deepEqual(fusionChoices(["vol3-gaia-dragon-champion"], ["bo6-swamp-beast-king", "vol2-curse-of-dragon"]), ["vol3-gaia-dragon-champion"]);
  assert.deepEqual(fusionMaterialSelection(recipe, ["unrelated", "bo6-swamp-beast-king", "vol2-curse-of-dragon"]), ["bo6-swamp-beast-king", "vol2-curse-of-dragon"]);
});
