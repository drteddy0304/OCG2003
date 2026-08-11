import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/vol7-data.ts", import.meta.url), "utf8");
const packSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const vol7Cards = source.match(/^\s*\{ id: "vol7-[^\n]+$/gm) ?? [];

test("Vol.7は公式どおり全52種類と正しいレアリティ内訳を持つ", () => {
  assert.equal(vol7Cards.length, 52);
  assert.equal(vol7Cards.filter((line) => line.includes('rarity: "SE"')).length, 1);
  assert.equal(vol7Cards.filter((line) => line.includes('rarity: "UR"')).length, 3);
  assert.equal(vol7Cards.filter((line) => line.includes('rarity: "SR"')).length, 4);
  assert.equal(vol7Cards.filter((line) => line.includes('rarity: "R"')).length, 5);
  assert.equal(vol7Cards.filter((line) => line.includes('rarity: "N"')).length, 39);
});

test("Vol.7のカード種別内訳と代表カードの能力値が正しい", () => {
  assert.equal(vol7Cards.filter((line) => line.includes('cardType: "monster"')).length, 44);
  assert.equal(vol7Cards.filter((line) => line.includes('effect: true')).length, 12);
  assert.equal(vol7Cards.filter((line) => line.includes('fusion: true')).length, 4);
  assert.equal(vol7Cards.filter((line) => line.includes('cardType: "spell"')).length, 6);
  assert.equal(vol7Cards.filter((line) => line.includes('cardType: "trap"')).length, 2);
  assert.match(source, /name: "リボルバー・ドラゴン"[^\n]+level: 7, atk: 2600, def: 2200, rarity: "UR", effect: true/);
  assert.match(source, /name: "双頭の雷龍"[^\n]+level: 7, atk: 2800, def: 2100, rarity: "UR", fusion: true/);
  assert.match(source, /name: "聖なるバリア －ミラーフォース－"[^\n]+kind: "通常罠", rarity: "SE"/);
});

test("Vol.7パックは2000年1月27日発売として登録される", () => {
  assert.match(packSource, /id: "vol-7",[\s\S]+?releaseDate: "2000-01-27",[\s\S]+?startsWith\("vol7-"\)/);
});
