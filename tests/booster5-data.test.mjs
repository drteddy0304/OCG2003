import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fusionRecipe } from "../app/fusion-rules.mjs";

const source = await readFile(new URL("../app/booster5-data.ts", import.meta.url), "utf8");
const cardSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const cards = source.match(/^\s*\{ id: "bo5-[^\n]+$/gm) ?? [];
const reprints = source.match(/"vol5-(?:anti-raigeki|call-darkness)"/g) ?? [];

test("Booster 5は新規38種類とVol.5再録2種類の全40種類になる", () => {
  assert.equal(cards.length, 38);
  assert.equal(reprints.length, 2);
  assert.equal(new Set(reprints).size, 2);
});

test("Booster 5は通常25・効果7・融合4・罠4の史実どおりの内訳を持つ", () => {
  const monsters = cards.filter((line) => line.includes('cardType: "monster"'));
  assert.equal(monsters.filter((line) => !line.includes("effect: true") && !line.includes("fusion: true")).length, 25);
  assert.equal(monsters.filter((line) => line.includes("effect: true")).length, 7);
  assert.equal(monsters.filter((line) => line.includes("fusion: true")).length, 4);
  assert.equal(cards.filter((line) => line.includes('cardType: "trap"')).length + reprints.length, 4);
  assert.equal(cards.filter((line) => line.includes('rarity: "R"')).length + reprints.length, 5);
  assert.match(source, /name: "機械王"[^\n]+atk: 2200, def: 2000/);
});

test("Booster 5は1999年10月17日発売としてパック一覧へ追加される", () => {
  assert.match(source, /id: "booster-5"[\s\S]+releaseDate: "1999-10-17"[\s\S]+category: "official"/);
  assert.match(cardSource, /import \{ boosterFiveCards, boosterFivePack \}/);
  assert.match(cardSource, /\.\.\.boosterFiveCards/);
  assert.match(cardSource, /boosterFivePack/);
});

test("Booster 5の融合4種は正しい素材を判定する", () => {
  assert.deepEqual(fusionRecipe("bo5-soul-hunter"), ["bo5-genie-lamp", "bo5-invader-another-dimension"]);
  assert.deepEqual(fusionRecipe("bo5-brachio-raidus"), ["bo5-two-headed-king-rex", "bo5-crawling-dragon-2"]);
  assert.deepEqual(fusionRecipe("bo5-golden-elephant"), ["bo5-medusa-ghost", "bo5-dragon-zombie"]);
  assert.deepEqual(fusionRecipe("bo5-marine-beast"), ["bo5-water-magician", "bo5-behegon"]);
});
