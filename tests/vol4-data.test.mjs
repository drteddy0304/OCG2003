import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const vol4Cards = source.match(/^\s*\{ id: "vol4-[^\n]+$/gm) ?? [];

test("Vol.4は公式どおり全50種類と正しいレアリティ内訳を持つ", () => {
  assert.equal(vol4Cards.length, 50);
  assert.equal(vol4Cards.filter((line) => line.includes('rarity: "SE"')).length, 1);
  assert.equal(vol4Cards.filter((line) => line.includes('rarity: "UR"')).length, 3);
  assert.equal(vol4Cards.filter((line) => line.includes('rarity: "SR"')).length, 3);
  assert.equal(vol4Cards.filter((line) => line.includes('rarity: "R"')).length, 5);
  assert.equal(vol4Cards.filter((line) => line.includes('rarity: "N"')).length, 38);
});

test("Vol.4の代表カードの能力値を保持する", () => {
  assert.match(source, /name: "デーモンの召喚"[^\n]+level: 6, atk: 2500, def: 1200, rarity: "UR"/);
  assert.match(source, /name: "進化の繭"[^\n]+level: 3, atk: 0, def: 2000, rarity: "SR", effect: true/);
  assert.match(source, /name: "ハーピィ・レディ三姉妹"[^\n]+level: 6, atk: 1950, def: 2100, rarity: "SE"/);
});

test("Vol.4パックは1999年7月22日発売として登録される", () => {
  assert.match(source, /id: "vol-4",[\s\S]+?releaseDate: "1999-07-22",[\s\S]+?startsWith\("vol4-"\)/);
});
