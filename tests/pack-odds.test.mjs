import assert from "node:assert/strict";
import test from "node:test";
import { calculatePackCardOdds, calculateRareSlotOdds } from "../app/pack-odds.mjs";

test("通常カードは4枠のうち1枚以上出る確率を表示する", () => {
  const cards = Array.from({ length: 4 }, (_, index) => ({ id: `n${index}`, rarity: "N" }));
  const odds = calculatePackCardOdds(cards);
  assert.equal(odds[0].slot, "normal");
  assert.ok(Math.abs(odds[0].probability - (1 - 0.75 ** 4)) < 1e-12);
});

test("全レアリティ収録時はレア枠の基本排出率になる", () => {
  const cards = ["SE", "UR", "SR", "R"].map((rarity) => ({ id: rarity, rarity }));
  assert.deepEqual(calculateRareSlotOdds(cards), [
    { rarity: "SE", probability: 0.02 },
    { rarity: "UR", probability: 0.05 },
    { rarity: "SR", probability: 0.15 },
    { rarity: "R", probability: 0.78 },
  ]);
});

test("Booster 1のようにRだけならレア枠はR100%になる", () => {
  const cards = [
    ...Array.from({ length: 35 }, (_, index) => ({ id: `n${index}`, rarity: "N" })),
    ...Array.from({ length: 5 }, (_, index) => ({ id: `r${index}`, rarity: "R" })),
  ];
  const rarityOdds = calculateRareSlotOdds(cards);
  assert.equal(rarityOdds.find((item) => item.rarity === "R")?.probability, 1);
  const cardOdds = calculatePackCardOdds(cards);
  assert.equal(cardOdds.find((item) => item.cardId === "r0")?.probability, 0.2);
});
