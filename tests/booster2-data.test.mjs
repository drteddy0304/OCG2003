import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/booster2-data.ts", import.meta.url), "utf8");
const cardSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const newCards = source.match(/^\s*\{ id: "bo2-[^\n]+$/gm) ?? [];
const packBlock = source.match(/cardIds: \[([\s\S]+?)\]/)?.[1] ?? "";
const packIds = packBlock.match(/"(?:bo2|vol3)-[^"]+"/g) ?? [];

test("Booster 2は史実どおり新規35種類と再録5種類の全40種類になる", () => {
  assert.equal(newCards.length, 35);
  assert.equal(packIds.length, 40);
  assert.equal(new Set(packIds).size, 40);
  assert.match(source, /"vol3-rogue-doll"/);
  assert.match(source, /"vol3-ansatsu"/);
  assert.match(source, /"vol3-akihiron"/);
  assert.match(source, /"vol3-mabarrel"/);
  assert.match(source, /"vol3-giant-mech-soldier"/);
});

test("Booster 2はレア5種類・ノーマル35種類で登録する", () => {
  assert.equal(newCards.filter((line) => line.includes('rarity: "N"')).length, 35);
  assert.doesNotMatch(source, /rarity: "(?:SE|UR|SR|R)"/);
  assert.match(source, /name: "吸血ノミ"[^\n]+atk: 1500, def: 1200/);
  assert.match(source, /name: "機械の巨兵"|"vol3-giant-mech-soldier"/);
});

test("Booster 2は1999年5月25日発売の公式パックとして追加される", () => {
  assert.match(source, /id: "booster-2"[\s\S]+?releaseDate: "1999-05-25"[\s\S]+?category: "official"/);
  assert.match(cardSource, /import \{ boosterTwoCards, boosterTwoPack \}/);
  assert.match(cardSource, /\.\.\.boosterTwoCards/);
  assert.match(cardSource, /boosterTwoPack/);
});
