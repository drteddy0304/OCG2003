import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fusionRecipe } from "../app/fusion-rules.mjs";

const source = await readFile(new URL("../app/booster7-data.ts", import.meta.url), "utf8");
const cardSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const cards = source.match(/^\s*\{ id: "bo7-[^\n]+$/gm) ?? [];
const reprints = source.match(/"vol7-(?:sword-queen|tremendous-fire|thunder-dragon|germ-infection|paralyzing-potion)"/g) ?? [];

test("Booster 7は新規35種類とVol.7再録5種類の全40種類になる", () => {
  assert.equal(cards.length, 35);
  assert.equal(reprints.length, 5);
  assert.equal(new Set(reprints).size, 5);
});

test("Booster 7は通常18・効果12・融合2・通常魔法3・装備4・罠1の内訳を持つ", () => {
  const monsters = cards.filter((line) => line.includes('cardType: "monster"'));
  assert.equal(monsters.filter((line) => !line.includes("effect: true") && !line.includes("fusion: true")).length, 18);
  assert.equal(monsters.filter((line) => line.includes("effect: true")).length + 2, 12);
  assert.equal(monsters.filter((line) => line.includes("fusion: true")).length, 2);
  assert.equal(cards.filter((line) => line.includes('kind: "通常魔法"')).length + 1, 3);
  assert.equal(cards.filter((line) => line.includes('kind: "装備魔法"')).length + 2, 4);
  assert.equal(cards.filter((line) => line.includes('cardType: "trap"')).length, 1);
  assert.equal(cards.filter((line) => line.includes('rarity: "N"')).length, 35);
  assert.match(source, /name: "地雷蜘蛛"[^\n]+atk: 2200, def: 100/);
});

test("Booster 7は2000年3月1日発売としてパック一覧へ追加される", () => {
  assert.match(source, /id: "booster-7"[\s\S]+releaseDate: "2000-03-01"[\s\S]+category: "official"/);
  assert.match(cardSource, /import \{ boosterSevenCards, boosterSevenPack \}/);
  assert.match(cardSource, /\.\.\.boosterSevenCards/);
  assert.match(cardSource, /boosterSevenPack/);
});

test("Booster 7の融合2種は正しい素材を判定する", () => {
  assert.deepEqual(fusionRecipe("bo7-fiend-box"), ["bo7-crass-clown", "bo7-dream-clown"]);
  assert.deepEqual(fusionRecipe("bo7-skull-bishop"), ["bo7-wisdom-devil", "bo7-makenro"]);
});
