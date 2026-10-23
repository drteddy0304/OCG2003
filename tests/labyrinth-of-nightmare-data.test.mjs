import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { labyrinthOfNightmareCards, labyrinthOfNightmarePack, labyrinthOfNightmareReadyCardIds } from "../app/labyrinth-of-nightmare-data.ts";
import { fusionRecipe } from "../app/fusion-rules.mjs";
import { darkDoorPreventsAttack, equippedMonsterStats, flipEffect, monsterCannotAttackDirectly, paralyzingPotionPreventsAttack, piercingBattleDamage, royalCommandNegatesFlip, vengefulBogPreventsAttack, zombairaAttackLossAfterDestroy } from "../app/duel-rules.mjs";

test("悪夢の迷宮は発売時の全53種類を収録する", () => {
  assert.equal(labyrinthOfNightmareCards.length, 53);
  assert.equal(new Set(labyrinthOfNightmareCards.map((card) => card.id)).size, 53);
  assert.equal(labyrinthOfNightmarePack.releaseDate, "2001-07-12");
  assert.equal(labyrinthOfNightmarePack.cardIds.length, 53);
  assert.equal(labyrinthOfNightmareCards.filter((card) => card.cardType === "monster").length, 27);
  assert.equal(labyrinthOfNightmareCards.filter((card) => card.cardType === "spell").length, 15);
  assert.equal(labyrinthOfNightmareCards.filter((card) => card.cardType === "trap").length, 11);
});

test("代表カードの能力・レアリティ・融合素材が一致する", () => {
  assert.deepEqual(labyrinthOfNightmareCards.find((card) => card.id === "ln-14"), {
    id: "ln-14", name: "ダーク・ネクロフィア", cardType: "monster", kind: "悪魔族", attribute: "闇", level: 8, atk: 2200, def: 2800, rarity: "UR", effect: true,
  });
  assert.equal(labyrinthOfNightmareCards.find((card) => card.id === "ln-04")?.def, 2000);
  assert.equal(labyrinthOfNightmareCards.find((card) => card.id === "ln-53")?.rarity, "UR");
  assert.deepEqual(fusionRecipe("ln-26"), ["ln-23", "ln-25"]);
});

test("先行実装した装備・攻撃制限を裁定する", () => {
  assert.deepEqual(equippedMonsterStats(1200, 800, ["ln-44"]), { atk: 1500, def: 800 });
  assert.deepEqual(equippedMonsterStats(1500, 1200, ["ln-50"]), { atk: 2000, def: 1700 });
  assert.equal(paralyzingPotionPreventsAttack(["ln-48"]), true);
  assert.equal(piercingBattleDamage("tb-39", ["ln-44"], 1800, 1200, "defense"), 600);
  assert.equal(monsterCannotAttackDirectly("ln-23"), true);
  assert.equal(darkDoorPreventsAttack(1, ["ln-42"]), true);
  assert.equal(darkDoorPreventsAttack(0, ["ln-42"]), false);
  assert.equal(vengefulBogPreventsAttack(8, 8, ["ln-52"]), true);
  assert.equal(vengefulBogPreventsAttack(7, 8, ["ln-52"]), false);
});

test("トルネード・バード、ゾンバイア、王宮の号令を裁定する", () => {
  assert.equal(flipEffect("ln-21"), "return-two-spell-traps");
  assert.equal(zombairaAttackLossAfterDestroy("ln-23", 0, true), 200);
  assert.equal(zombairaAttackLossAfterDestroy("ln-23", 400, true), 600);
  assert.equal(zombairaAttackLossAfterDestroy("ln-23", 400, false), 400);
  assert.equal(zombairaAttackLossAfterDestroy("ln-22", 0, true), 0);
  assert.equal(royalCommandNegatesFlip(["ln-29"]), true);
  assert.equal(royalCommandNegatesFlip(["ln-29"], true), false);
  assert.equal(royalCommandNegatesFlip([]), false);
});

test("カード一覧・パック一覧へ統合され、対応済み表示を過大申告しない", () => {
  return readFile(new URL("../app/card-data.ts", import.meta.url), "utf8").then((source) => {
    assert.match(source, /\.\.\.labyrinthOfNightmareCards/);
    assert.match(source, /labyrinthOfNightmarePack/);
  }).then(() => readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8")).then((source) => {
    assert.match(source, /pending\.effect === "return-two-spell-traps"/);
    assert.match(source, /royalCommandNegatesFlip/);
    assert.match(source, /zombairaAttackLossAfterDestroy/);
  }).then(() => {
  assert.ok(labyrinthOfNightmareReadyCardIds.includes("ln-44"));
  assert.ok(labyrinthOfNightmareReadyCardIds.includes("ln-21"));
  assert.ok(labyrinthOfNightmareReadyCardIds.includes("ln-23"));
  assert.ok(labyrinthOfNightmareReadyCardIds.includes("ln-29"));
  assert.ok(!labyrinthOfNightmareReadyCardIds.includes("ln-14"));
  });
});
