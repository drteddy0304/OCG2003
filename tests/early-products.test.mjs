import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/early-product-data.ts", import.meta.url), "utf8");
const boosterCards = [...source.matchAll(/id: "bo1-[^"]+"/g)];
const starterCards = [...source.matchAll(/id: "stb-[^"]+"/g)];

test("Booster 1は史実どおり新規35種類と再録5種類の全40種類になる", () => {
  assert.equal(boosterCards.length, 35);
  assert.match(source, /"vol1-legendary-sword"/);
  assert.match(source, /"vol1-beast-fangs"/);
  assert.match(source, /"vol1-violet-crystal"/);
  assert.match(source, /"vol1-book-secret-arts"/);
  assert.match(source, /"vol1-power-kaishin"/);
});

test("STARTER BOX通常版は分割せず史実どおり全50種類で扱う", () => {
  assert.equal(starterCards.length, 50);
  assert.match(source, /id: "starter-box", name: "STARTER BOX"[^\n]+category: "official", cardIds: starterBoxIds/);
  assert.doesNotMatch(source, /starter-box-a|starter-box-b|STARTER BOX 前編|STARTER BOX 後編/);
});

test("代表カードの能力・レアリティを保持する", () => {
  assert.match(source, /id: "bo1-gargoyle"[^\n]+atk: 1000, def: 500, rarity: "N"/);
  assert.match(source, /id: "stb-blue-eyes"[^\n]+atk: 3000, def: 2500, rarity: "UR"/);
  assert.match(source, /id: "stb-raigeki"[^\n]+rarity: "SR"/);
});
