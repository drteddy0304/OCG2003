import assert from "node:assert/strict";
import test from "node:test";
import { bestFusionChoice, fusionChoices, fusionRecipe } from "../app/fusion-rules.mjs";

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
