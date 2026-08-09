import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/vol5-data.ts", import.meta.url), "utf8");
const packSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const vol5Cards = source.match(/^\s*\{ id: "vol5-[^\n]+$/gm) ?? [];

test("Vol.5は公式どおり全50種類と正しいレアリティ内訳を持つ", () => {
  assert.equal(vol5Cards.length, 50);
  assert.equal(vol5Cards.filter((line) => line.includes('rarity: "UR"')).length, 4);
  assert.equal(vol5Cards.filter((line) => line.includes('rarity: "SR"')).length, 3);
  assert.equal(vol5Cards.filter((line) => line.includes('rarity: "R"')).length, 5);
  assert.equal(vol5Cards.filter((line) => line.includes('rarity: "N"')).length, 38);
});

test("Vol.5の代表カードの能力値を保持する", () => {
  assert.match(source, /name: "ブラック・デーモンズ・ドラゴン"[^\n]+level: 9, atk: 3200, def: 2500, rarity: "UR", fusion: true/);
  assert.match(source, /name: "雷魔神－サンガ"[^\n]+level: 7, atk: 2600, def: 2200, rarity: "SR", effect: true/);
  assert.match(source, /name: "偽物のわな"[^\n]+cardType: "trap"[^\n]+rarity: "N"/);
});

test("Vol.5パックは1999年9月23日発売として登録される", () => {
  assert.match(packSource, /id: "vol-5",[\s\S]+?releaseDate: "1999-09-23",[\s\S]+?startsWith\("vol5-"\)/);
});
