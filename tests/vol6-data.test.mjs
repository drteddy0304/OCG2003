import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/vol6-data.ts", import.meta.url), "utf8");
const packSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const vol6Cards = source.match(/^\s*\{ id: "vol6-[^\n]+$/gm) ?? [];

test("Vol.6は公式どおり全52種類と正しいレアリティ内訳を持つ", () => {
  assert.equal(vol6Cards.length, 52);
  assert.equal(vol6Cards.filter((line) => line.includes('rarity: "SE"')).length, 2);
  assert.equal(vol6Cards.filter((line) => line.includes('rarity: "UR"')).length, 4);
  assert.equal(vol6Cards.filter((line) => line.includes('rarity: "SR"')).length, 3);
  assert.equal(vol6Cards.filter((line) => line.includes('rarity: "R"')).length, 5);
  assert.equal(vol6Cards.filter((line) => line.includes('rarity: "N"')).length, 38);
});

test("Vol.6の代表カードは公式能力値とカード種別を保持する", () => {
  assert.match(source, /name: "グレート・モス"[^\n]+level: 8, atk: 2600, def: 2500, rarity: "SE", effect: true/);
  assert.match(source, /name: "千年竜"[^\n]+level: 7, atk: 2400, def: 2000, rarity: "SE", fusion: true/);
  assert.match(source, /name: "神の宣告"[^\n]+cardType: "trap"[^\n]+kind: "カウンター罠", rarity: "UR"/);
});

test("Vol.6パックは1999年11月18日発売として登録される", () => {
  assert.match(packSource, /id: "vol-6",[\s\S]+?releaseDate: "1999-11-18",[\s\S]+?startsWith\("vol6-"\)/);
});
