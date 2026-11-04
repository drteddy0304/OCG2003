import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mythologicalAgeCards, mythologicalAgePack, mythologicalAgeReadyCardIds } from "../app/mythological-age-data.ts";
import { fusionRecipe } from "../app/fusion-rules.mjs";
import { bubbleCrashDiscardCount, canMonsterAttackDirectly, fieldSpellStatModifier, fiberJarReset, isSpiritMonster, lastBattleWinner, mythologicalBattleAttackBonus, mythologicalBattleDamage, mythologicalBattleDamageEffect, mythologicalTrapOutcome, piercingBattleDamage, spiritReturnsAtEnd } from "../app/duel-rules.mjs";

test("蘇りし魂は発売時の全52種類を収録する", () => {
  assert.equal(mythologicalAgeCards.length, 51);
  assert.equal(new Set(mythologicalAgeCards.map((card) => card.id)).size, 51);
  assert.equal(mythologicalAgePack.releaseDate, "2001-11-29");
  assert.equal(mythologicalAgePack.cardIds.length, 52);
  assert.equal(mythologicalAgePack.cardIds.at(-1), "vol5-black-skull-dragon");
  assert.equal(mythologicalAgePack.rarityOverrides?.["vol5-black-skull-dragon"], "UR");
  assert.equal(mythologicalAgeCards.filter((card) => card.cardType === "monster").length, 26);
  assert.equal(mythologicalAgeCards.filter((card) => card.cardType === "spell").length, 13);
  assert.equal(mythologicalAgeCards.filter((card) => card.cardType === "trap").length, 12);
  assert.deepEqual([...mythologicalAgeReadyCardIds], mythologicalAgePack.cardIds);
});

test("代表カードの能力値・融合素材・レアリティが一致する", () => {
  assert.equal(mythologicalAgeCards.find((card) => card.id === "ma-11")?.name, "お注射天使リリー");
  assert.equal(mythologicalAgeCards.find((card) => card.id === "ma-11")?.rarity, "R");
  assert.equal(mythologicalAgeCards.find((card) => card.id === "ma-22")?.atk, 2800);
  assert.equal(mythologicalAgeCards.find((card) => card.id === "ma-51")?.rarity, "SR");
  assert.deepEqual(fusionRecipe("ma-25"), ["ma-04", "ma-05"]);
  assert.deepEqual(fusionRecipe("ma-26"), ["ma-05", "ma-04"]);
});

test("スピリットと主要戦闘効果を裁定する", () => {
  assert.equal(isSpiritMonster("ma-17"), true);
  assert.equal(spiritReturnsAtEnd("ma-17", false, 8, 8), true);
  assert.equal(spiritReturnsAtEnd("ma-17", false, 8, 8, true), false);
  assert.equal(canMonsterAttackDirectly("ma-16"), true);
  assert.equal(mythologicalBattleAttackBonus("ma-11", false, true, 8000), 3000);
  assert.equal(mythologicalBattleAttackBonus("ma-25", true), 1000);
  assert.equal(mythologicalBattleAttackBonus("ma-26", false, true), 1000);
  assert.equal(mythologicalBattleDamage("ma-18", 1551), 775);
  assert.equal(piercingBattleDamage("ma-13", [], 1900, 1400, "defense"), 500);
  assert.deepEqual(mythologicalBattleDamageEffect("ma-19", 100, 2), { draw: 3, heal: 0, skipDraw: false, skipBattle: false, discardHandBeforeDraw: false });
  assert.equal(mythologicalBattleDamageEffect("ma-17", 200).skipDraw, true);
  assert.equal(mythologicalBattleDamageEffect("ma-20", 200).skipBattle, true);
  assert.equal(mythologicalBattleDamageEffect("ma-22", 200).discardHandBeforeDraw, true);
  assert.equal(mythologicalBattleDamageEffect("ma-24", 1200).heal, 1200);
});

test("魔法・罠・特殊勝敗の主要裁定を実装する", () => {
  assert.equal(fieldSpellStatModifier("水族", ["ma-30"], "水", "atk"), 200);
  assert.equal(mythologicalTrapOutcome("ma-44", { summonedAttack: 1500 }).banishSummoned, true);
  assert.equal(mythologicalTrapOutcome("ma-48", { battleDamage: 2000 }).heal, 4000);
  assert.equal(mythologicalTrapOutcome("ma-43", { specialSummon: true, lifePoints: 1000 }).lifeCost, 800);
  assert.equal(bubbleCrashDiscardCount(4, 3), 2);
  assert.equal(lastBattleWinner(2000, 2000), "draw");
  assert.deepEqual(fiberJarReset(["a"], ["b"], ["c"], ["d"], ["e"], ["f"]), { playerDeckCards: ["a", "c", "e"], cpuDeckCards: ["b", "d", "f"], drawCount: 5 });
});

test("全52種がカード一覧・テキスト・対戦処理・CPUへ接続される", async () => {
  const cardData = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  const cardText = await readFile(new URL("../app/card-text.ts", import.meta.url), "utf8");
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(cardData, /\.\.\.mythologicalAgeCards/);
  assert.match(cardData, /mythologicalAgePack/);
  for (const card of mythologicalAgeCards.filter((card) => card.effect || card.cardType !== "monster")) assert.match(cardText, new RegExp(`"${card.id}":`));
  for (const marker of ["returnSpiritsAtEndPhase", "fiber-jar", "mythologicalBattleDamageEffect", "ma-44", "ma-30"]) assert.match(arena, new RegExp(marker));
});
