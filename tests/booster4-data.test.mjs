import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fusionRecipe } from "../app/fusion-rules.mjs";

const source = await readFile(new URL("../app/booster4-data.ts", import.meta.url), "utf8");
const cardSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const arenaSource = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
const cards = source.match(/^\s*\{ id: "bo4-[^\n]+$/gm) ?? [];
const reprints = source.match(/"vol4-(?:warrior-elimination|acid-storm|insecticide|breath-god|eternal-drought)"/g) ?? [];

test("Booster 4は新規35種類とVol.4再録5種類の全40種類になる", () => {
  assert.equal(cards.length, 35);
  assert.equal(reprints.length, 5);
  assert.equal(new Set(reprints).size, 5);
});

test("Booster 4は効果5・融合2・魔法6・罠2の史実どおりの内訳を持つ", () => {
  assert.equal(cards.filter((line) => line.includes("effect: true")).length, 5);
  assert.equal(cards.filter((line) => line.includes("fusion: true")).length, 2);
  assert.equal(cards.filter((line) => line.includes('cardType: "spell"')).length + reprints.length, 6);
  assert.equal(cards.filter((line) => line.includes('cardType: "trap"')).length, 2);
  assert.match(source, /name: "ヂェミナイ・エルフ"[^\n]+atk: 1900, def: 900/);
});

test("Booster 4は1999年8月26日発売としてパック一覧へ追加される", () => {
  assert.match(source, /id: "booster-4"[\s\S]+releaseDate: "1999-08-26"[\s\S]+category: "official"/);
  assert.match(cardSource, /import \{ boosterFourCards, boosterFourPack \}/);
  assert.match(cardSource, /\.\.\.boosterFourCards/);
  assert.match(cardSource, /boosterFourPack/);
});

test("3体融合を含むBooster 4の融合素材を判定できる", () => {
  assert.deepEqual(fusionRecipe("bo4-aqua-dragon"), ["bo4-fairy-dragon", "bo4-warrior-of-tradition", "bo4-zone-eater"]);
  assert.deepEqual(fusionRecipe("bo4-black-shark"), ["bo4-sea-kamen", "bo4-killer-blob", "bo4-warrior-of-tradition"]);
  assert.match(arenaSource, /pendingFusion\.selected\.length === \(fusionRecipe\(pendingFusion\.fusionId\)\?\.length/);
});
