import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/magic-ruler-data.ts", import.meta.url), "utf8");
const cardSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const cards = source.match(/^\s*\{ id: "mr-[^\n]+$/gm) ?? [];

test("Magic Rulerは発売当時の全50種類を収録する", () => {
  assert.equal(cards.length, 50);
  assert.equal(new Set(cards.map((line) => line.match(/id: "([^"]+)/)?.[1])).size, 50);
  assert.match(source, /id: "magic-ruler"[\s\S]+releaseDate: "2000-04-20"[\s\S]+category: "official"/);
});

test("Magic Rulerのカード種別とレアリティを保持する", () => {
  assert.equal(cards.filter((line) => line.includes('cardType: "monster"')).length, 25);
  assert.equal(cards.filter((line) => line.includes('cardType: "spell"')).length, 22);
  assert.equal(cards.filter((line) => line.includes('cardType: "trap"')).length, 3);
  assert.equal(cards.filter((line) => line.includes('rarity: "UR"')).length, 3);
  assert.equal(cards.filter((line) => line.includes('rarity: "SR"')).length, 4);
  assert.equal(cards.filter((line) => line.includes('rarity: "R"')).length, 4);
  assert.equal(cards.filter((line) => line.includes('rarity: "N"')).length, 39);
});

test("Magic Rulerはカード一覧とパック一覧へ登録される", () => {
  assert.match(cardSource, /import \{ magicRulerCards, magicRulerPack \}/);
  assert.match(cardSource, /\.\.\.magicRulerCards/);
  assert.match(cardSource, /magicRulerPack/);
});
