import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { struggleOfChaosCards, struggleOfChaosPack, struggleOfChaosReadyCardIds } from "../app/struggle-of-chaos-data.ts";
import { fusionRecipe } from "../app/fusion-rules.mjs";
import { armyDragonDeckIndex, attackCountAfterDeclaration, burstBreathDestroyedIndexes, deathCalculatorDamage, flipEffect, lifeAbsorbingMachineGain, piercingBattleDamage, spearDragonEndPosition, struggleAttackBlockedByFormation, struggleBattleBanishes, struggleFlipNegated, struggleHunterBattleBonus, struggleUnionAttackBonus } from "../app/duel-rules.mjs";

test("闇を制する者は発売時の全51種類を収録する", () => {
  assert.equal(struggleOfChaosCards.length, 50);
  assert.equal(new Set(struggleOfChaosCards.map((card) => card.id)).size, 50);
  assert.equal(struggleOfChaosPack.releaseDate, "2001-09-20");
  assert.equal(struggleOfChaosPack.cardIds.length, 51);
  assert.equal(struggleOfChaosPack.cardIds.at(-1), "vol4-summoned-skull");
  assert.equal(struggleOfChaosPack.rarityOverrides?.["vol4-summoned-skull"], "UR");
  assert.equal(struggleOfChaosCards.filter((card) => card.cardType === "monster").length, 30);
  assert.equal(struggleOfChaosCards.filter((card) => card.cardType === "spell").length, 11);
  assert.equal(struggleOfChaosCards.filter((card) => card.cardType === "trap").length, 9);
});

test("代表カードの能力値・融合素材が公式収録内容と一致する", () => {
  assert.deepEqual(struggleOfChaosCards.find((card) => card.id === "sc-01"), { id: "sc-01", name: "冥界の魔王 ハ・デス", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 6, atk: 2450, def: 1600, rarity: "UR", effect: true });
  assert.equal(struggleOfChaosCards.find((card) => card.id === "sc-34")?.atk, 2900);
  assert.equal(struggleOfChaosCards.find((card) => card.id === "sc-50")?.rarity, "SR");
  assert.deepEqual(fusionRecipe("sc-02"), ["sc-04", "sc-22"]);
  assert.deepEqual(fusionRecipe("sc-19"), ["sc-20", "sc-36"]);
  assert.deepEqual(fusionRecipe("sc-39"), ["sc-40", "sc-03"]);
});

test("悪魔・戦士・ドラゴンの主要戦闘効果を裁定する", () => {
  assert.equal(struggleUnionAttackBonus("戦士族", ["戦士族", "魔法使い族", "ドラゴン族"], ["sc-27"]), 400);
  assert.equal(struggleHunterBattleBonus("sc-24", "ドラゴン族", "ドラゴン族"), 1000);
  assert.equal(struggleBattleBanishes("sc-03", true), true);
  assert.equal(struggleFlipNegated("sc-01", []), true);
  assert.equal(struggleFlipNegated("sc-08", ["悪魔族", "悪魔族"]), true);
  assert.equal(struggleAttackBlockedByFormation("戦士族", 7, 7, true, "戦士族"), true);
  assert.equal(piercingBattleDamage("sc-35", [], 1900, 1200, "defense"), 700);
  assert.equal(piercingBattleDamage("sc-36", [], 2000, 1200, "defense", ["sc-48"], "ドラゴン族"), 800);
  assert.deepEqual(attackCountAfterDeclaration("sc-34", undefined, undefined, 4, true), { count: 1, exhausted: false });
  assert.deepEqual(attackCountAfterDeclaration("sc-41", 4, 1, 4, false, true), { count: 2, exhausted: true });
  assert.equal(spearDragonEndPosition("sc-35", true), "defense");
});

test("永続罠・リバース・軍隊竜・バーストブレスを裁定する", () => {
  assert.equal(deathCalculatorDamage(["sc-11"], 2), 1000);
  assert.equal(lifeAbsorbingMachineGain(["sc-12"], 1500), 750);
  assert.deepEqual(burstBreathDestroyedIndexes([{ faceDown: false, def: 1200 }, { faceDown: true, def: 100 }, { faceDown: false, def: 2600 }], 2400), [0]);
  assert.equal(armyDragonDeckIndex("sc-42", ["x", "sc-42"], true), 1);
  assert.equal(flipEffect("sc-21"), "return-monster");
  assert.equal(flipEffect("sc-25"), "take-control-fiend");
  assert.equal(flipEffect("sc-26"), "take-control-dragon");
});

test("全51種がカード一覧・対戦処理・CPUへ接続される", async () => {
  const cardData = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(cardData, /\.\.\.struggleOfChaosCards/);
  assert.match(cardData, /struggleOfChaosPack/);
  for (const marker of ["activateStruggleMonsterEffect", "activateStruggleTrap", "activateCpuStruggleEffects", "playCpuStruggleSpells", "applyFriedDrawReplacement", "struggleUnionAttackBonus", "struggleFlipNegated", "armyDragonDeckIndex", "sc-49"]) assert.match(arena, new RegExp(marker));
  assert.equal(struggleOfChaosReadyCardIds.length, 51);
  assert.deepEqual([...struggleOfChaosReadyCardIds], struggleOfChaosPack.cardIds);
});
