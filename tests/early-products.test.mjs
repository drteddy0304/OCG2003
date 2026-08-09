import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/early-product-data.ts", import.meta.url), "utf8");
const boosterCards = [...source.matchAll(/id: "bo1-[^"]+"/g)];
const starterCards = [...source.matchAll(/id: "stb-[^"]+"/g)];

test("Booster 1は再録5枚を含めて40種類になる", () => {
  assert.equal(boosterCards.length, 35);
  assert.match(source, /"vol1-legendary-sword"/);
  assert.match(source, /"vol1-beast-fangs"/);
  assert.match(source, /"vol1-violet-crystal"/);
  assert.match(source, /"vol1-book-secret-arts"/);
  assert.match(source, /"vol1-power-kaishin"/);
});

test("STARTER BOX通常版50種類を40種類ずつの前編・後編に分ける", () => {
  assert.equal(starterCards.length, 50);
  assert.match(source, /starterBoxIds\.slice\(0, 40\)/);
  assert.match(source, /\.\.\.starterBoxIds\.slice\(40\), \.\.\.starterBoxIds\.slice\(0, 30\)/);
});

test("代表カードの能力・レアリティを保持する", () => {
  assert.match(source, /id: "bo1-gargoyle"[^\n]+atk: 1000, def: 500, rarity: "N"/);
  assert.match(source, /id: "stb-blue-eyes"[^\n]+atk: 3000, def: 2500, rarity: "UR"/);
  assert.match(source, /id: "stb-raigeki"[^\n]+rarity: "SR"/);
});
