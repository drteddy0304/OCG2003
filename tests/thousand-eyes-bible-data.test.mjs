import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { thousandEyesBibleCards, thousandEyesBiblePack, thousandEyesBibleReadyCardIds } from "../app/thousand-eyes-bible-data.ts";
import { attackCountAfterDeclaration, bombBugDestroys, cyberSummonTributes, deathHamsterDeckIndex, flipEffect, goblinAttackForceEndPosition, ladybugDestroys, parasitePlacementAfterBattleDamage, piercingBattleDamage, swordHunterBonus, thousandEyesAttackBlocked, vampireBabyCanRevive } from "../app/duel-rules.mjs";
import { fusionRecipe } from "../app/fusion-rules.mjs";

test("Thousand Eyes Bibleは2000年12月14日発売の全52種類", () => {
  assert.equal(thousandEyesBiblePack.releaseDate, "2000-12-14");
  assert.equal(thousandEyesBibleCards.length, 52);
  assert.equal(new Set(thousandEyesBibleCards.map((card) => card.id)).size, 52);
  assert.deepEqual(thousandEyesBiblePack.cardIds, thousandEyesBibleCards.map((card) => card.id));
  assert.equal(thousandEyesBibleCards.filter((card) => card.cardType === "monster").length, 30);
  assert.equal(thousandEyesBibleCards.filter((card) => card.cardType === "spell").length, 10);
  assert.equal(thousandEyesBibleCards.filter((card) => card.cardType === "trap").length, 12);
});

test("パック一覧・全カード・CPU最新パックへ接続される", async () => {
  const cardData = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  const cpuSource = await readFile(new URL("../app/cpu-opponents.ts", import.meta.url), "utf8");
  assert.match(cardData, /\.\.\.thousandEyesBibleCards/);
  assert.match(cardData, /thousandEyesBiblePack/);
  assert.match(cpuSource, /fusionDeck: \["tb-34"\]/);
});

test("主要な攻撃制限・貫通・特殊召喚条件を処理する", () => {
  assert.equal(thousandEyesAttackBlocked({ kind: "昆虫族", level: 2 }, ["tb-52"], []), true);
  assert.equal(thousandEyesAttackBlocked({ kind: "戦士族", level: 4 }, [], ["tb-23"]), true);
  assert.equal(thousandEyesAttackBlocked({ kind: "戦士族", level: 4 }, [], ["tb-23"], true), false);
  assert.equal(piercingBattleDamage("tb-41", [], 1800, 1200, "defense"), 600);
  assert.equal(piercingBattleDamage("vol1-cyclops", ["tb-13"], 1800, 1200, "defense"), 600);
  assert.equal(piercingBattleDamage("vol1-cyclops", [], 1800, 1200, "defense"), 0);
  assert.equal(cyberSummonTributes("tb-50", 6, 1, 3), 0);
  assert.equal(cyberSummonTributes("tb-50", 6, 2, 3), 1);
  assert.equal(goblinAttackForceEndPosition("tb-44", true), "defense");
});

test("サウザンド・アイズ・サクリファイスの融合素材と初期実装範囲を登録する", () => {
  assert.deepEqual(fusionRecipe("tb-34"), ["mr-relinquished", "tb-33"]);
  for (const id of ["tb-13", "tb-15", "tb-23", "tb-41", "tb-44", "tb-50", "tb-51", "tb-52"]) {
    assert.equal(thousandEyesBibleReadyCardIds.includes(id), true);
  }
});

test("Thousand Eyes Bibleのリバース4種を対戦処理へ接続する", () => {
  assert.equal(flipEffect("tb-07"), "summon-death-hamster");
  assert.equal(flipEffect("tb-30"), "change-position");
  assert.equal(flipEffect("tb-37"), "destroy-set-effect-monster");
  assert.equal(flipEffect("tb-38"), "destroy-face-up-level-four");
  assert.equal(deathHamsterDeckIndex("tb-07", ["vol1-cyclops", "tb-07"]), 1);
  assert.equal(bombBugDestroys("tb-37", { effect: true }, true), true);
  assert.equal(bombBugDestroys("tb-37", { effect: false }, true), false);
  assert.equal(ladybugDestroys("tb-38", { cardType: "monster", level: 4 }, false), true);
  assert.equal(ladybugDestroys("tb-38", { cardType: "monster", level: 3 }, false), false);
});

test("隼の騎士・ソードハンター・ヴァンパイアベビー・穿孔虫の戦闘効果を処理する", () => {
  assert.deepEqual(attackCountAfterDeclaration("tb-36", undefined, undefined, 4), { count: 1, exhausted: false });
  assert.deepEqual(attackCountAfterDeclaration("tb-36", 4, 1, 4), { count: 2, exhausted: true });
  assert.equal(swordHunterBonus("tb-27", 3), 600);
  assert.equal(vampireBabyCanRevive("tb-40", { cardType: "monster" }, true, false, 1), true);
  assert.equal(vampireBabyCanRevive("tb-40", { cardType: "monster" }, true, true, 1), false);
  assert.deepEqual(parasitePlacementAfterBattleDamage("tb-28", ["vol1-cyclops", "ca-03"], ["vol2-swords-revealing-light"]), {
    sourceDeck: ["vol1-cyclops"],
    opponentDeck: ["ca-03", "vol2-swords-revealing-light"],
    placed: true,
  });
});
