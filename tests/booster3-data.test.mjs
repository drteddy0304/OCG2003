import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/booster3-data.ts", import.meta.url), "utf8");
const cardSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
const fusionSource = await readFile(new URL("../app/fusion-rules.mjs", import.meta.url), "utf8");
const cards = source.match(/^\s*\{ id: "bo3-[^\n]+$/gm) ?? [];

test("Booster 3は史実どおり全40種類・レア5種類を収録する", () => {
  assert.equal(cards.length, 40);
  assert.equal(cards.filter((line) => line.includes('rarity: "R"')).length, 5);
  assert.equal(cards.filter((line) => line.includes('rarity: "N"')).length, 35);
  assert.equal(cards.filter((line) => line.includes('effect: true')).length, 4);
  assert.equal(cards.filter((line) => line.includes('fusion: true')).length, 4);
});

test("Booster 3の代表カードの能力値とカード種別が正しい", () => {
  assert.match(source, /name: "グレート・ホワイト"[^\n]+level: 4, atk: 1600, def: 800/);
  assert.match(source, /name: "勇気の砂時計"[^\n]+atk: 1100, def: 1200, rarity: "R", effect: true/);
  assert.match(source, /name: "血の代償", cardType: "trap", kind: "永続罠", rarity: "R"/);
  assert.match(source, /name: "古代の遠眼鏡", cardType: "spell"/);
});

test("Booster 3は1999年7月17日発売としてパック一覧へ追加される", () => {
  assert.match(source, /id: "booster-3"[\s\S]+releaseDate: "1999-07-17"[\s\S]+category: "official"/);
  assert.match(cardSource, /import \{ boosterThreeCards, boosterThreePack \}/);
  assert.match(cardSource, /\.\.\.boosterThreeCards/);
  assert.match(cardSource, /boosterThreePack/);
});

test("Booster 3の融合モンスター4体は正しい素材を使う", () => {
  assert.match(fusionSource, /"bo3-vermilion-sparrow": \["bo3-raimundos", "vol3-fireyarou"\]/);
  assert.match(fusionSource, /"bo3-death-bird": \["bo3-takuhee", "bo3-skull-temple"\]/);
  assert.match(fusionSource, /"bo3-kwagar-hercules": \["bo3-kuwagata-alpha", "bo3-hercules-beetle"\]/);
  assert.match(fusionSource, /"bo3-warrior-elimination": \["bo3-otome", "bo3-headless-beauty"\]/);
});
