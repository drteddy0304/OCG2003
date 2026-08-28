import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { promo1999Cards, promo1999Pack } from "../app/promo-1999-data.ts";
import { fusionRecipe } from "../app/fusion-rules.mjs";
import { canNormalSummonMonster } from "../app/duel-rules.mjs";

test("1999年の非パック配布カードを重複なしの40種に集約する", () => {
  assert.equal(promo1999Pack.category, "original");
  assert.equal(promo1999Pack.cardIds.length, 40);
  assert.equal(new Set(promo1999Pack.cardIds).size, 40);
  assert.equal(promo1999Cards.length, 38);
  assert.ok(promo1999Pack.cardIds.includes("stb-flame-swordsman"));
  assert.ok(promo1999Pack.cardIds.includes("ex-009"));
  const cardDataSource = readFileSync(new URL("../app/card-data.ts", import.meta.url), "utf8");
  assert.match(cardDataSource, /\.\.\.promo1999Cards/);
  assert.match(cardDataSource, /promo1999Pack/);
});

test("東京ドームと書籍・ゲーム特典の代表カード能力を保持する", () => {
  const ultimate = promo1999Cards.find((card) => card.id === "pr99-blue-eyes-ultimate");
  const aquaMadoor = promo1999Cards.find((card) => card.id === "pr99-aqua-madoor");
  const blackChaos = promo1999Cards.find((card) => card.id === "pr99-black-chaos-magician");
  assert.deepEqual({ atk: ultimate?.atk, def: ultimate?.def, fusion: ultimate?.fusion }, { atk: 4500, def: 3800, fusion: true });
  assert.deepEqual({ atk: aquaMadoor?.atk, def: aquaMadoor?.def }, { atk: 1200, def: 2000 });
  assert.deepEqual({ ritual: blackChaos?.ritual, effect: blackChaos?.effect }, { ritual: true, effect: undefined });
  assert.deepEqual(fusionRecipe("pr99-meteor-black-dragon"), ["vol3-red-eyes", "pr99-meteor-dragon"]);
  assert.equal(canNormalSummonMonster("pr99-perfect-moth"), false);
});

test("ゲーム内プロモパックには全レア度の排出枠がある", () => {
  const rarities = new Set(Object.values(promo1999Pack.rarityOverrides ?? {}));
  assert.deepEqual([...rarities].sort(), ["N", "R", "SE", "SR", "UR"]);
});
