import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fusionRecipe } from "../app/fusion-rules.mjs";

const source = await readFile(new URL("../app/booster6-data.ts", import.meta.url), "utf8");
const cardSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const cards = source.match(/^\s*\{ id: "bo6-[^\n]+$/gm) ?? [];
const reprints = source.match(/"vol6-(?:hoshiningen|star-boy|little-chimera|bladefly|witch-apprentice)"/g) ?? [];

test("Booster 6は新規35種類とVol.6再録5種類の全40種類になる", () => {
  assert.equal(cards.length, 35);
  assert.equal(reprints.length, 5);
  assert.equal(new Set(reprints).size, 5);
});

test("Booster 6は通常16・効果14・融合5・魔法4・罠1の史実どおりの内訳を持つ", () => {
  const monsters = cards.filter((line) => line.includes('cardType: "monster"'));
  assert.equal(monsters.filter((line) => !line.includes("effect: true") && !line.includes("fusion: true")).length, 16);
  assert.equal(monsters.filter((line) => line.includes("effect: true")).length + reprints.length, 14);
  assert.equal(monsters.filter((line) => line.includes("fusion: true")).length, 5);
  assert.equal(cards.filter((line) => line.includes('cardType: "spell"')).length, 4);
  assert.equal(cards.filter((line) => line.includes('cardType: "trap"')).length, 1);
  assert.equal(cards.filter((line) => line.includes('rarity: "N"')).length, 35);
  assert.match(source, /name: "牛鬼"[^\n]+atk: 2150, def: 1950/);
});

test("Booster 6は1999年12月1日発売としてパック一覧へ追加される", () => {
  assert.match(source, /id: "booster-6"[\s\S]+releaseDate: "1999-12-01"[\s\S]+category: "official"/);
  assert.match(cardSource, /import \{ boosterSixCards, boosterSixPack \}/);
  assert.match(cardSource, /\.\.\.boosterSixCards/);
  assert.match(cardSource, /boosterSixPack/);
});

test("Booster 6の融合5種は正しい素材を判定する", () => {
  assert.deepEqual(fusionRecipe("bo6-kaiser-dragon"), ["vol4-winged-dragon-fortress", "bo4-fairy-dragon"]);
  assert.deepEqual(fusionRecipe("bo6-crimson-sunbird"), ["bo4-saint-bird", "vol3-skull-red-bird"]);
  assert.deepEqual(fusionRecipe("bo6-sand-witch"), ["vol3-giant-soldier-stone", "vol4-ancient-elf"]);
  assert.deepEqual(fusionRecipe("bo6-skelgon"), ["bo5-medusa-ghost", "vol6-blackland-fire-dragon"]);
  assert.deepEqual(fusionRecipe("bo6-amphibious-bugroth"), ["vol4-ground-bagroth", "bo6-sea-guardian"]);
});
